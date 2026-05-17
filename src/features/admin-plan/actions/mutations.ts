'use server';

import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';
import { auth } from '@/features/auth/auth';
import { USER_ROLE } from '@/shared/lib/roles';
import { invalidatePlanLimitsCache } from '@/features/subscriptions/lib/plan-limits';
import { revalidatePath } from 'next/cache';
import type { Plan } from '@prisma/client';

async function requireSuperAdmin(): Promise<string> {
    const session = await auth();
    if (session?.user.userRoleName !== USER_ROLE.SUPER_ADMIN) throw new Error('Unauthorized');
    return session.user.id;
}

const planLimitsUpdateSchema = z.object({
    plan: z.enum(['FREE', 'DOCENTE', 'COLEGIO', 'INSTITUCIONAL']),
    maxGroups: z.number().int().positive().nullable(),
    maxAdmins: z.number().int().positive().nullable(),
    maxProfessors: z.number().int().positive().nullable(),
    maxStudents: z.number().int().positive().nullable(),
    maxExamsPerYear: z.number().int().positive().nullable(),
});

export async function updatePlanLimits(
    data: unknown,
): Promise<{ data: null; error: string | null }> {
    await requireSuperAdmin().catch(() => {
        throw new Error('Unauthorized');
    });

    const parsed = planLimitsUpdateSchema.safeParse(data);
    if (!parsed.success) return { data: null, error: parsed.error.errors[0]?.message ?? 'Error de validación' };

    await prisma.planLimits.update({
        where: { plan: parsed.data.plan as Plan },
        data: {
            maxGroups: parsed.data.maxGroups,
            maxAdmins: parsed.data.maxAdmins,
            maxProfessors: parsed.data.maxProfessors,
            maxStudents: parsed.data.maxStudents,
            maxExamsPerYear: parsed.data.maxExamsPerYear,
        },
    });

    invalidatePlanLimitsCache(parsed.data.plan as Plan);
    revalidatePath('/config/plan-limits');

    return { data: null, error: null };
}

export type SubscriptionFilters = {
    plan?: Plan;
    status?: string;
    billing?: string;
    search?: string;
    page?: number;
};

export type SubscriptionRow = {
    id: string;
    createdAt: Date;
    plan: Plan;
    billing: string;
    status: string;
    amount: number | null;
    currency: string | null;
    startedAt: Date | null;
    expiresAt: Date | null;
    mpSubscriptionId: string | null;
    payerName: string | null;
    payerEmail: string | null;
    institutionName: string | null;
};

export type PaginatedSubscriptions = {
    rows: SubscriptionRow[];
    total: number;
    page: number;
    pageSize: number;
};

export async function getSubscriptions(
    filters: SubscriptionFilters = {},
): Promise<{ data: PaginatedSubscriptions | null; error: string | null }> {
    await requireSuperAdmin().catch(() => {
        throw new Error('Unauthorized');
    });

    const page = Math.max(1, filters.page ?? 1);
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const where = {
        ...(filters.plan ? { plan: filters.plan } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.billing ? { billing: filters.billing } : {}),
    };

    const [rawRows, total] = await Promise.all([
        prisma.subscription.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            select: {
                id: true,
                createdAt: true,
                plan: true,
                billing: true,
                status: true,
                amount: true,
                currency: true,
                startedAt: true,
                expiresAt: true,
                mpSubscriptionId: true,
                metadata: true,
                academicInstitution: { select: { name: true } },
            },
        }),
        prisma.subscription.count({ where }),
    ]);

    const rows: SubscriptionRow[] = rawRows
        .map((r) => {
            const meta = (r.metadata as Record<string, string> | null) ?? {};
            const payerName = meta.payerName ? `${meta.payerName} ${meta.payerLastname ?? ''}`.trim() : null;
            const payerEmail = meta.payerEmail ?? null;
            return {
                id: r.id,
                createdAt: r.createdAt,
                plan: r.plan,
                billing: r.billing,
                status: r.status,
                amount: r.amount,
                currency: r.currency,
                startedAt: r.startedAt,
                expiresAt: r.expiresAt,
                mpSubscriptionId: r.mpSubscriptionId,
                payerName,
                payerEmail,
                institutionName: r.academicInstitution?.name ?? null,
            };
        })
        .filter((r) => {
            if (!filters.search) return true;
            const q = filters.search.toLowerCase();
            return (
                r.payerName?.toLowerCase().includes(q) ||
                r.payerEmail?.toLowerCase().includes(q) ||
                r.institutionName?.toLowerCase().includes(q)
            );
        });

    return { data: { rows, total, page, pageSize }, error: null };
}

export async function cancelSubscription(
    subscriptionId: string,
): Promise<{ data: null; error: string | null }> {
    await requireSuperAdmin().catch(() => {
        throw new Error('Unauthorized');
    });

    const sub = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        select: { id: true, mpSubscriptionId: true, status: true },
    });

    if (!sub) return { data: null, error: 'Suscripción no encontrada.' };
    if (sub.status === 'cancelled') return { data: null, error: 'Ya está cancelada.' };

    if (sub.mpSubscriptionId) {
        const token = process.env.MP_ACCESS_TOKEN;
        if (token) {
            await fetch(`https://api.mercadopago.com/preapproval/${sub.mpSubscriptionId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'cancelled' }),
            });
        }
    }

    await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'cancelled' },
    });

    revalidatePath('/config/subscriptions');
    return { data: null, error: null };
}

export async function exportSubscriptionsCSV(
    filters: Omit<SubscriptionFilters, 'page'> = {},
): Promise<{ data: string | null; error: string | null }> {
    await requireSuperAdmin().catch(() => {
        throw new Error('Unauthorized');
    });

    const where = {
        ...(filters.plan ? { plan: filters.plan } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.billing ? { billing: filters.billing } : {}),
    };

    const rows = await prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            createdAt: true,
            plan: true,
            billing: true,
            status: true,
            amount: true,
            currency: true,
            startedAt: true,
            expiresAt: true,
            mpSubscriptionId: true,
            metadata: true,
            academicInstitution: { select: { name: true } },
        },
    });

    const header = 'ID,Fecha,Pagador,Email,Institución,Plan,Modalidad,Monto,Estado,Inicio,Vencimiento,ID MP\n';
    const csvRows = rows.map((r) => {
        const meta = (r.metadata as Record<string, string> | null) ?? {};
        const payerName = `${meta.payerName ?? ''} ${meta.payerLastname ?? ''}`.trim();
        const payerEmail = meta.payerEmail ?? '';
        const fmt = (d: Date | null): string => d ? d.toISOString().split('T')[0] ?? '' : '';
        const esc = (v: string): string => `"${v.replace(/"/g, '""')}"`;

        return [
            r.id,
            fmt(r.createdAt),
            esc(payerName),
            esc(payerEmail),
            esc(r.academicInstitution?.name ?? ''),
            r.plan,
            r.billing === 'monthly' ? 'Mensual' : 'Anual',
            r.amount ?? '',
            r.status,
            fmt(r.startedAt),
            fmt(r.expiresAt),
            r.mpSubscriptionId ?? '',
        ].join(',');
    });

    return { data: header + csvRows.join('\n'), error: null };
}
