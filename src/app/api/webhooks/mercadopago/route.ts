import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { verifyWebhookSignature } from '@/features/subscriptions/lib/mercadopago';

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

        if (topic !== 'preapproval') {
            return NextResponse.json({ received: true });
        }

        if (!dataId) {
            return NextResponse.json({ error: 'Missing data.id' }, { status: 400 });
        }

        const token = process.env.MP_ACCESS_TOKEN;
        if (!token) {
            return NextResponse.json({ error: 'MP not configured' }, { status: 500 });
        }

        const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${dataId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!mpRes.ok) {
            return NextResponse.json({ error: 'Failed to fetch preapproval' }, { status: 502 });
        }

        const preapproval = (await mpRes.json()) as {
            status?: string;
            external_reference?: string;
        };
        const mpStatus = preapproval.status;

        // Find subscription by MP ID first, fall back to external_reference
        const target =
            (await prisma.subscription.findFirst({
                where: { mpSubscriptionId: dataId },
                select: { id: true, status: true },
            })) ??
            (preapproval.external_reference
                ? await prisma.subscription.findUnique({
                      where: { id: preapproval.external_reference },
                      select: { id: true, status: true },
                  })
                : null);

        if (!target || target.status === 'active') return NextResponse.json({ received: true });

        if (mpStatus === 'authorized') {
            await prisma.subscription.update({
                where: { id: target.id },
                data: { status: 'authorized', mpSubscriptionId: dataId },
            });
        } else if (mpStatus === 'cancelled' || mpStatus === 'paused') {
            await prisma.subscription.update({
                where: { id: target.id },
                data: { status: 'failed' },
            });
        }

        return NextResponse.json({ received: true });
    } catch {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
