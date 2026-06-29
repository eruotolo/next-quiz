'use server';

import { revalidatePath } from 'next/cache';
import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import {
    deleteLmsForumPostSchema,
    lmsForumPostSchema,
    lmsForumSchema,
    lmsForumThreadSchema,
    updateLmsForumSchema,
} from '@/features/lms/schemas/lms-phase3-forums.schemas';
import {
    notifyNewForumPostBackground,
} from '@/features/lms/lib/forum-notifications';
import { sanitizeForumMarkdown } from '@/shared/lib/sanitize';
import { logAudit } from '@/shared/lib/audit';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';

interface SiteUrlProvider {
    getSiteUrl(): Promise<string>;
}

const defaultSiteUrlProvider: SiteUrlProvider = {
    getSiteUrl: async () => process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? '',
};

let siteUrlProvider: SiteUrlProvider = defaultSiteUrlProvider;

export function configureForumSiteUrl(provider: SiteUrlProvider): void {
    siteUrlProvider = provider;
}

// ─── Foros ─────────────────────────────────────────────────────────────────

export async function createLmsForum(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = lmsForumSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const course = await prisma.lmsCourse.findUnique({
            where: { id: parsed.data.courseId },
            select: { id: true, academicInstitutionId: true },
        });
        if (!course) return fail('Curso no encontrado');
        if (course.academicInstitutionId !== ctx.institutionId) {
            return fail('El curso no pertenece a esta institución');
        }

        const forum = await prisma.lmsForum.create({
            data: {
                courseId: course.id,
                title: parsed.data.title,
                description: parsed.data.description ?? null,
            },
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsForum',
            entityId: forum.id,
            metadata: { courseId: course.id, forumId: forum.id },
        });

        revalidatePath(`/${slug}/aula/${course.id}`);
        return ok({ id: forum.id });
    } catch (error) {
        return fail<{ id: string }>(toActionError(error, 'No se pudo crear el foro'));
    }
}

export async function updateLmsForum(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = updateLmsForumSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const forum = await prisma.lmsForum.findUnique({
            where: { id: parsed.data.forumId },
            include: { course: { select: { academicInstitutionId: true } } },
        });
        if (!forum) return fail('Foro no encontrado');
        if (forum.course.academicInstitutionId !== ctx.institutionId) {
            return fail('El foro no pertenece a esta institución');
        }

        const updated = await prisma.lmsForum.update({
            where: { id: forum.id },
            data: {
                title: parsed.data.title ?? forum.title,
                description:
                    parsed.data.description === undefined
                        ? forum.description
                        : parsed.data.description,
                archived: parsed.data.archived ?? forum.archived,
            },
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsForum',
            entityId: updated.id,
        });

        revalidatePath(`/${slug}/aula/${forum.courseId}`);
        return ok({ id: updated.id });
    } catch (error) {
        return fail<{ id: string }>(toActionError(error, 'No se pudo actualizar el foro'));
    }
}

// ─── Hilos ────────────────────────────────────────────────────────────────

export async function createLmsForumThread(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string; postId: string }>> {
    try {
        const parsed = lmsForumThreadSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const forum = await prisma.lmsForum.findUnique({
            where: { id: parsed.data.forumId },
            include: {
                course: { select: { id: true, academicInstitutionId: true } },
            },
        });
        if (!forum) return fail('Foro no encontrado');
        if (forum.archived) return fail('El foro está archivado');
        if (forum.course.academicInstitutionId !== ctx.institutionId) {
            return fail('El foro no pertenece a esta institución');
        }

        const thread = await prisma.$transaction(async (tx) => {
            const t = await tx.lmsForumThread.create({
                data: {
                    forumId: forum.id,
                    title: parsed.data.title,
                    authorId: ctx.userId,
                    lastPostAt: new Date(),
                },
            });

            await tx.lmsForumPost.create({
                data: {
                    threadId: t.id,
                    authorId: ctx.userId,
                    body: parsed.data.body,
                },
            });

            return t;
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsForumThread',
            entityId: thread.id,
        });

        const posts = await prisma.lmsForumPost.findFirst({
            where: { threadId: thread.id },
            orderBy: { createdAt: 'desc' },
            select: { id: true },
        });

        revalidatePath(`/${slug}/aula/${forum.course.id}/foro/${thread.id}`);
        revalidatePath(`/${slug}/aula/${forum.course.id}`);

        return ok({ id: thread.id, postId: posts?.id ?? '' });
    } catch (error) {
        return fail<{ id: string; postId: string }>(
            toActionError(error, 'No se pudo crear el hilo'),
        );
    }
}

export async function toggleForumThreadPin(
    slug: string,
    threadId: string,
): Promise<ActionResult<{ pinned: boolean }>> {
    try {
        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const thread = await prisma.lmsForumThread.findUnique({
            where: { id: threadId },
            include: {
                forum: {
                    include: {
                        course: { select: { id: true, academicInstitutionId: true } },
                    },
                },
            },
        });
        if (!thread) return fail('Hilo no encontrado');
        if (thread.forum.course.academicInstitutionId !== ctx.institutionId) {
            return fail('El hilo no pertenece a esta institución');
        }

        const updated = await prisma.lmsForumThread.update({
            where: { id: threadId },
            data: { pinned: !thread.pinned },
        });

        revalidatePath(`/${slug}/aula/${thread.forum.course.id}/foro/${thread.id}`);

        return ok({ pinned: updated.pinned });
    } catch (error) {
        return fail<{ pinned: boolean }>(toActionError(error, 'No se pudo pinear el hilo'));
    }
}

export async function toggleForumThreadLock(
    slug: string,
    threadId: string,
): Promise<ActionResult<{ locked: boolean }>> {
    try {
        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const thread = await prisma.lmsForumThread.findUnique({
            where: { id: threadId },
            include: {
                forum: {
                    include: {
                        course: { select: { id: true, academicInstitutionId: true } },
                    },
                },
            },
        });
        if (!thread) return fail('Hilo no encontrado');
        if (thread.forum.course.academicInstitutionId !== ctx.institutionId) {
            return fail('El hilo no pertenece a esta institución');
        }

        const updated = await prisma.lmsForumThread.update({
            where: { id: threadId },
            data: { locked: !thread.locked },
        });

        revalidatePath(`/${slug}/aula/${thread.forum.course.id}/foro/${thread.id}`);

        return ok({ locked: updated.locked });
    } catch (error) {
        return fail<{ locked: boolean }>(toActionError(error, 'No se pudo bloquear el hilo'));
    }
}

// ─── Posts ────────────────────────────────────────────────────────────────

export async function createLmsForumPost(
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = lmsForumPostSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const session = await import('@/features/exam-session/lib/session').then((m) =>
            m.getStudentAuthSession(),
        );
        if (!session) return fail('No hay sesión de estudiante activa');

        const thread = await prisma.lmsForumThread.findUnique({
            where: { id: parsed.data.threadId },
            include: {
                forum: {
                    include: { course: { select: { id: true, academicInstitutionId: true } } },
                },
            },
        });
        if (!thread) return fail('Hilo no encontrado');
        if (thread.forum.archived) return fail('El foro está archivado');
        if (thread.locked) return fail('El hilo está cerrado a nuevas respuestas');

        const enrollment = await prisma.lmsEnrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.studentId,
                    courseId: thread.forum.course.id,
                },
            },
            select: { status: true },
        });
        if (!enrollment || enrollment.status !== 'ACTIVO') {
            return fail('No estás inscripto en este curso');
        }

        const sanitizedBody = sanitizeForumMarkdown(parsed.data.body);

        const post = await prisma.lmsForumPost.create({
            data: {
                threadId: thread.id,
                authorId: session.studentId,
                parentPostId: parsed.data.parentPostId ?? null,
                body: sanitizedBody,
            },
        });

        await prisma.lmsForumThread.update({
            where: { id: thread.id },
            data: { lastPostAt: post.createdAt },
        });

        const siteUrl = await siteUrlProvider.getSiteUrl();
        if (siteUrl) {
            notifyNewForumPostBackground({
                threadId: thread.id,
                postId: post.id,
                authorId: session.studentId,
                siteUrl,
            });
        }

        revalidatePath(`/aula/cursos/${thread.forum.course.id}/foro/${thread.id}`);

        return ok({ id: post.id });
    } catch (error) {
        return fail<{ id: string }>(toActionError(error, 'No se pudo crear el post'));
    }
}

export async function createLmsForumPostAdmin(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = lmsForumPostSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const thread = await prisma.lmsForumThread.findUnique({
            where: { id: parsed.data.threadId },
            include: {
                forum: {
                    include: {
                        course: { select: { id: true, academicInstitutionId: true } },
                    },
                },
            },
        });
        if (!thread) return fail('Hilo no encontrado');
        if (thread.forum.archived) return fail('El foro está archivado');
        if (thread.forum.course.academicInstitutionId !== ctx.institutionId) {
            return fail('El hilo no pertenece a esta institución');
        }

        const sanitizedBody = sanitizeForumMarkdown(parsed.data.body);

        const post = await prisma.lmsForumPost.create({
            data: {
                threadId: thread.id,
                authorId: ctx.userId,
                parentPostId: parsed.data.parentPostId ?? null,
                body: sanitizedBody,
            },
        });

        await prisma.lmsForumThread.update({
            where: { id: thread.id },
            data: { lastPostAt: post.createdAt },
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsForumPost',
            entityId: post.id,
            metadata: { threadId: thread.id, isStaffPost: true },
        });

        const siteUrl = await siteUrlProvider.getSiteUrl();
        if (siteUrl) {
            notifyNewForumPostBackground({
                threadId: thread.id,
                postId: post.id,
                authorId: ctx.userId,
                siteUrl,
            });
        }

        revalidatePath(`/${slug}/aula/${thread.forum.course.id}/foro/${thread.id}`);

        return ok({ id: post.id });
    } catch (error) {
        return fail<{ id: string }>(toActionError(error, 'No se pudo crear el post'));
    }
}

export async function deleteLmsForumPost(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = deleteLmsForumPostSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const post = await prisma.lmsForumPost.findUnique({
            where: { id: parsed.data.postId },
            include: {
                thread: {
                    include: {
                        forum: {
                            include: {
                                course: {
                                    select: { id: true, academicInstitutionId: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!post) return fail('Post no encontrado');
        if (post.thread.forum.course.academicInstitutionId !== ctx.institutionId) {
            return fail('El post no pertenece a esta institución');
        }

        await prisma.lmsForumPost.update({
            where: { id: post.id },
            data: { body: '[contenido eliminado por el moderador]' },
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsForumPost',
            entityId: post.id,
            metadata: { deletion: 'soft', threadId: post.threadId },
        });

        revalidatePath(
            `/${slug}/aula/${post.thread.forum.course.id}/foro/${post.threadId}`,
        );

        return ok({ id: post.id });
    } catch (error) {
        return fail<{ id: string }>(toActionError(error, 'No se pudo eliminar el post'));
    }
}

export async function editLmsForumPost(
    slug: string,
    data: { postId: string; body: string },
): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = lmsForumPostSchema
            .pick({ body: true })
            .safeParse({ threadId: data.postId, body: data.body });
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const post = await prisma.lmsForumPost.findUnique({
            where: { id: data.postId },
            include: {
                thread: {
                    include: {
                        forum: {
                            include: {
                                course: {
                                    select: { id: true, academicInstitutionId: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!post) return fail('Post no encontrado');
        if (post.thread.forum.course.academicInstitutionId !== ctx.institutionId) {
            return fail('El post no pertenece a esta institución');
        }
        if (post.thread.locked) return fail('El hilo está cerrado a nuevas respuestas');

        const sanitizedBody = sanitizeForumMarkdown(data.body);

        await prisma.lmsForumPost.update({
            where: { id: post.id },
            data: { body: sanitizedBody, editedAt: new Date() },
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsForumPost',
            entityId: post.id,
            metadata: { edit: true, threadId: post.threadId },
        });

        revalidatePath(
            `/${slug}/aula/${post.thread.forum.course.id}/foro/${post.threadId}`,
        );

        return ok({ id: post.id });
    } catch (error) {
        return fail<{ id: string }>(toActionError(error, 'No se pudo editar el post'));
    }
}
