'use server';

import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { prisma } from '@/shared/lib/prisma';
import { type ActionResult, ok, fail, toActionError } from '@/shared/types/action';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createThreadSchema = z.object({
    forumId: z.string().uuid(),
    title: z.string().min(3).max(200),
    body: z.string().min(1).max(16000),
});

const createPostSchema = z.object({
    threadId: z.string().uuid(),
    parentPostId: z.string().uuid().nullable().optional(),
    body: z.string().min(1).max(16000),
});

const createForumSchema = z.object({
    title: z.string().min(2).max(200),
    description: z.string().max(500).optional(),
});

// ─── Internal helpers ────────────────────────────────────────────────────────

async function notifyThreadParticipants(
    threadId: string,
    excludeUserId: string,
    message: string,
    link: string,
): Promise<void> {
    const participantIds = await prisma.lmsForumPost
        .findMany({
            where: { threadId },
            select: { authorId: true },
            distinct: ['authorId'],
        })
        .then((rows) => rows.map((r) => r.authorId).filter((id) => id !== excludeUserId));

    if (participantIds.length === 0) return;

    await prisma.lmsNotification.createMany({
        data: participantIds.map((userId) => ({
            userId,
            type: 'NEW_POST',
            message,
            link,
        })),
        skipDuplicates: true,
    });
}

// ─── Student actions ─────────────────────────────────────────────────────────

export async function getForumsForCourse(
    courseId: string,
): Promise<ActionResult<ForumWithThreads[]>> {
    try {
        const session = await getStudentAuthSession();
        if (!session) return fail('No autenticado');

        const forums = await prisma.lmsForum.findMany({
            where: { courseId, archived: false },
            orderBy: { order: 'asc' },
            select: {
                id: true,
                title: true,
                description: true,
                threads: {
                    where: { forum: { archived: false } },
                    orderBy: [{ pinned: 'desc' }, { lastPostAt: 'desc' }, { createdAt: 'desc' }],
                    select: {
                        id: true,
                        title: true,
                        pinned: true,
                        locked: true,
                        lastPostAt: true,
                        createdAt: true,
                        authorId: true,
                        author: { select: { name: true, lastname: true } },
                        _count: { select: { posts: true } },
                    },
                },
            },
        });

        return ok(forums);
    } catch (err) {
        return fail(toActionError(err));
    }
}

export async function getLmsThread(threadId: string): Promise<ActionResult<ThreadDetail>> {
    try {
        const session = await getStudentAuthSession();
        if (!session) return fail('No autenticado');

        const thread = await prisma.lmsForumThread.findUnique({
            where: { id: threadId },
            select: {
                id: true,
                title: true,
                pinned: true,
                locked: true,
                createdAt: true,
                forum: {
                    select: {
                        id: true,
                        title: true,
                        courseId: true,
                        course: { select: { academicInstitutionId: true } },
                    },
                },
                author: { select: { id: true, name: true, lastname: true } },
                posts: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        parentPostId: true,
                        body: true,
                        editedAt: true,
                        createdAt: true,
                        authorId: true,
                        author: { select: { name: true, lastname: true } },
                    },
                },
            },
        });

        if (!thread) return fail('Hilo no encontrado');

        // Verify student belongs to the institution
        const student = await prisma.user.findUnique({
            where: { id: session.studentId },
            select: { academicInstitutionId: true },
        });
        if (student?.academicInstitutionId !== thread.forum.course.academicInstitutionId) {
            return fail('Sin acceso');
        }

        return ok(thread);
    } catch (err) {
        return fail(toActionError(err));
    }
}

export async function createLmsThread(
    data: z.infer<typeof createThreadSchema>,
): Promise<ActionResult<{ threadId: string }>> {
    try {
        const session = await getStudentAuthSession();
        if (!session) return fail('No autenticado');

        const parsed = createThreadSchema.safeParse(data);
        if (!parsed.success) return fail('Datos inválidos');

        const forum = await prisma.lmsForum.findUnique({
            where: { id: parsed.data.forumId },
            select: { archived: true, courseId: true, course: { select: { academicInstitutionId: true } } },
        });
        if (!forum || forum.archived) return fail('Foro no disponible');

        const student = await prisma.user.findUnique({
            where: { id: session.studentId },
            select: { academicInstitutionId: true },
        });
        if (student?.academicInstitutionId !== forum.course.academicInstitutionId) {
            return fail('Sin acceso');
        }

        const thread = await prisma.lmsForumThread.create({
            data: {
                forumId: parsed.data.forumId,
                title: parsed.data.title,
                authorId: session.studentId,
                lastPostAt: new Date(),
                posts: {
                    create: {
                        authorId: session.studentId,
                        body: parsed.data.body,
                    },
                },
            },
            select: { id: true },
        });

        revalidatePath(`/aula/cursos/${forum.courseId}/foro`);
        return ok({ threadId: thread.id });
    } catch (err) {
        return fail(toActionError(err));
    }
}

export async function createLmsPost(
    data: z.infer<typeof createPostSchema>,
): Promise<ActionResult<{ postId: string }>> {
    try {
        const session = await getStudentAuthSession();
        if (!session) return fail('No autenticado');

        const parsed = createPostSchema.safeParse(data);
        if (!parsed.success) return fail('Datos inválidos');

        const thread = await prisma.lmsForumThread.findUnique({
            where: { id: parsed.data.threadId },
            select: {
                locked: true,
                forum: { select: { courseId: true, course: { select: { academicInstitutionId: true } } } },
            },
        });
        if (!thread) return fail('Hilo no encontrado');
        if (thread.locked) return fail('Este hilo está cerrado');

        const student = await prisma.user.findUnique({
            where: { id: session.studentId },
            select: { academicInstitutionId: true, name: true, lastname: true },
        });
        if (student?.academicInstitutionId !== thread.forum.course.academicInstitutionId) {
            return fail('Sin acceso');
        }

        const [post] = await prisma.$transaction([
            prisma.lmsForumPost.create({
                data: {
                    threadId: parsed.data.threadId,
                    parentPostId: parsed.data.parentPostId ?? null,
                    authorId: session.studentId,
                    body: parsed.data.body,
                },
                select: { id: true },
            }),
            prisma.lmsForumThread.update({
                where: { id: parsed.data.threadId },
                data: { lastPostAt: new Date() },
            }),
        ]);

        // Notify participants asynchronously (fire-and-forget)
        const authorName = `${student.name} ${student.lastname}`.trim();
        void notifyThreadParticipants(
            parsed.data.threadId,
            session.studentId,
            `${authorName} respondió en el hilo`,
            `/aula/cursos/${thread.forum.courseId}/foro/${parsed.data.threadId}`,
        );

        revalidatePath(`/aula/cursos/${thread.forum.courseId}/foro/${parsed.data.threadId}`);
        return ok({ postId: post.id });
    } catch (err) {
        return fail(toActionError(err));
    }
}

// ─── Admin actions ────────────────────────────────────────────────────────────

export async function getAdminForumsForCourse(
    slug: string,
    courseId: string,
): Promise<ActionResult<ForumWithThreads[]>> {
    try {
        await requireInstitutionAccess(slug);
        const forums = await prisma.lmsForum.findMany({
            where: { courseId },
            orderBy: { order: 'asc' },
            select: {
                id: true,
                title: true,
                description: true,
                archived: true,
                threads: {
                    orderBy: [{ pinned: 'desc' }, { lastPostAt: 'desc' }, { createdAt: 'desc' }],
                    select: {
                        id: true,
                        title: true,
                        pinned: true,
                        locked: true,
                        lastPostAt: true,
                        createdAt: true,
                        authorId: true,
                        author: { select: { name: true, lastname: true } },
                        _count: { select: { posts: true } },
                    },
                },
            },
        });
        return ok(forums);
    } catch (err) {
        return fail(toActionError(err));
    }
}

export async function createLmsForum(
    slug: string,
    courseId: string,
    data: z.infer<typeof createForumSchema>,
): Promise<ActionResult<{ forumId: string }>> {
    try {
        const { institutionId } = await requireInstitutionAccess(slug);
        const parsed = createForumSchema.safeParse(data);
        if (!parsed.success) return fail('Datos inválidos');

        const course = await prisma.lmsCourse.findFirst({
            where: { id: courseId, academicInstitutionId: institutionId },
            select: { id: true },
        });
        if (!course) return fail('Curso no encontrado');

        const count = await prisma.lmsForum.count({ where: { courseId } });
        const forum = await prisma.lmsForum.create({
            data: { courseId, title: parsed.data.title, description: parsed.data.description, order: count },
            select: { id: true },
        });

        revalidatePath(`/${slug}/aula/${courseId}/foro`);
        return ok({ forumId: forum.id });
    } catch (err) {
        return fail(toActionError(err));
    }
}

export async function pinLmsThread(
    slug: string,
    threadId: string,
    pinned: boolean,
): Promise<ActionResult<null>> {
    try {
        await requireInstitutionAccess(slug);
        await prisma.lmsForumThread.update({ where: { id: threadId }, data: { pinned } });
        return ok(null);
    } catch (err) {
        return fail(toActionError(err));
    }
}

export async function lockLmsThread(
    slug: string,
    threadId: string,
    locked: boolean,
): Promise<ActionResult<null>> {
    try {
        await requireInstitutionAccess(slug);
        await prisma.lmsForumThread.update({ where: { id: threadId }, data: { locked } });
        return ok(null);
    } catch (err) {
        return fail(toActionError(err));
    }
}

export async function deleteLmsForumPost(
    slug: string,
    postId: string,
): Promise<ActionResult<null>> {
    try {
        await requireInstitutionAccess(slug);
        await prisma.lmsForumPost.delete({ where: { id: postId } });
        return ok(null);
    } catch (err) {
        return fail(toActionError(err));
    }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ForumThread {
    id: string;
    title: string;
    pinned: boolean;
    locked: boolean;
    lastPostAt: Date | null;
    createdAt: Date;
    authorId: string;
    author: { name: string; lastname: string };
    _count: { posts: number };
}

export interface ForumWithThreads {
    id: string;
    title: string;
    description: string | null;
    archived?: boolean;
    threads: ForumThread[];
}

export interface ForumPost {
    id: string;
    parentPostId: string | null;
    body: string;
    editedAt: Date | null;
    createdAt: Date;
    authorId: string;
    author: { name: string; lastname: string };
}

export interface ThreadDetail {
    id: string;
    title: string;
    pinned: boolean;
    locked: boolean;
    createdAt: Date;
    forum: { id: string; title: string; courseId: string };
    author: { id: string; name: string; lastname: string };
    posts: ForumPost[];
}
