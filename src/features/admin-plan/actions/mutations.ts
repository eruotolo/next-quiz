'use server';

import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';
import { auth } from '@/features/auth/auth';
import { USER_ROLE } from '@/shared/lib/roles';
import { invalidatePlanLimitsCache } from '@/features/subscriptions/lib/plan-limits';
import { revalidatePath } from 'next/cache';
import { type Plan, SubscriptionStatus, PaymentStatus } from '@prisma/client';

async function requireSuperAdmin(): Promise<string> {
    const session = await auth();
    if (session?.user.userRoleName !== USER_ROLE.SUPER_ADMIN) throw new Error('Unauthorized');
    return session.user.id;
}

// ─── Plan Limits ──────────────────────────────────────────────────────────────

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

// ─── Subscriptions ────────────────────────────────────────────────────────────

export type SubscriptionFilters = {
    plan?: Plan;
    status?: SubscriptionStatus;
    billing?: string;
    search?: string;
    page?: number;
};

export type SubscriptionRow = {
    id: string;
    createdAt: Date;
    plan: Plan;
    billing: string;
    status: SubscriptionStatus;
    amount: number | null;
    currency: string | null;
    startedAt: Date | null;
    expiresAt: Date | null;
    cancelledAt: Date | null;
    pausedAt: Date | null;
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
                cancelledAt: true,
                pausedAt: true,
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
                cancelledAt: r.cancelledAt,
                pausedAt: r.pausedAt,
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
    if (sub.status === SubscriptionStatus.cancelled) return { data: null, error: 'Ya está cancelada.' };

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
        data: { status: SubscriptionStatus.cancelled, cancelledAt: new Date() },
    });

    revalidatePath('/config/subscriptions');
    return { data: null, error: null };
}

export async function pauseSubscription(
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
    if (sub.status !== SubscriptionStatus.active) return { data: null, error: 'Solo se pueden pausar suscripciones activas.' };

    if (sub.mpSubscriptionId) {
        const token = process.env.MP_ACCESS_TOKEN;
        if (token) {
            await fetch(`https://api.mercadopago.com/preapproval/${sub.mpSubscriptionId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'paused' }),
            });
        }
    }

    await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: SubscriptionStatus.paused, pausedAt: new Date() },
    });

    revalidatePath('/config/subscriptions');
    revalidatePath(`/config/subscriptions/${subscriptionId}`);
    return { data: null, error: null };
}

export async function reactivateSubscription(
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
    if (sub.status !== SubscriptionStatus.paused) return { data: null, error: 'Solo se pueden reactivar suscripciones pausadas.' };

    if (sub.mpSubscriptionId) {
        const token = process.env.MP_ACCESS_TOKEN;
        if (token) {
            await fetch(`https://api.mercadopago.com/preapproval/${sub.mpSubscriptionId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'authorized' }),
            });
        }
    }

    await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: SubscriptionStatus.active, pausedAt: null },
    });

    revalidatePath('/config/subscriptions');
    revalidatePath(`/config/subscriptions/${subscriptionId}`);
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

// ─── Billing Stats ────────────────────────────────────────────────────────────

export type BillingStats = {
    mrr: number;
    activeCount: number;
    pendingCount: number;
    cancelledCount: number;
    pausedCount: number;
    revenueLast12Months: Array<{ month: string; amount: number }>;
    byPlan: Array<{ plan: Plan; count: number; mrr: number }>;
};

export async function getBillingStats(): Promise<{ data: BillingStats | null; error: string | null }> {
    await requireSuperAdmin().catch(() => {
        throw new Error('Unauthorized');
    });

    const [activeSubs, statusCounts, payments] = await Promise.all([
        prisma.subscription.findMany({
            where: { status: SubscriptionStatus.active },
            select: { plan: true, amount: true },
        }),
        prisma.subscription.groupBy({
            by: ['status'],
            _count: { _all: true },
        }),
        prisma.payment.findMany({
            where: {
                status: PaymentStatus.APPROVED,
                paidAt: {
                    gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
                },
            },
            select: { paidAt: true, amount: true },
            orderBy: { paidAt: 'asc' },
        }),
    ]);

    const mrr = activeSubs.reduce((sum, s) => sum + (s.amount ?? 0), 0);

    const countByStatus = statusCounts.reduce<Record<string, number>>((acc, g) => {
        acc[g.status] = g._count._all;
        return acc;
    }, {});

    const byPlanMap = new Map<Plan, { count: number; mrr: number }>();
    for (const s of activeSubs) {
        const entry = byPlanMap.get(s.plan) ?? { count: 0, mrr: 0 };
        entry.count += 1;
        entry.mrr += s.amount ?? 0;
        byPlanMap.set(s.plan, entry);
    }
    const byPlan = Array.from(byPlanMap.entries()).map(([plan, v]) => ({ plan, ...v }));

    // Agrupar pagos aprobados por mes (últimos 12)
    const revenueMap = new Map<string, number>();
    for (const p of payments) {
        if (!p.paidAt) continue;
        const key = p.paidAt.toISOString().substring(0, 7); // 'YYYY-MM'
        revenueMap.set(key, (revenueMap.get(key) ?? 0) + p.amount);
    }
    const now = new Date();
    const revenueLast12Months: Array<{ month: string; amount: number }> = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        revenueLast12Months.push({ month: key, amount: revenueMap.get(key) ?? 0 });
    }

    return {
        data: {
            mrr,
            activeCount: countByStatus[SubscriptionStatus.active] ?? 0,
            pendingCount: countByStatus[SubscriptionStatus.pending] ?? 0,
            cancelledCount: countByStatus[SubscriptionStatus.cancelled] ?? 0,
            pausedCount: countByStatus[SubscriptionStatus.paused] ?? 0,
            revenueLast12Months,
            byPlan,
        },
        error: null,
    };
}

// ─── Subscription Detail ──────────────────────────────────────────────────────

export type SubscriptionDetail = {
    id: string;
    plan: Plan;
    billing: string;
    status: SubscriptionStatus;
    amount: number | null;
    currency: string | null;
    startedAt: Date | null;
    expiresAt: Date | null;
    cancelledAt: Date | null;
    pausedAt: Date | null;
    mpSubscriptionId: string | null;
    metadata: Record<string, string> | null;
    createdAt: Date;
    updatedAt: Date;
    institutionName: string | null;
    institutionSlug: string | null;
    payments: Array<{
        id: string;
        mpPaymentId: string | null;
        amount: number;
        currency: string;
        status: PaymentStatus;
        paidAt: Date | null;
        periodStart: Date | null;
        periodEnd: Date | null;
        createdAt: Date;
    }>;
    webhookEvents: Array<{
        id: string;
        topic: string;
        externalId: string;
        processed: boolean;
        error: string | null;
        receivedAt: Date;
        rawPayload: unknown;
    }>;
};

export async function getSubscriptionById(
    id: string,
): Promise<{ data: SubscriptionDetail | null; error: string | null }> {
    await requireSuperAdmin().catch(() => {
        throw new Error('Unauthorized');
    });

    const sub = await prisma.subscription.findUnique({
        where: { id },
        select: {
            id: true,
            plan: true,
            billing: true,
            status: true,
            amount: true,
            currency: true,
            startedAt: true,
            expiresAt: true,
            cancelledAt: true,
            pausedAt: true,
            mpSubscriptionId: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
            academicInstitution: { select: { name: true, slug: true } },
            payments: {
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    mpPaymentId: true,
                    amount: true,
                    currency: true,
                    status: true,
                    paidAt: true,
                    periodStart: true,
                    periodEnd: true,
                    createdAt: true,
                },
            },
        },
    });

    if (!sub) return { data: null, error: 'Suscripción no encontrada.' };

    const webhookEvents = sub.mpSubscriptionId
        ? await prisma.webhookEvent.findMany({
              where: { externalId: sub.mpSubscriptionId },
              orderBy: { receivedAt: 'desc' },
              take: 20,
              select: {
                  id: true,
                  topic: true,
                  externalId: true,
                  processed: true,
                  error: true,
                  receivedAt: true,
                  rawPayload: true,
              },
          })
        : [];

    return {
        data: {
            id: sub.id,
            plan: sub.plan,
            billing: sub.billing,
            status: sub.status,
            amount: sub.amount,
            currency: sub.currency,
            startedAt: sub.startedAt,
            expiresAt: sub.expiresAt,
            cancelledAt: sub.cancelledAt,
            pausedAt: sub.pausedAt,
            mpSubscriptionId: sub.mpSubscriptionId,
            metadata: (sub.metadata as Record<string, string> | null) ?? null,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt,
            institutionName: sub.academicInstitution?.name ?? null,
            institutionSlug: sub.academicInstitution?.slug ?? null,
            payments: sub.payments,
            webhookEvents,
        },
        error: null,
    };
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export type PaymentFilters = {
    status?: PaymentStatus;
    plan?: Plan;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
};

export type PaymentRow = {
    id: string;
    mpPaymentId: string | null;
    amount: number;
    currency: string;
    status: PaymentStatus;
    paidAt: Date | null;
    periodStart: Date | null;
    periodEnd: Date | null;
    createdAt: Date;
    subscriptionId: string;
    subscriptionPlan: Plan;
    subscriptionBilling: string;
    institutionName: string | null;
};

export type PaginatedPayments = {
    rows: PaymentRow[];
    total: number;
    page: number;
    pageSize: number;
};

export async function getPayments(
    filters: PaymentFilters = {},
): Promise<{ data: PaginatedPayments | null; error: string | null }> {
    await requireSuperAdmin().catch(() => {
        throw new Error('Unauthorized');
    });

    const page = Math.max(1, filters.page ?? 1);
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const where: {
        status?: PaymentStatus;
        paidAt?: { gte?: Date; lte?: Date };
        subscription?: { plan?: Plan };
    } = {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.plan ? { subscription: { plan: filters.plan } } : {}),
        ...(filters.dateFrom || filters.dateTo
            ? {
                  paidAt: {
                      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
                      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
                  },
              }
            : {}),
    };

    const [rawRows, total] = await Promise.all([
        prisma.payment.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            select: {
                id: true,
                mpPaymentId: true,
                amount: true,
                currency: true,
                status: true,
                paidAt: true,
                periodStart: true,
                periodEnd: true,
                createdAt: true,
                subscriptionId: true,
                subscription: {
                    select: {
                        plan: true,
                        billing: true,
                        metadata: true,
                        academicInstitution: { select: { name: true } },
                    },
                },
            },
        }),
        prisma.payment.count({ where }),
    ]);

    const rows: PaymentRow[] = rawRows
        .map((r) => ({
            id: r.id,
            mpPaymentId: r.mpPaymentId,
            amount: r.amount,
            currency: r.currency,
            status: r.status,
            paidAt: r.paidAt,
            periodStart: r.periodStart,
            periodEnd: r.periodEnd,
            createdAt: r.createdAt,
            subscriptionId: r.subscriptionId,
            subscriptionPlan: r.subscription.plan,
            subscriptionBilling: r.subscription.billing,
            institutionName: r.subscription.academicInstitution?.name ?? null,
        }))
        .filter((r) => {
            if (!filters.search) return true;
            const q = filters.search.toLowerCase();
            return r.institutionName?.toLowerCase().includes(q);
        });

    return { data: { rows, total, page, pageSize }, error: null };
}

export async function exportPaymentsCSV(
    filters: Omit<PaymentFilters, 'page'> = {},
): Promise<{ data: string | null; error: string | null }> {
    await requireSuperAdmin().catch(() => {
        throw new Error('Unauthorized');
    });

    const result = await getPayments({ ...filters, page: 1 });
    if (!result.data) return { data: null, error: 'Error al obtener pagos' };

    // Obtener todos sin paginación
    const where: {
        status?: PaymentStatus;
        paidAt?: { gte?: Date; lte?: Date };
        subscription?: { plan?: Plan };
    } = {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.plan ? { subscription: { plan: filters.plan } } : {}),
        ...(filters.dateFrom || filters.dateTo
            ? {
                  paidAt: {
                      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
                      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
                  },
              }
            : {}),
    };

    const rows = await prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            mpPaymentId: true,
            amount: true,
            currency: true,
            status: true,
            paidAt: true,
            periodStart: true,
            periodEnd: true,
            createdAt: true,
            subscription: {
                select: {
                    plan: true,
                    billing: true,
                    academicInstitution: { select: { name: true } },
                },
            },
        },
    });

    const fmt = (d: Date | null): string => d ? d.toISOString().split('T')[0] ?? '' : '';
    const esc = (v: string): string => `"${v.replace(/"/g, '""')}"`;

    const header = 'ID,Fecha,Institución,Plan,Modalidad,Monto,Estado,ID MP,Período Inicio,Período Fin\n';
    const csvRows = rows.map((r) => [
        r.id,
        fmt(r.createdAt),
        esc(r.subscription.academicInstitution?.name ?? ''),
        r.subscription.plan,
        r.subscription.billing === 'monthly' ? 'Mensual' : 'Anual',
        r.amount,
        r.status,
        r.mpPaymentId ?? '',
        fmt(r.periodStart),
        fmt(r.periodEnd),
    ].join(','));

    return { data: header + csvRows.join('\n'), error: null };
}
