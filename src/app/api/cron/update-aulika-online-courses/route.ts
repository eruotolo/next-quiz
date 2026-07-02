import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { updateAulikaOnlineCourses } from '@/features/lms/lib/aulika-online-ai-updater';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Cron mensual (3:00 UTC del día 1) que actualiza el contenido pedagógico
 * de los cursos de Aulika Institution Online con ayuda de Gemini 2.5 Flash.
 *
 * Estrategia:
 * - Solo agrega lecciones nuevas al final del último módulo de cada curso.
 * - NUNCA pisa ni borra lecciones existentes (preserva progreso del estudiante).
 * - Máximo 2 lecciones nuevas por curso por ciclo.
 * - Gated por `AULIKA_ONLINE_AUTO_UPDATE_ENABLED` en AppConfig.
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
        const report = await updateAulikaOnlineCourses(prisma);
        return NextResponse.json({ ok: true, report });
    } catch (err) {
        console.error('[cron/update-aulika-online-courses] error:', err);
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
}