import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const READ_RETENTION_HOURS = 24;

/**
 * Cron diario (5:00 UTC) que elimina físicamente las notificaciones
 * marcadas como leídas hace más de 24h. El check usa `updatedAt` que se
 * actualiza automáticamente cuando el estudiante marca la notificación
 * como leída (gracias a `@updatedAt` en el modelo).
 *
 * Las notificaciones aún no leídas (`read = false`) no se tocan.
 *
 * Protegido con `CRON_SECRET` (Vercel Cron → `Authorization: Bearer <secret>`).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    const secret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    if (!secret || authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const cutoff = new Date(Date.now() - READ_RETENTION_HOURS * 60 * 60 * 1000);
        const result = await prisma.lmsNotification.deleteMany({
            where: { read: true, updatedAt: { lt: cutoff } },
        });
        return NextResponse.json({ ok: true, deleted: result.count });
    } catch (err) {
        console.error('[cron/cleanup-read-notifications] error:', err);
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
}
