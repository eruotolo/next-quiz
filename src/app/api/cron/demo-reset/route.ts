import { type NextRequest, NextResponse } from 'next/server';
import { resetDemoInstitution } from '@/features/demo/lib/cleanup';

/**
 * Cron diario que purga TODOS los exámenes creados en el sandbox demo. Red de
 * seguridad para las sesiones que no cerraron sesión (cerraron la pestaña).
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
        const deleted = await resetDemoInstitution();
        return NextResponse.json({ ok: true, deleted });
    } catch {
        return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
    }
}
