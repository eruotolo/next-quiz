'use server';

import { prisma } from '@/shared/lib/prisma';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import {
    signupFreeSchema,
    payerSchema,
    registrationSchema,
} from '@/features/subscriptions/schemas/signup.schemas';
import { normalizeRut } from '@/shared/lib/rut';
import { USER_ROLE } from '@/shared/lib/roles';
import { createPreapproval, getAutoRecurring } from '@/features/subscriptions/lib/mercadopago';
import type { PaidPlan, Billing } from '@/features/subscriptions/lib/mercadopago';
import bcrypt from 'bcryptjs';

function toSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 60);
}

async function generateUniqueSlug(name: string): Promise<string> {
    const base = toSlug(name);
    let slug = base;
    for (let i = 1; i <= 20; i++) {
        const exists = await prisma.academicInstitution.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (!exists) return slug;
        slug = `${base}-${i}`;
    }
    return `${base}-${Date.now()}`;
}

export async function registerFreeInstitution(
    data: unknown,
): Promise<{ data: { slug: string } | null; error: string | null }> {
    const parsed = signupFreeSchema.safeParse(data);
    if (!parsed.success) {
        return { data: null, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
    }

    const {
        institutionName,
        institutionPhone,
        institutionCity,
        adminName,
        adminLastname,
        adminEmail,
        adminRut,
        adminPassword,
    } = parsed.data;

    const normalizedAdminRut = normalizeRut(adminRut);

    const [emailExists, rutExists] = await Promise.all([
        prisma.user.findUnique({ where: { email: adminEmail }, select: { id: true } }),
        prisma.user.findUnique({ where: { rut: normalizedAdminRut }, select: { id: true } }),
    ]);

    if (emailExists) return { data: null, error: 'El email ya está registrado en la plataforma.' };
    if (rutExists) return { data: null, error: 'El RUT ya está registrado en la plataforma.' };

    const slug = await generateUniqueSlug(institutionName);
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    try {
        const adminRole = await prisma.userRole.findUniqueOrThrow({
            where: { name: USER_ROLE.ADMIN },
        });

        const { institutionId, userId } = await prisma.$transaction(async (tx) => {
            const institution = await tx.academicInstitution.create({
                data: {
                    name: institutionName,
                    slug,
                    phone: institutionPhone,
                    address: institutionCity,
                    city: institutionCity,
                    country: 'Chile',
                    plan: 'FREE',
                    active: true,
                    activatedAt: new Date(),
                },
                select: { id: true },
            });

            const user = await tx.user.create({
                data: {
                    name: adminName,
                    lastname: adminLastname,
                    email: adminEmail,
                    rut: normalizedAdminRut,
                    password: hashedPassword,
                    userRoleId: adminRole.id,
                    academicInstitutionId: institution.id,
                },
                select: { id: true },
            });

            return { institutionId: institution.id, userId: user.id };
        });

        await logAudit({
            action: AUDIT_ACTION.INSTITUTION_CREATE,
            actorId: userId,
            actorEmail: adminEmail,
            actorRole: USER_ROLE.ADMIN,
            academicInstitutionId: institutionId,
            entity: 'AcademicInstitution',
            entityId: institutionId,
            metadata: { plan: 'FREE', selfService: true },
        });

        return { data: { slug }, error: null };
    } catch (err) {
        const msg =
            err instanceof Error && err.message.includes('Unique')
                ? 'El establecimiento o email ya está registrado.'
                : 'Error al crear la cuenta. Intentá de nuevo.';
        return { data: null, error: msg };
    }
}

export async function createPaidCheckout(
    data: unknown,
    plan: PaidPlan,
): Promise<{ data: { initPoint: string | null; subscriptionId: string } | null; error: string | null }> {
    const parsed = payerSchema.safeParse(data);
    if (!parsed.success) {
        return { data: null, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
    }

    const { payerName, payerLastname, payerEmail, billing } = parsed.data;

    try {
        const autoRecurring = getAutoRecurring(plan, billing as Billing);
        const backUrlBase = process.env.MP_BACK_URL_BASE ?? 'https://www.aulika.cl';
        const planSlug = plan.toLowerCase();
        const billingLabel = billing === 'monthly' ? 'mensual' : 'anual';

        const subscription = await prisma.subscription.create({
            data: {
                plan,
                billing,
                status: 'pending',
                metadata: { payerName, payerLastname, payerEmail },
            },
            select: { id: true },
        });

        const { initPoint, mpSubscriptionId, mpStatus } = await createPreapproval({
            reason: `Aulika · Plan ${plan.charAt(0) + plan.slice(1).toLowerCase()} (${billingLabel})`,
            autoRecurring,
            payerEmail,
            externalReference: subscription.id,
            backUrl: `${backUrlBase}/registro/${planSlug}/exito?sub=${subscription.id}`,
        });

        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                mpSubscriptionId,
                status: mpStatus === 'authorized' ? 'authorized' : 'pending',
            },
        });

        return { data: { initPoint, subscriptionId: subscription.id }, error: null };
    } catch (err) {
        const msg =
            err instanceof Error
                ? err.message
                : typeof err === 'object' && err !== null && 'message' in err
                  ? String((err as { message: unknown }).message)
                  : 'Error al iniciar el pago.';
        return { data: null, error: msg };
    }
}

export async function getSubscriptionStatus(
    subscriptionId: string,
): Promise<{ data: { status: string; institutionSlug: string | null } | null; error: string | null }> {
    const sub = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        select: {
            status: true,
            mpSubscriptionId: true,
            academicInstitution: { select: { slug: true } },
        },
    });

    if (!sub) return { data: null, error: 'Suscripción no encontrada.' };

    // When pending and MP subscription exists, check MP directly (handles testing without webhook)
    if (sub.status === 'pending' && sub.mpSubscriptionId) {
        const token = process.env.MP_ACCESS_TOKEN;
        if (token) {
            try {
                const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${sub.mpSubscriptionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    next: { revalidate: 0 },
                });
                if (mpRes.ok) {
                    const mpData = (await mpRes.json()) as { status?: string };
                    if (mpData.status === 'authorized') {
                        await prisma.subscription.update({
                            where: { id: subscriptionId },
                            data: { status: 'authorized' },
                        });
                        return { data: { status: 'authorized', institutionSlug: sub.academicInstitution?.slug ?? null }, error: null };
                    }
                }
            } catch {
                // If MP polling fails, fall through to return local status
            }
        }
    }

    return {
        data: {
            status: sub.status,
            institutionSlug: sub.academicInstitution?.slug ?? null,
        },
        error: null,
    };
}

export async function completeRegistration(
    data: unknown,
): Promise<{ data: { slug: string } | null; error: string | null }> {
    const parsed = registrationSchema.safeParse(data);
    if (!parsed.success) {
        return { data: null, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
    }

    const {
        subscriptionId,
        institutionName,
        institutionPhone,
        institutionCity,
        adminName,
        adminLastname,
        adminEmail,
        adminRut,
        adminPassword,
    } = parsed.data;

    const sub = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        select: { id: true, status: true, plan: true, academicInstitutionId: true },
    });

    if (!sub) return { data: null, error: 'Suscripción no encontrada.' };
    if (sub.status !== 'authorized')
        return { data: null, error: 'El pago aún no fue confirmado. Esperá unos segundos e intentá de nuevo.' };
    if (sub.academicInstitutionId !== null)
        return { data: null, error: 'Esta suscripción ya tiene una institución registrada.' };

    const normalizedAdminRut = normalizeRut(adminRut);

    const [emailExists, rutExists] = await Promise.all([
        prisma.user.findUnique({ where: { email: adminEmail }, select: { id: true } }),
        prisma.user.findUnique({ where: { rut: normalizedAdminRut }, select: { id: true } }),
    ]);

    if (emailExists) return { data: null, error: 'El email ya está registrado en la plataforma.' };
    if (rutExists) return { data: null, error: 'El RUT ya está registrado en la plataforma.' };

    const slug = await generateUniqueSlug(institutionName);
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    try {
        const adminRole = await prisma.userRole.findUniqueOrThrow({
            where: { name: USER_ROLE.ADMIN },
        });

        const { institutionId, userId } = await prisma.$transaction(async (tx) => {
            const institution = await tx.academicInstitution.create({
                data: {
                    name: institutionName,
                    slug,
                    phone: institutionPhone,
                    address: institutionCity,
                    city: institutionCity,
                    country: 'Chile',
                    plan: sub.plan,
                    active: true,
                    activatedAt: new Date(),
                },
                select: { id: true },
            });

            const user = await tx.user.create({
                data: {
                    name: adminName,
                    lastname: adminLastname,
                    email: adminEmail,
                    rut: normalizedAdminRut,
                    password: hashedPassword,
                    userRoleId: adminRole.id,
                    academicInstitutionId: institution.id,
                },
                select: { id: true },
            });

            await tx.subscription.update({
                where: { id: subscriptionId },
                data: {
                    academicInstitutionId: institution.id,
                    status: 'active',
                    startedAt: new Date(),
                },
            });

            return { institutionId: institution.id, userId: user.id };
        });

        await logAudit({
            action: AUDIT_ACTION.INSTITUTION_CREATE,
            actorId: userId,
            actorEmail: adminEmail,
            actorRole: USER_ROLE.ADMIN,
            academicInstitutionId: institutionId,
            entity: 'AcademicInstitution',
            entityId: institutionId,
            metadata: { plan: sub.plan, selfService: true, subscriptionId },
        });

        return { data: { slug }, error: null };
    } catch (err) {
        const msg =
            err instanceof Error && err.message.includes('Unique')
                ? 'El establecimiento o email ya está registrado.'
                : 'Error al registrar. Intentá de nuevo.';
        return { data: null, error: msg };
    }
}
