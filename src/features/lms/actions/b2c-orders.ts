'use server';

import { prisma } from '@/shared/lib/prisma';
import { normalizeRut } from '@/shared/lib/rut';
import { createPreference } from '@/features/subscriptions/lib/mercadopago';
import {
    b2cCheckoutSchema,
    type B2cCheckoutInput,
} from '@/features/subscriptions/schemas/b2c-checkout.schemas';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { generateActivationToken } from '@/features/lms/lib/activation-token';

interface CheckoutResult {
    initPoint: string | null;
    orderId: string;
}

/**
 * Crea una `LmsOrder` en estado PENDIENTE y devuelve el `init_point` de
 * MercadoPago para redirigir al comprador. La matriculación real (crear
 * `User`, `LmsEnrollment`, token de activación, email) la dispara el
 * webhook `/api/webhooks/mercadopago-b2c` al confirmarse el pago.
 */
export async function createLmsCheckoutPreference(
    slug: string,
    data: unknown,
): Promise<{ data: CheckoutResult | null; error: string | null }> {
    const parsed = b2cCheckoutSchema.safeParse(data);
    if (!parsed.success) {
        return { data: null, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
    }
    const input: B2cCheckoutInput = parsed.data;
    const rut = normalizeRut(input.studentRut);
    const email = input.studentEmail.toLowerCase();

    const inst = await prisma.academicInstitution.findUnique({
        where: { slug },
        select: { id: true, name: true, active: true },
    });
    if (!inst || !inst.active) {
        return { data: null, error: 'Institución no encontrada.' };
    }

    const course = await prisma.lmsCourse.findFirst({
        where: {
            id: input.courseId,
            academicInstitutionId: inst.id,
            isPublic: true,
            published: true,
        },
        select: { id: true, title: true, price: true },
    });
    if (!course) {
        return { data: null, error: 'Curso no disponible para inscripción.' };
    }

    const price = course.price ?? 0;
    if (price <= 0) {
        return { data: null, error: 'Este curso es gratuito. Inscribite desde la página del curso.' };
    }

    // Anti-IDOR: el RUT/email no debe pertenecer a otra institución, ni a un
    // admin/profesor de esta (el flujo B2C es exclusivo para estudiantes).
    const existing = await prisma.user.findFirst({
        where: {
            OR: [{ rut }, { email }],
            academicInstitutionId: { not: inst.id },
        },
        select: { id: true },
    });
    if (existing) {
        return {
            data: null,
            error: 'Tu RUT o email ya está registrado en otra institución.',
        };
    }

    // Si ya existe un user en esta institución pero no matriculado, dejamos
    // pasar (el webhook lo vinculará al actualizar el user existente).
    // Si ya compró este curso y está aprobado, error claro.
    const priorOrder = await prisma.lmsOrder.findFirst({
        where: {
            studentRut: rut,
            courseId: course.id,
            status: 'APROBADO',
        },
        select: { id: true },
    });
    if (priorOrder) {
        return {
            data: null,
            error: 'Ya compraste este curso. Revisá tu email para activar la cuenta.',
        };
    }

    const order = await prisma.lmsOrder.create({
        data: {
            studentRut: rut,
            studentName: input.studentName.trim(),
            studentLastname: input.studentLastname.trim(),
            studentEmail: email,
            courseId: course.id,
            amount: price,
            status: 'PENDIENTE',
        },
        select: { id: true },
    });

    const backUrlBase = process.env.MP_BACK_URL_BASE ?? 'https://www.aulika.cl';
    const backUrl = `${backUrlBase}/${slug}/checkout/${course.id}/exito?order=${order.id}`;

    try {
        const { initPoint, preferenceId } = await createPreference({
            item: {
                title: `${course.title} · ${inst.name}`,
                unitPrice: price,
            },
            payerEmail: email,
            payerName: input.studentName.trim(),
            payerSurname: input.studentLastname.trim(),
            externalReference: order.id,
            backUrls: {
                success: `${backUrl}?status=approved`,
                pending: `${backUrl}?status=pending`,
                failure: `${backUrl}?status=rejected`,
            },
        });

        await prisma.lmsOrder.update({
            where: { id: order.id },
            data: { mpPreferenceId: preferenceId },
        });

        await logAudit({
            action: AUDIT_ACTION.SUBSCRIPTION_CREATE,
            actorEmail: email,
            actorRole: 'Estudiante',
            academicInstitutionId: inst.id,
            entity: 'LmsOrder',
            entityId: order.id,
            metadata: { courseId: course.id, slug, source: 'b2c-checkout' },
        });

        return { data: { initPoint, orderId: order.id }, error: null };
    } catch (err) {
        // Si MP falla, marcamos la orden como RECHAZADO para no dejar PENDIENTE huérfana.
        await prisma.lmsOrder.update({
            where: { id: order.id },
            data: { status: 'RECHAZADO' },
        });
        const msg = err instanceof Error ? err.message : 'No se pudo iniciar el pago.';
        return { data: null, error: msg };
    }
}

/**
 * Estado público de una orden B2C (sin auth: la URL ya trae el `orderId`).
 * Lo consume el `OrderStatusPoller` en la pantalla de éxito.
 */
export interface LmsOrderStatus {
    status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
    activationToken: string | null;
    activationTokenExp: Date | null;
    courseTitle: string;
    courseId: string;
    studentEmail: string;
}

export async function getLmsOrderStatus(
    orderId: string,
): Promise<{ data: LmsOrderStatus | null; error: string | null }> {
    const order = await prisma.lmsOrder.findUnique({
        where: { id: orderId },
        select: {
            status: true,
            studentEmail: true,
            courseId: true,
            course: { select: { title: true } },
            enrolledUserId: true,
        },
    });
    if (!order) return { data: null, error: 'Orden no encontrada.' };

    // Si la orden está aprobada y el webhook ya creó el User, exponemos el
    // token de activación para que el cliente arme el link sin esperar el email.
    let activationToken: string | null = null;
    let activationTokenExp: Date | null = null;
    if (order.enrolledUserId) {
        const user = await prisma.user.findUnique({
            where: { id: order.enrolledUserId },
            select: { activationToken: true, activationTokenExp: true },
        });
        activationToken = user?.activationToken ?? null;
        activationTokenExp = user?.activationTokenExp ?? null;
    }

    return {
        data: {
            status: order.status,
            activationToken,
            activationTokenExp,
            courseTitle: order.course.title,
            courseId: order.courseId,
            studentEmail: order.studentEmail,
        },
        error: null,
    };
}
