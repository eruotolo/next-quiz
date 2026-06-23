'use server';

import { prisma } from '@/shared/lib/prisma';
import { requireInstitutionAccess } from '@/shared/lib/auth-guard';
import { USER_ROLE } from '@/shared/lib/roles';
import { createPreapproval, getAutoRecurring } from '@/features/subscriptions/lib/mercadopago';
import type { Billing, PaidPlan } from '@/features/subscriptions/lib/mercadopago';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';

const PAID_PLANS: PaidPlan[] = ['DOCENTE', 'COLEGIO'];

function planLabel(plan: PaidPlan): string {
    return plan.charAt(0) + plan.slice(1).toLowerCase();
}

/**
 * Inicia el pago de un upgrade de plan para la institución del Administrador logueado.
 * Reutiliza el preapproval de MercadoPago: el webhook (api/webhooks/mercadopago)
 * activa el plan de la institución automáticamente al autorizarse el pago.
 * Si la institución ya tiene una suscripción vigente, se cancela en MP antes
 * de crear la nueva (cambio entre planes pagos).
 */
export async function upgradePlan(
    slug: string,
    plan: PaidPlan,
    billing: Billing,
): Promise<ActionResult<{ initPoint: string | null }>> {
    try {
        if (!PAID_PLANS.includes(plan)) return fail('Plan no válido.');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
        ]);

        if (!ctx.userEmail) {
            return fail('Tu cuenta no tiene un email asociado para procesar el pago.');
        }

        // Cambio desde un plan pago: cancelar la suscripción MP vigente para no
        // generar un cobro duplicado. El webhook de cancelación no degrada el plan
        // porque la nueva suscripción lo reactiva al autorizarse.
        const activeSub = await prisma.subscription.findFirst({
            where: {
                academicInstitutionId: ctx.institutionId,
                status: { in: ['authorized', 'active'] },
                mpSubscriptionId: { not: null },
            },
            select: { id: true, mpSubscriptionId: true },
        });
        if (activeSub?.mpSubscriptionId) {
            const token = process.env.MP_ACCESS_TOKEN;
            if (token) {
                await fetch(
                    `https://api.mercadopago.com/preapproval/${activeSub.mpSubscriptionId}`,
                    {
                        method: 'PUT',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ status: 'cancelled' }),
                    },
                );
            }
            await prisma.subscription.update({
                where: { id: activeSub.id },
                data: { status: 'cancelled', cancelledAt: new Date() },
            });
        }

        const billingLabel = billing === 'monthly' ? 'mensual' : 'anual';
        const subscription = await prisma.subscription.create({
            data: {
                academicInstitutionId: ctx.institutionId,
                plan,
                billing,
                status: 'pending',
                metadata: { source: 'self-service-upgrade', payerEmail: ctx.userEmail },
            },
            select: { id: true },
        });

        const backUrlBase = process.env.MP_BACK_URL_BASE ?? 'https://www.aulika.cl';
        const { initPoint, mpSubscriptionId, mpStatus } = await createPreapproval({
            reason: `Aulika · Plan ${planLabel(plan)} (${billingLabel})`,
            autoRecurring: getAutoRecurring(plan, billing),
            payerEmail: ctx.userEmail,
            externalReference: subscription.id,
            backUrl: `${backUrlBase}/${slug}?upgrade=ok`,
        });

        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                mpSubscriptionId,
                status: mpStatus === 'authorized' ? 'authorized' : 'pending',
            },
        });

        await logAudit({
            action: AUDIT_ACTION.SUBSCRIPTION_CREATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'Subscription',
            entityId: subscription.id,
            metadata: { plan, billing, selfService: true },
        });

        return ok({ initPoint });
    } catch (err) {
        return fail(toActionError(err, 'No se pudo iniciar el pago. Intenta de nuevo.'));
    }
}
