'use server';

import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import {
    lmsGradeSchema,
    lmsGradebookItemSchema,
} from '@/features/lms/schemas/lms-phase2.schemas';
import {
    calculateCourseFinalGrade,
    clipChilenGrade,
    syncExamGrade,
} from '@/features/lms/lib/gradebook';
import { awardPointsForEvent } from '@/features/lms/lib/points-engine';
import { tryIssueCertificate } from '@/features/lms/lib/certificate-issuer';
import { logAudit } from '@/shared/lib/audit';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';
import { revalidatePath } from 'next/cache';

// ─── Gradebook Items (CRUD) ──────────────────────────────────────────────────

export async function createLmsGradebookItem(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = lmsGradebookItemSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const course = await prisma.lmsCourse.findUnique({
            where: { id: parsed.data.courseId },
        });
        if (!course) return fail('Curso no encontrado');
        if (course.academicInstitutionId !== ctx.institutionId) {
            return fail('El curso no pertenece a esta institución');
        }

        // Coherencia de tipo: TAREA exige assignmentId, EXAMEN exige examId.
        if (parsed.data.type === 'TAREA' && !parsed.data.assignmentId) {
            return fail('Una unidad tipo TAREA debe vincularse a una tarea');
        }
        if (parsed.data.type === 'EXAMEN' && !parsed.data.examId) {
            return fail('Una unidad tipo EXAMEN debe vincularse a un examen');
        }

        const item = await prisma.lmsGradebookItem.create({
            data: {
                courseId: parsed.data.courseId,
                title: parsed.data.title,
                type: parsed.data.type,
                weight: parsed.data.weight,
                assignmentId: parsed.data.assignmentId ?? null,
                examId: parsed.data.examId ?? null,
            },
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_CREATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsGradebookItem',
            entityId: item.id,
            metadata: { courseId: course.id, type: item.type },
        });

        revalidatePath(`/aula/cursos/${course.id}`);
        return ok({ id: item.id });
    } catch (error) {
        return fail<{ id: string }>(
            toActionError(error, 'No se pudo crear el item del gradebook'),
        );
    }
}

export async function updateLmsGradebookItem(
    slug: string,
    itemId: string,
    data: { title?: string; weight?: number },
): Promise<ActionResult<{ id: string }>> {
    try {
        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const item = await prisma.lmsGradebookItem.findUnique({
            where: { id: itemId },
            include: { course: true },
        });
        if (!item) return fail('Item no encontrado');
        if (item.course.academicInstitutionId !== ctx.institutionId) {
            return fail('El item no pertenece a esta institución');
        }

        await prisma.lmsGradebookItem.update({
            where: { id: itemId },
            data: {
                ...(data.title !== undefined && { title: data.title }),
                ...(data.weight !== undefined && { weight: data.weight }),
            },
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsGradebookItem',
            entityId: itemId,
            metadata: { changes: data },
        });

        revalidatePath(`/aula/cursos/${item.courseId}`);
        return ok({ id: itemId });
    } catch (error) {
        return fail<{ id: string }>(toActionError(error, 'No se pudo actualizar el item'));
    }
}

export async function deleteLmsGradebookItem(
    slug: string,
    itemId: string,
): Promise<ActionResult<{ id: string }>> {
    try {
        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
        ]);

        const item = await prisma.lmsGradebookItem.findUnique({
            where: { id: itemId },
            include: { course: true },
        });
        if (!item) return fail('Item no encontrado');
        if (item.course.academicInstitutionId !== ctx.institutionId) {
            return fail('El item no pertenece a esta institución');
        }

        await prisma.lmsGradebookItem.delete({ where: { id: itemId } });

        await logAudit({
            action: AUDIT_ACTION.COURSE_DELETE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsGradebookItem',
            entityId: itemId,
        });

        revalidatePath(`/aula/cursos/${item.courseId}`);
        return ok({ id: itemId });
    } catch (error) {
        return fail<{ id: string }>(toActionError(error, 'No se pudo eliminar el item'));
    }
}

// ─── Grades (notas individuales) ────────────────────────────────────────────

export async function recordLmsGrade(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = lmsGradeSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const item = await prisma.lmsGradebookItem.findUnique({
            where: { id: parsed.data.gradebookItemId },
            include: { course: true },
        });
        if (!item) return fail('Item no encontrado');
        if (item.course.academicInstitutionId !== ctx.institutionId) {
            return fail('El item no pertenece a esta institución');
        }
        if (item.type === 'EXAMEN') {
            return fail(
                'Las notas de un examen embebido se sincronizan vía syncExamGrades, no se registran manualmente',
            );
        }

        const score = clipChilenGrade(parsed.data.score);

        const grade = await prisma.lmsGrade.upsert({
            where: {
                gradebookItemId_studentId: {
                    gradebookItemId: item.id,
                    studentId: parsed.data.studentId,
                },
            },
            create: {
                gradebookItemId: item.id,
                studentId: parsed.data.studentId,
                score,
                feedback: parsed.data.feedback ?? null,
            },
            update: {
                score,
                feedback: parsed.data.feedback ?? null,
            },
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsGrade',
            entityId: grade.id,
            metadata: { studentId: parsed.data.studentId, score },
        });

        // Gamificación (Fase 4): +5 pts por nota registrada (fire-and-forget).
        void awardPointsForEvent({
            userId: parsed.data.studentId,
            sourceType: 'ASSIGNMENT_GRADED',
            amount: 5,
            reason: 'Nota registrada',
            courseId: item.courseId,
            sourceId: grade.id,
            dedupeKey: `GRADE_RECORDED:${grade.id}`,
        }).catch((err) => console.error('[gamification] GRADE_RECORDED failed', err));

        revalidatePath(`/aula/cursos/${item.courseId}`);
        return ok({ id: grade.id });
    } catch (error) {
        return fail<{ id: string }>(toActionError(error, 'No se pudo registrar la nota'));
    }
}

// ─── Sincronización con Exam de Aulika ──────────────────────────────────────

export async function syncExamGrades(
    slug: string,
    gradebookItemId: string,
): Promise<ActionResult<{ synced: number }>> {
    try {
        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const item = await prisma.lmsGradebookItem.findUnique({
            where: { id: gradebookItemId },
            include: { course: true },
        });
        if (!item) return fail('Item no encontrado');
        if (item.course.academicInstitutionId !== ctx.institutionId) {
            return fail('El item no pertenece a esta institución');
        }
        if (item.type !== 'EXAMEN' || !item.examId) {
            return fail('Solo se pueden sincronizar items tipo EXAMEN con examId');
        }

        // Trae todos los Results del examen (todos los estudiantes que rindieron).
        const results = await prisma.result.findMany({
            where: { examId: item.examId },
            select: { studentId: true, score: true },
        });

        let synced = 0;
        for (const r of results) {
            const normalizedScore = syncExamGrade(r.score);
            if (normalizedScore === null) continue;

            await prisma.lmsGrade.upsert({
                where: {
                    gradebookItemId_studentId: {
                        gradebookItemId: item.id,
                        studentId: r.studentId,
                    },
                },
                create: {
                    gradebookItemId: item.id,
                    studentId: r.studentId,
                    score: normalizedScore,
                },
                update: {
                    score: normalizedScore,
                },
            });

            // Gamificación (Fase 4): +15 pts si aprobó (>= 4.0).
            if (normalizedScore >= 4.0) {
                void awardPointsForEvent({
                    userId: r.studentId,
                    sourceType: 'EXAM_PASSED',
                    amount: 15,
                    reason: 'Examen aprobado',
                    courseId: item.courseId,
                    sourceId: r.studentId,
                    dedupeKey: `EXAM_PASSED:${item.examId}:${r.studentId}`,
                }).catch((err) => console.error('[gamification] EXAM_PASSED failed', err));

                // Fase 5: emisión de certificado si el curso lo habilita.
                void tryIssueCertificate({
                    userId: r.studentId,
                    courseId: item.courseId,
                    finalGrade: normalizedScore,
                    slug,
                }).catch((err) => console.error('[certificates] issue failed', err));
            }

            synced += 1;
        }

        await logAudit({
            action: AUDIT_ACTION.COURSE_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsGradebookItem',
            entityId: gradebookItemId,
            metadata: { synced, source: 'exam_sync' },
        });

        revalidatePath(`/aula/cursos/${item.courseId}`);
        return ok({ synced });
    } catch (error) {
        return fail<{ synced: number }>(toActionError(error, 'No se pudo sincronizar el examen'));
    }
}

// ─── Lectura del Gradebook completo para un curso ────────────────────────────

export async function getLmsGradebookForCourse(
    slug: string,
    courseId: string,
): Promise<
    ActionResult<{
        items: Array<{
            id: string;
            title: string;
            type: string;
            weight: number;
            assignmentId: string | null;
            examId: string | null;
        }>;
        grades: Array<{
            studentId: string;
            studentName: string;
            items: Array<{ gradebookItemId: string; score: number | null }>;
            average: number | null;
            passed: boolean | null;
        }>;
    }>
> {
    try {
        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const course = await prisma.lmsCourse.findUnique({
            where: { id: courseId },
        });
        if (!course) return fail('Curso no encontrado');
        if (course.academicInstitutionId !== ctx.institutionId) {
            return fail('El curso no pertenece a esta institución');
        }

        const [items, enrollments] = await Promise.all([
            prisma.lmsGradebookItem.findMany({
                where: { courseId },
                orderBy: { createdAt: 'asc' },
            }),
            prisma.lmsEnrollment.findMany({
                where: { courseId, status: { in: ['ACTIVO', 'COMPLETADO'] } },
                include: {
                    user: { select: { id: true, name: true, lastname: true } },
                },
            }),
        ]);

        const studentIds = enrollments.map((e) => e.user.id);
        const grades =
            studentIds.length > 0
                ? await prisma.lmsGrade.findMany({
                      where: { gradebookItemId: { in: items.map((i) => i.id) } },
                  })
                : [];

        const gradesByStudent = new Map<string, Map<string, number>>();
        for (const g of grades) {
            if (!gradesByStudent.has(g.studentId)) {
                gradesByStudent.set(g.studentId, new Map());
            }
            gradesByStudent.get(g.studentId)?.set(g.gradebookItemId, g.score);
        }

        const rows = enrollments.map((e) => {
            const studentMap = gradesByStudent.get(e.user.id) ?? new Map();
            const enrichedItems = items.map((it) => ({
                id: it.id,
                title: it.title,
                type: it.type,
                weight: it.weight,
                assignmentId: it.assignmentId,
                examId: it.examId,
                score: studentMap.get(it.id) ?? null,
            }));
            const final = calculateCourseFinalGrade(
                e.user.id,
                enrichedItems.map((it) => ({
                    id: it.id,
                    title: it.title,
                    weight: it.weight,
                    score: it.score,
                })),
            );
            return {
                studentId: e.user.id,
                studentName: `${e.user.name} ${e.user.lastname}`.trim(),
                items: enrichedItems.map((it) => ({
                    gradebookItemId: it.id,
                    score: it.score,
                })),
                average: final.average,
                passed: final.passed,
            };
        });

        return ok({
            items: items.map((it) => ({
                id: it.id,
                title: it.title,
                type: it.type,
                weight: it.weight,
                assignmentId: it.assignmentId,
                examId: it.examId,
            })),
            grades: rows,
        });
    } catch (error) {
        return fail<{
            items: Array<{
                id: string;
                title: string;
                type: string;
                weight: number;
                assignmentId: string | null;
                examId: string | null;
            }>;
            grades: Array<{
                studentId: string;
                studentName: string;
                items: Array<{ gradebookItemId: string; score: number | null }>;
                average: number | null;
                passed: boolean | null;
            }>;
        }>(toActionError(error, 'No se pudo leer el gradebook'));
    }
}
