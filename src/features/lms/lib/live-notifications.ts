import { sendEmail } from '@/shared/lib/email';
import { prisma } from '@/shared/lib/prisma';

interface SiteUrlProvider {
    getSiteUrl(): Promise<string>;
}

const defaultSiteUrlProvider: SiteUrlProvider = {
    getSiteUrl: async () =>
        process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://aulika.cl',
};

let siteUrlProvider: SiteUrlProvider = defaultSiteUrlProvider;

export function setLiveNotificationsSiteUrlProvider(provider: SiteUrlProvider): void {
    siteUrlProvider = provider;
}

export function resetLiveNotificationsSiteUrlProvider(): void {
    siteUrlProvider = defaultSiteUrlProvider;
}

async function getSiteUrl(): Promise<string> {
    return siteUrlProvider.getSiteUrl();
}

function escapeEmailText(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

interface BuildLiveReminderEmailInput {
    recipientName: string;
    teacherName: string;
    courseName: string;
    sessionTitle: string;
    scheduledAt: Date;
    durationMin: number;
    sessionUrl: string;
}

export function buildLiveSessionScheduledEmail(input: BuildLiveReminderEmailInput): string {
    const {
        recipientName,
        teacherName,
        courseName,
        sessionTitle,
        scheduledAt,
        durationMin,
        sessionUrl,
    } = input;

    const dateFormatter = new Intl.DateTimeFormat('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Santiago',
    });
    const formatted = dateFormatter.format(scheduledAt);

    return `
<!DOCTYPE html>
<html lang="es">
<body style="font-family: sans-serif; color: #111; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="margin-bottom: 4px;">Hola ${escapeEmailText(recipientName)}</h2>
  <p style="color: #555; margin-top: 0;">
    Se programó una nueva clase en vivo en
    <strong>${escapeEmailText(courseName)}</strong>.
  </p>
  <table style="width:100%; border-collapse:collapse; margin: 24px 0;">
    <tr>
      <td style="padding: 12px; background:#f4f4f5; border-radius:8px;">
        <p style="margin:0 0 6px 0; font-weight:600; color:#111;">${escapeEmailText(sessionTitle)}</p>
        <p style="margin:0; color:#374151; font-size:14px;">Docente: ${escapeEmailText(teacherName)}</p>
        <p style="margin:6px 0 0 0; color:#374151; font-size:14px;">Cuándo: ${escapeEmailText(formatted)}</p>
        <p style="margin:6px 0 0 0; color:#374151; font-size:14px;">Duración: ${durationMin} minutos</p>
      </td>
    </tr>
  </table>
  <p style="margin: 24px 0;">
    <a href="${escapeEmailText(sessionUrl)}"
       style="display:inline-block; padding:10px 18px; background:#2563eb; color:#fff; text-decoration:none; border-radius:6px; font-weight:600;">
      Ver detalles de la clase
    </a>
  </p>
  <p style="color:#6b7280; font-size:13px; margin-top:24px;">
    Vas a recibir otro recordatorio 1 hora antes del inicio.
  </p>
</body>
</html>`.trim();
}

interface NotifyLiveScheduledInput {
    sessionId: string;
    courseId: string;
}

interface NotifyResult {
    inAppCreated: number;
    emailSent: number;
    emailFailed: number;
    skipped: number;
}

/**
 * Notifica a todos los estudiantes inscriptos activos de un curso cuando se
 * programa una sesión en vivo:
 *   - Crea una `LmsNotification` in-app por estudiante.
 *   - Envía un email Brevo best-effort.
 *
 * Si la institución no tiene estudiantes inscriptos o no hay Brevo configurado,
 * las partes fallidas se saltean sin lanzar excepciones. Diseñada para ser
 * invocada como `void notifyLiveSessionScheduledBackground(...)` desde un
 * Server Action.
 */
export async function notifyLiveSessionScheduled(
    input: NotifyLiveScheduledInput,
): Promise<NotifyResult> {
    const { sessionId, courseId } = input;

    try {
        const siteUrl = await getSiteUrl();
        const liveSession = await prisma.lmsLiveSession.findUnique({
            where: { id: sessionId },
            select: {
                id: true,
                title: true,
                scheduledAt: true,
                durationMin: true,
                course: {
                    select: {
                        id: true,
                        title: true,
                        academicInstitutionId: true,
                    },
                },
                createdBy: { select: { name: true, lastname: true } },
            },
        });
        if (!liveSession) return { inAppCreated: 0, emailSent: 0, emailFailed: 0, skipped: 1 };

        const enrollments = await prisma.lmsEnrollment.findMany({
            where: { courseId, status: 'ACTIVO' },
            select: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        lastname: true,
                    },
                },
            },
        });
        if (enrollments.length === 0) {
            return { inAppCreated: 0, emailSent: 0, emailFailed: 0, skipped: 1 };
        }

        const sessionUrl = `${siteUrl}/aula/clases/${liveSession.id}`;
        const teacherName =
            `${liveSession.createdBy.name} ${liveSession.createdBy.lastname ?? ''}`.trim() ||
            'Docente';

        const link = `/aula/clases/${liveSession.id}`;

        const inAppData = enrollments.map((e) => ({
            userId: e.user.id,
            type: 'LIVE_SESSION_SCHEDULED',
            message: `Se programó "${liveSession.title}" en ${liveSession.course.title}`,
            link,
        }));
        const inAppResult = await prisma.lmsNotification.createMany({ data: inAppData });

        let emailSent = 0;
        let emailFailed = 0;

        for (const enrollment of enrollments) {
            const recipient = enrollment.user;
            if (!recipient.email) continue;

            const html = buildLiveSessionScheduledEmail({
                recipientName:
                    `${recipient.name} ${recipient.lastname ?? ''}`.trim() || recipient.email,
                teacherName,
                courseName: liveSession.course.title,
                sessionTitle: liveSession.title,
                scheduledAt: liveSession.scheduledAt,
                durationMin: liveSession.durationMin,
                sessionUrl,
            });

            const result = await sendEmail({
                to: recipient.email,
                toName: `${recipient.name} ${recipient.lastname ?? ''}`.trim() || recipient.email,
                subject: `Nueva clase en vivo: ${liveSession.title}`,
                htmlContent: html,
            });

            if (result.sent) emailSent++;
            else emailFailed++;
        }

        return {
            inAppCreated: inAppResult.count,
            emailSent,
            emailFailed,
            skipped: 0,
        };
    } catch (err) {
        console.error('[notifyLiveSessionScheduled] error:', err);
        return { inAppCreated: 0, emailSent: 0, emailFailed: 0, skipped: 0 };
    }
}

export function notifyLiveSessionScheduledBackground(input: NotifyLiveScheduledInput): void {
    void notifyLiveSessionScheduled(input).catch((err) => {
        console.error('[notifyLiveSessionScheduledBackground] unexpected:', err);
    });
}
