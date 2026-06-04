import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { verifyWebhookSignature } from '@/features/subscriptions/lib/mercadopago';
import {
    activateInstitutionPlan,
    downgradeInstitutionToFree,
} from '@/features/subscriptions/lib/plan-sync';
import { SubscriptionStatus, PaymentStatus } from '@prisma/client';

async function saveWebhookEvent(
    topic: string,
    externalId: string,
    rawPayload: unknown,
): Promise<string> {
    const event = await prisma.webhookEvent.create({
        data: { topic, externalId, rawPayload: rawPayload as never },
        select: { id: true },
    });
    return event.id;
}

async function markEventProcessed(id: string, error?: string): Promise<void> {
    await prisma.webhookEvent.update({
        where: { id },
        data: { processed: !error, error: error ?? null },
    });
}

async function handlePreapproval(dataId: string, token: string): Promise<void> {
    const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${dataId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!mpRes.ok) return;

    const preapproval = (await mpRes.json()) as {
        status?: string;
        external_reference?: string;
        next_payment_date?: string;
    };
    const mpStatus = preapproval.status;

    const selectFields = {
        id: true,
        status: true,
        plan: true,
        academicInstitutionId: true,
    } as const;

    const target =
        (await prisma.subscription.findFirst({
            where: { mpSubscriptionId: dataId },
            select: selectFields,
        })) ??
        (preapproval.external_reference
            ? await prisma.subscription.findUnique({
                  where: { id: preapproval.external_reference },
                  select: selectFields,
              })
            : null);

    if (!target || target.status === SubscriptionStatus.active) return;

    const expiresAt = preapproval.next_payment_date
        ? new Date(preapproval.next_payment_date)
        : undefined;

    if (mpStatus === 'authorized') {
        await prisma.subscription.update({
            where: { id: target.id },
            data: {
                status: SubscriptionStatus.authorized,
                mpSubscriptionId: dataId,
                ...(expiresAt ? { expiresAt } : {}),
            },
        });
        // Sincronizar el plan de la institución con la suscripción autorizada.
        if (target.academicInstitutionId) {
            await activateInstitutionPlan(
                target.academicInstitutionId,
                target.plan,
                expiresAt ?? null,
            );
        }
    } else if (mpStatus === 'cancelled') {
        await prisma.subscription.update({
            where: { id: target.id },
            data: {
                status: SubscriptionStatus.cancelled,
                cancelledAt: new Date(),
            },
        });
        // Al cancelar, degradar la institución al plan FREE.
        if (target.academicInstitutionId) {
            await downgradeInstitutionToFree(target.academicInstitutionId);
        }
    } else if (mpStatus === 'paused') {
        await prisma.subscription.update({
            where: { id: target.id },
            data: { status: SubscriptionStatus.paused, pausedAt: new Date() },
        });
    }
}

async function handlePayment(dataId: string, token: string): Promise<void> {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!mpRes.ok) return;

    const payment = (await mpRes.json()) as {
        status?: string;
        transaction_amount?: number;
        currency_id?: string;
        date_approved?: string;
        date_created?: string;
        external_reference?: string;
        metadata?: { preapproval_id?: string };
    };

    const mpStatus = payment.status;
    const mpPreapprovalId = payment.metadata?.preapproval_id ?? payment.external_reference;
    if (!mpPreapprovalId) return;

    const sub = await prisma.subscription.findFirst({
        where: { mpSubscriptionId: mpPreapprovalId },
        select: { id: true },
    });
    if (!sub) return;

    const existing = await prisma.payment.findUnique({
        where: { mpPaymentId: dataId },
        select: { id: true },
    });
    if (existing) return;

    const statusMap: Record<string, PaymentStatus> = {
        approved: PaymentStatus.APPROVED,
        pending: PaymentStatus.PENDING,
        rejected: PaymentStatus.REJECTED,
        refunded: PaymentStatus.REFUNDED,
    };
    const payStatus = statusMap[mpStatus ?? ''] ?? PaymentStatus.PENDING;

    await prisma.payment.create({
        data: {
            subscriptionId: sub.id,
            mpPaymentId: dataId,
            amount: payment.transaction_amount ?? 0,
            currency: payment.currency_id ?? 'CLP',
            status: payStatus,
            paidAt: payment.date_approved ? new Date(payment.date_approved) : null,
            rawPayload: payment as never,
        },
    });
}

async function handleAuthorizedPayment(dataId: string, token: string): Promise<void> {
    const mpRes = await fetch(`https://api.mercadopago.com/authorized_payments/${dataId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!mpRes.ok) return;

    const ap = (await mpRes.json()) as {
        status?: string;
        transaction_amount?: number;
        currency_id?: string;
        date_approved?: string;
        preapproval_id?: string;
        payment_period?: { start_date?: string; end_date?: string };
    };

    const mpPreapprovalId = ap.preapproval_id;
    if (!mpPreapprovalId) return;

    const sub = await prisma.subscription.findFirst({
        where: { mpSubscriptionId: mpPreapprovalId },
        select: { id: true },
    });
    if (!sub) return;

    const existing = await prisma.payment.findUnique({
        where: { mpPaymentId: dataId },
        select: { id: true },
    });
    if (existing) return;

    const statusMap: Record<string, PaymentStatus> = {
        approved: PaymentStatus.APPROVED,
        pending: PaymentStatus.PENDING,
        rejected: PaymentStatus.REJECTED,
    };
    const payStatus = statusMap[ap.status ?? ''] ?? PaymentStatus.PENDING;

    await prisma.payment.create({
        data: {
            subscriptionId: sub.id,
            mpPaymentId: dataId,
            amount: ap.transaction_amount ?? 0,
            currency: ap.currency_id ?? 'CLP',
            status: payStatus,
            paidAt: ap.date_approved ? new Date(ap.date_approved) : null,
            periodStart: ap.payment_period?.start_date
                ? new Date(ap.payment_period.start_date)
                : null,
            periodEnd: ap.payment_period?.end_date ? new Date(ap.payment_period.end_date) : null,
            rawPayload: ap as never,
        },
    });

    if (payStatus === PaymentStatus.APPROVED) {
        await prisma.subscription.update({
            where: { id: sub.id },
            data: {
                ...(ap.payment_period?.end_date
                    ? { expiresAt: new Date(ap.payment_period.end_date) }
                    : {}),
            },
        });
    }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const rawBody = await req.text();
        const xSignature = req.headers.get('x-signature') ?? '';
        const xRequestId = req.headers.get('x-request-id') ?? '';

        let payload: { type?: string; data?: { id?: string } };
        try {
            payload = JSON.parse(rawBody) as typeof payload;
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const dataId = payload.data?.id ?? '';
        const topic = payload.type ?? req.nextUrl.searchParams.get('topic') ?? '';

        if (!verifyWebhookSignature(rawBody, xSignature, xRequestId, dataId)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        if (!['preapproval', 'payment', 'subscription_authorized_payment'].includes(topic)) {
            return NextResponse.json({ received: true });
        }

        if (!dataId) {
            return NextResponse.json({ error: 'Missing data.id' }, { status: 400 });
        }

        const token = process.env.MP_ACCESS_TOKEN;
        if (!token) {
            return NextResponse.json({ error: 'MP not configured' }, { status: 500 });
        }

        const eventId = await saveWebhookEvent(topic, dataId, payload);

        try {
            if (topic === 'preapproval') {
                await handlePreapproval(dataId, token);
            } else if (topic === 'payment') {
                await handlePayment(dataId, token);
            } else if (topic === 'subscription_authorized_payment') {
                await handleAuthorizedPayment(dataId, token);
            }
            await markEventProcessed(eventId);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            await markEventProcessed(eventId, msg);
        }

        return NextResponse.json({ received: true });
    } catch {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
