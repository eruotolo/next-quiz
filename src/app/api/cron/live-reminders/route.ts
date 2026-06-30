import { type NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/shared/lib/email';
import { prisma } from '@/shared/lib/prisma';
import { buildLiveSessionScheduledEmail } from '@/features/lms/lib/live-notifications';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const REMINDER_WINDOW_MIN = 5;

/**
 * Cron cada 15 minutos que envía recordatorio por email a los estudiantes
 * inscriptos cuando faltan ~1 hora para una clase en vivo programada.
 *
 * Idempotencia: marca `reminderSentAt` en la sesión después de enviar. Si
 * el cron se vuelve a ejecutar no reenvía para esa misma sesión.
 *
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
        const now = new Date();
        const windowStart = new Date(now.getTime() + (60 - REMINDER_WINDOW_MIN) * 60_000);
        const windowEnd = new Date(now.getTime() + (60 + REMINDER_WINDOW_MIN) * 60_000);

        const sessions = await prisma.lmsLiveSession.findMany({
            where: {
                status: 'SCHEDULED',
                reminderSentAt: null,
                scheduledAt: { gte: windowStart, lte: windowEnd },
            },
            select: {
                id: true,
                title: true,
                scheduledAt: true,
                durationMin: true,
                courseId: true,
                course: {
                    select: {
                        id: true,
                        title: true,
                        academicInstitutionId: true,
                    },
                },
            },
        });

        if (sessions.length === 0) {
            return NextResponse.json({ ok: true, sessionsFound: 0 });
        }

        const siteUrl =
            process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://aulika.cl';

        let totalSent = 0;
        let totalFailed = 0;

        for (const session of sessions) {
            const enrollments = await prisma.lmsEnrollment.findMany({
                where: { courseId: session.courseId, status: 'ACTIVO' },
                select: {
                    user: { select: { id: true, email: true, name: true, lastname: true } },
                },
            });

            let sentInSession = 0;
            let failedInSession = 0;
            const sessionUrl = `${siteUrl}/aula/clases/${session.id}`;

            for (const enrollment of enrollments) {
                if (!enrollment.user.email) continue;

                const html = buildLiveSessionScheduledEmail({
                    recipientName:
                        `${enrollment.user.name} ${enrollment.user.lastname ?? ''}`.trim() ||
                        enrollment.user.email,
                    teacherName: 'Docente',
                    courseName: session.course.title,
                    sessionTitle: session.title,
                    scheduledAt: session.scheduledAt,
                    durationMin: session.durationMin,
                    sessionUrl,
                });

                const result = await sendEmail({
                    to: enrollment.user.email,
                    toName:
                        `${enrollment.user.name} ${enrollment.user.lastname ?? ''}`.trim() ||
                        enrollment.user.email,
                    subject: `⏰ Recordatorio: ${session.title} en 1 hora`,
                    htmlContent: html,
                });

                if (result.sent) sentInSession++;
                else failedInSession++;
            }

            if (sentInSession > 0 || failedInSession === 0) {
                await prisma.lmsLiveSession.update({
                    where: { id: session.id },
                    data: { reminderSentAt: new Date() },
                });
            }

            totalSent += sentInSession;
            totalFailed += failedInSession;
        }

        return NextResponse.json({
            ok: true,
            sessionsFound: sessions.length,
            emailsSent: totalSent,
            emailsFailed: totalFailed,
        });
    } catch (err) {
        console.error('[live-reminders cron] error:', err);
        return NextResponse.json({ error: 'Reminder dispatch failed' }, { status: 500 });
    }
}
