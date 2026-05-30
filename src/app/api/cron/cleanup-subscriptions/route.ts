import { type NextRequest, NextResponse } from 'next/server';
import { cleanupPendingSubscriptions } from '@/features/subscriptions/lib/cleanup';

/**
 * Cron diario que purga suscripciones `pending` abandonadas (sin institución).
 * Protegido con CRON_SECRET: Vercel Cron envía `Authorization: Bearer <secret>`
 * automáticamente cuando la variable está configurada.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    const secret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    if (!secret || authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const deleted = await cleanupPendingSubscriptions(7);
        return NextResponse.json({ ok: true, deleted });
    } catch {
        return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
    }
}
