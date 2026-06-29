import { sendEmail } from '@/shared/lib/email';
import { sanitizeForumMarkdown } from '@/shared/lib/sanitize';
import { prisma } from '@/shared/lib/prisma';

/**
 * Plantilla HTML para "Nuevo post en un hilo del foro".
 * Estilo consistente con los emails existentes de Aulika (Result, AdminWelcome).
 * El author/course/thread vienen ya saneados por el caller; el body se pasa
 * en markdown y se renderiza a HTML seguro con `sanitizeForumMarkdown` antes
 * de inyectarlo en la plantilla.
 */
export function buildNewForumPostEmail(input: {
    recipientName: string;
    authorName: string;
    courseName: string;
    threadTitle: string;
    postExcerptHtml: string;
    threadUrl: string;
}): string {
    const {
        recipientName,
        authorName,
        courseName,
        threadTitle,
        postExcerptHtml,
        threadUrl,
    } = input;

    return `
<!DOCTYPE html>
<html lang="es">
<body style="font-family: sans-serif; color: #111; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="margin-bottom: 4px;">Hola ${escapeEmailText(recipientName)}</h2>
  <p style="color: #555; margin-top: 0;">
    <strong>${escapeEmailText(authorName)}</strong> respondió en el foro de
    <strong>${escapeEmailText(courseName)}</strong>.
  </p>
  <table style="width:100%; border-collapse:collapse; margin: 24px 0;">
    <tr>
      <td style="padding: 12px; background:#f4f4f5; border-radius:8px;">
        <p style="margin:0 0 6px 0; font-weight:600; color:#111;">${escapeEmailText(threadTitle)}</p>
        <div style="color:#374151; font-size:14px; line-height:1.5;">${postExcerptHtml}</div>
      </td>
    </tr>
  </table>
  <p style="margin: 24px 0;">
    <a href="${escapeAttr(threadUrl)}"
       style="display:inline-block; padding:10px 18px; background:#2563eb; color:#fff; text-decoration:none; border-radius:6px; font-weight:600;">
      Abrir el hilo
    </a>
  </p>
  <p style="color:#6b7280; font-size:13px; margin-top:24px;">
    Podés dejar de recibir notificaciones por hilo desde los ajustes del curso.
  </p>
</body>
</html>`.trim();
}

function escapeEmailText(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttr(str: string): string {
    return escapeEmailText(str);
}

interface NotifyNewForumPostInput {
    threadId: string;
    postId: string;
    authorId: string;
    siteUrl: string;
}

interface NotifyResult {
    sent: number;
    failed: number;
    skipped: number;
}

/**
 * Notifica por email a los receptores relevantes cuando llega un nuevo post
 * a un hilo del foro:
 *   - Otros participantes del hilo (autores de posts previos) excepto el autor
 *     del nuevo post.
 *   - Todos los estudiantes inscriptos activos al curso (si la institución
 *     está apuntada en `academicInstitutionId`).
 *
 * Las notificaciones son best-effort: se ejecutan en background (`void`),
 * cuentan internos para evitar auto-notificación, dedupean destinatarios y
 * nunca lanzan excepciones (se loguean con `console.error`).
 *
 * El sitio debe conocer su URL base vía `siteUrl` (sin slash al final).
 */
export async function notifyNewForumPost(
    input: NotifyNewForumPostInput,
): Promise<NotifyResult> {
    const { threadId, postId, authorId, siteUrl } = input;

    try {
        const thread = await prisma.lmsForumThread.findUnique({
            where: { id: threadId },
            include: {
                forum: {
                    include: {
                        course: { select: { id: true, title: true, academicInstitutionId: true } },
                    },
                },
                author: { select: { id: true, name: true, lastname: true, email: true } },
            },
        });
        if (!thread) return { sent: 0, failed: 0, skipped: 1 };

        const post = await prisma.lmsForumPost.findUnique({
            where: { id: postId },
            include: { author: { select: { id: true, name: true, lastname: true } } },
        });
        if (!post) return { sent: 0, failed: 0, skipped: 1 };

        const institutionId = thread.forum.course.academicInstitutionId;
        if (!institutionId) return { sent: 0, failed: 0, skipped: 1 };

        const threadParticipants = await prisma.lmsForumPost.findMany({
            where: { threadId, authorId: { not: authorId } },
            distinct: ['authorId'],
            select: {
                author: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        lastname: true,
                    },
                },
            },
        });

        const courseEnrolledStudents = await prisma.lmsEnrollment.findMany({
            where: {
                courseId: thread.forum.course.id,
                status: 'ACTIVO',
                userId: { not: authorId },
            },
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

        const recipientMap = new Map<
            string,
            { id: string; email: string; name: string; lastname: string }
        >();

        for (const tp of threadParticipants) {
            if (tp.author.email) {
                recipientMap.set(tp.author.id, tp.author);
            }
        }
        for (const ce of courseEnrolledStudents) {
            if (ce.user.email) {
                recipientMap.set(ce.user.id, ce.user);
            }
        }

        if (recipientMap.size === 0) return { sent: 0, failed: 0, skipped: 0 };

        const authorFullName = `${post.author.name} ${post.author.lastname ?? ''}`.trim();
        const threadUrl = `${siteUrl}/aula/cursos/${thread.forum.course.id}/foro/${thread.id}`;
        const truncatedBody =
            post.body.length > 400 ? `${post.body.slice(0, 400).trim()}…` : post.body;

        let sent = 0;
        let failed = 0;

        for (const recipient of recipientMap.values()) {
            const excerptHtml = renderExcerptHtml(truncatedBody);
            const html = buildNewForumPostEmail({
                recipientName: `${recipient.name} ${recipient.lastname ?? ''}`.trim(),
                authorName: authorFullName,
                courseName: thread.forum.course.title,
                threadTitle: thread.title,
                postExcerptHtml: excerptHtml,
                threadUrl,
            });

            const result = await sendEmail({
                to: recipient.email,
                toName: `${recipient.name} ${recipient.lastname ?? ''}`.trim(),
                subject: `Nuevo mensaje en: ${thread.title}`,
                htmlContent: html,
            });

            if (result.sent) sent++;
            else failed++;
        }

        return { sent, failed, skipped: 0 };
    } catch (err) {
        console.error('[notifyNewForumPost] error:', err);
        return { sent: 0, failed: 0, skipped: 0 };
    }
}

function renderExcerptHtml(md: string): string {
    return sanitizeForumMarkdown(md);
}

/**
 * Lanza la notificación de nuevo post del foro en background. No bloquea al
 * caller y captura errores. Pensado para invocarse como
 * `void notifyNewForumPostBackground(...)` desde un Server Action.
 */
export function notifyNewForumPostBackground(input: NotifyNewForumPostInput): void {
    void notifyNewForumPost(input).catch((err) => {
        console.error('[notifyNewForumPostBackground] unexpected:', err);
    });
}
