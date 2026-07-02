'use server';

import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { markLessonProgressSchema } from '@/features/lms/schemas/lms.schemas';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE, type UserRoleName } from '@/shared/lib/roles';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';
import { revalidatePath } from 'next/cache';

async function requireStudentContext(): Promise<{ userId: string; role: UserRoleName }> {
    const session = await getStudentAuthSession();
    if (!session) throw new Error('No autorizado');
    return { userId: session.studentId, role: USER_ROLE.STUDENT };
}

export async function markLessonProgress(
    institutionSlug: string | null,
    courseId: string,
    data: unknown,
): Promise<ActionResult> {
    try {
        const parsed = markLessonProgressSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireStudentContext();
        if (
            ctx.role !== USER_ROLE.STUDENT &&
            ctx.role !== USER_ROLE.ADMIN &&
            ctx.role !== USER_ROLE.PROFESOR
        ) {
            return fail('No autorizado');
        }

        const lesson = await prisma.lmsLesson.findFirst({
            where: { id: parsed.data.lessonId, module: { courseId } },
            select: { id: true, type: true, examId: true },
        });
        if (!lesson) return fail('Lección no encontrada.');

        if (ctx.role === USER_ROLE.STUDENT) {
            const enrollment = await prisma.lmsEnrollment.findUnique({
                where: { userId_courseId: { userId: ctx.userId, courseId } },
                select: { id: true },
            });
            if (!enrollment) return fail('No estás inscripto en este curso.');
        }

        if (lesson.type === 'EXAMEN' && parsed.data.completed && lesson.examId) {
            const result = await prisma.result.findUnique({
                where: { studentId_examId: { studentId: ctx.userId, examId: lesson.examId } },
                select: { id: true },
            });
            if (!result) return fail('Debes rendir el examen antes de completar esta lección.');
        }

        await prisma.lmsLessonProgress.upsert({
            where: { userId_lessonId: { userId: ctx.userId, lessonId: parsed.data.lessonId } },
            create: {
                userId: ctx.userId,
                lessonId: parsed.data.lessonId,
                completed: parsed.data.completed,
                lastSeenSec: parsed.data.lastSeenSec ?? null,
                completedAt: parsed.data.completed ? new Date() : null,
            },
            update: {
                completed: parsed.data.completed,
                lastSeenSec: parsed.data.lastSeenSec ?? null,
                completedAt: parsed.data.completed ? new Date() : null,
            },
        });

        await recomputeEnrollmentProgress(ctx.userId, courseId);

        revalidatePath(`/aula/cursos/${courseId}`);
        if (institutionSlug) revalidatePath(`/${institutionSlug}/aula/${courseId}`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al registrar progreso.'));
    }
}

async function recomputeEnrollmentProgress(userId: string, courseId: string): Promise<void> {
    const [totalLessons, completedLessons] = await Promise.all([
        prisma.lmsLesson.count({ where: { module: { courseId } } }),
        prisma.lmsLessonProgress.count({
            where: { userId, completed: true, lesson: { module: { courseId } } },
        }),
    ]);

    const pct = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
    const status = pct >= 100 ? 'COMPLETADO' : 'ACTIVO';

    await prisma.lmsEnrollment.update({
        where: { userId_courseId: { userId, courseId } },
        data: {
            progressPct: pct,
            status,
            completedAt: pct >= 100 ? new Date() : null,
        },
    });
}

export async function markLessonCompletionForExam(studentId: string, examId: string): Promise<void> {
    const lessons = await prisma.lmsLesson.findMany({
        where: { examId },
        select: { id: true, module: { select: { courseId: true } } },
    });

    for (const lesson of lessons) {
        const courseId = lesson.module.courseId;
        const enrollment = await prisma.lmsEnrollment.findUnique({
            where: { userId_courseId: { userId: studentId, courseId } },
            select: { id: true },
        });
        if (!enrollment) continue;

        await prisma.lmsLessonProgress.upsert({
            where: { userId_lessonId: { userId: studentId, lessonId: lesson.id } },
            create: {
                userId: studentId,
                lessonId: lesson.id,
                completed: true,
                completedAt: new Date(),
            },
            update: { completed: true, completedAt: new Date() },
        });

        await recomputeEnrollmentProgress(studentId, courseId);
    }
}

export async function enrollInCourse(
    institutionSlug: string | null,
    courseId: string,
): Promise<ActionResult> {
    try {
        const ctx = await requireStudentContext();
        if (ctx.role !== USER_ROLE.STUDENT) return fail('Solo estudiantes pueden inscribirse.');

        const course = await prisma.lmsCourse.findUnique({
            where: { id: courseId },
            select: { id: true, published: true },
        });
        if (!course?.published) return fail('Curso no disponible.');

        await prisma.lmsEnrollment.upsert({
            where: { userId_courseId: { userId: ctx.userId, courseId } },
            create: { userId: ctx.userId, courseId, status: 'ACTIVO' },
            update: { status: 'ACTIVO' },
        });

        revalidatePath('/aula/cursos');
        revalidatePath(`/aula/cursos/${courseId}`);
        if (institutionSlug) revalidatePath(`/${institutionSlug}/aula/${courseId}`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al inscribirse.'));
    }
}
