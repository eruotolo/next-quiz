'use server';

import { prisma } from '@/shared/lib/prisma';
import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { ok, fail } from '@/shared/types/action';
import type { ActionResult } from '@/shared/types/action';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { summarizeLessonText, type LessonSummary } from '@/features/lms/lib/lesson-summarizer';
import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { USER_ROLE } from '@/shared/lib/roles';
import { Prisma } from '@prisma/client';

const lessonIdSchema = z.string().uuid('Lección inválida');

function extractTextFromContentJson(contentJson: unknown): string {
    if (!contentJson) return '';
    if (typeof contentJson === 'string') return contentJson;

    const visit = (node: unknown): string => {
        if (typeof node === 'string') return node;
        if (!node || typeof node !== 'object') return '';
        const n = node as { type?: string; text?: string; content?: unknown[] };
        let out = '';
        if (typeof n.text === 'string') out += n.text;
        if (Array.isArray(n.content)) {
            for (const child of n.content) {
                const childText = visit(child);
                if (childText) out += (out ? ' ' : '') + childText;
            }
        }
        return out;
    };

    return visit(contentJson).trim();
}

export async function generateLessonSummary(
    slug: string,
    lessonId: string,
): Promise<ActionResult<LessonSummary>> {
    try {
        const parsed = lessonIdSchema.safeParse(lessonId);
        if (!parsed.success) return fail('ID de lección inválido.');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const lesson = await prisma.lmsLesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                type: true,
                contentJson: true,
                module: {
                    select: {
                        course: {
                            select: {
                                id: true,
                                aiSummaryEnabled: true,
                                academicInstitutionId: true,
                            },
                        },
                    },
                },
            },
        });

        if (!lesson) return fail('Lección no encontrada.');
        if (
            lesson.module.course.academicInstitutionId !== ctx.institutionId &&
            ctx.userRole !== USER_ROLE.SUPER_ADMIN
        ) {
            return fail('La lección no pertenece a esta institución.');
        }
        if (!lesson.module.course.aiSummaryEnabled) {
            return fail('Los resúmenes IA están deshabilitados en este curso.');
        }
        if (lesson.type !== 'TEXTO') {
            return fail('Solo las lecciones de tipo TEXTO admiten resumen automático.');
        }

        const text = extractTextFromContentJson(lesson.contentJson);
        if (!text) return fail('La lección no tiene contenido para resumir.');

        const result = await summarizeLessonText(text);
        if (!result.ok || !result.summary) {
            return fail(result.error ?? 'No se pudo generar el resumen.');
        }

        await prisma.lmsLesson.update({
            where: { id: lessonId },
            data: { summaryJson: result.summary as unknown as Prisma.InputJsonValue },
        });

        revalidatePath(`/${slug}/aula/${lesson.module.course.id}`);
        return ok(result.summary);
    } catch {
        return fail('Error al generar el resumen.');
    }
}

export async function getLessonSummary(
    lessonId: string,
): Promise<ActionResult<LessonSummary | null>> {
    try {
        const parsed = lessonIdSchema.safeParse(lessonId);
        if (!parsed.success) return fail('ID de lección inválido.');

        const session = await getStudentAuthSession();
        if (!session) return fail('No autenticado.');

        const lesson = await prisma.lmsLesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                summaryJson: true,
                module: {
                    select: {
                        course: {
                            select: { id: true, aiSummaryEnabled: true },
                        },
                    },
                },
            },
        });
        if (!lesson) return fail('Lección no encontrada.');

        const enrollment = await prisma.lmsEnrollment.findUnique({
            where: {
                userId_courseId: { userId: session.studentId, courseId: lesson.module.course.id },
            },
            select: { id: true, status: true },
        });
        if (!enrollment || enrollment.status === 'RETIRADO') {
            return fail('No estás inscripto en este curso.');
        }

        if (!lesson.summaryJson) return ok(null);
        return ok(lesson.summaryJson as unknown as LessonSummary);
    } catch {
        return fail('Error al cargar el resumen.');
    }
}

export async function clearLessonSummary(
    slug: string,
    lessonId: string,
): Promise<ActionResult<void>> {
    try {
        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const lesson = await prisma.lmsLesson.findUnique({
            where: { id: lessonId },
            select: {
                module: {
                    select: {
                        course: { select: { id: true, academicInstitutionId: true } },
                    },
                },
            },
        });
        if (
            !lesson ||
            (lesson.module.course.academicInstitutionId !== ctx.institutionId &&
                ctx.userRole !== USER_ROLE.SUPER_ADMIN)
        ) {
            return fail('Lección no encontrada.');
        }

        await prisma.lmsLesson.update({
            where: { id: lessonId },
            data: { summaryJson: Prisma.JsonNull },
        });

        revalidatePath(`/${slug}/aula/${lesson.module.course.id}`);
        return ok(undefined);
    } catch {
        return fail('Error al limpiar el resumen.');
    }
}
