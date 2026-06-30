'use server';

import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import {
    gradeSubmissionSchema,
    lmsAssignmentSchema,
    lmsSubmissionSchema,
} from '@/features/lms/schemas/lms-phase2.schemas';
import { clipChilenGrade } from '@/features/lms/lib/gradebook';
import { awardPointsForEvent } from '@/features/lms/lib/points-engine';
import { logAudit } from '@/shared/lib/audit';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';
import { revalidatePath } from 'next/cache';

// ─── Assignments (config por el docente) ───────────────────────────────────

export async function upsertLmsAssignment(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = lmsAssignmentSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const lesson = await prisma.lmsLesson.findUnique({
            where: { id: parsed.data.lessonId },
            include: { module: { include: { course: true } } },
        });
        if (!lesson) return fail('Lección no encontrada');
        if (lesson.module.course.academicInstitutionId !== ctx.institutionId) {
            return fail('La lección no pertenece a esta institución');
        }
        if (lesson.type !== 'TAREA') {
            return fail('La lección debe ser de tipo TAREA para tener una asignación');
        }

        const assignment = await prisma.lmsAssignment.upsert({
            where: { lessonId: lesson.id },
            create: {
                lessonId: lesson.id,
                instructions: parsed.data.instructions ?? null,
                dueAt: parsed.data.dueAt ?? null,
                maxScore: parsed.data.maxScore,
            },
            update: {
                instructions: parsed.data.instructions ?? null,
                dueAt: parsed.data.dueAt ?? null,
                maxScore: parsed.data.maxScore,
            },
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsAssignment',
            entityId: assignment.id,
            metadata: { lessonId: lesson.id },
        });

        return ok({ id: assignment.id });
    } catch (error) {
        return fail<{ id: string }>(toActionError(error, 'No se pudo guardar la tarea'));
    }
}

export async function getLmsAssignmentByLesson(
    slug: string,
    lessonId: string,
): Promise<
    ActionResult<{
        id: string;
        instructions: string | null;
        dueAt: Date | null;
        maxScore: number;
    } | null>
> {
    try {
        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const lesson = await prisma.lmsLesson.findUnique({
            where: { id: lessonId },
            include: { module: { include: { course: true } } },
        });
        if (!lesson)
            return fail<{
                id: string;
                instructions: string | null;
                dueAt: Date | null;
                maxScore: number;
            } | null>('Lección no encontrada');
        if (lesson.module.course.academicInstitutionId !== ctx.institutionId) {
            return fail<{
                id: string;
                instructions: string | null;
                dueAt: Date | null;
                maxScore: number;
            } | null>('La lección no pertenece a esta institución');
        }

        const assignment = await prisma.lmsAssignment.findUnique({
            where: { lessonId },
        });
        if (!assignment) return ok(null);
        return ok({
            id: assignment.id,
            instructions: assignment.instructions,
            dueAt: assignment.dueAt,
            maxScore: assignment.maxScore,
        });
    } catch (error) {
        return fail<{
            id: string;
            instructions: string | null;
            dueAt: Date | null;
            maxScore: number;
        } | null>(toActionError(error, 'No se pudo leer la tarea'));
    }
}

// ─── Submissions (entregas del estudiante) ──────────────────────────────────

export async function submitLmsAssignment(data: unknown): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = lmsSubmissionSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const session = await getStudentAuthSession();
        if (!session) return fail<{ id: string }>('No estás autenticado como estudiante');

        if (!parsed.data.fileUrl && !parsed.data.textContent) {
            return fail<{ id: string }>('Debes adjuntar un archivo o escribir una respuesta');
        }

        // Verificar que el assignment existe y pertenece a un curso al que
        // el estudiante está inscripto (anti-IDOR + anti-flujo fantasma).
        const assignment = await prisma.lmsAssignment.findUnique({
            where: { id: parsed.data.assignmentId },
            include: {
                lesson: {
                    include: {
                        module: {
                            include: {
                                course: {
                                    include: {
                                        enrollments: {
                                            where: { userId: session.studentId },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!assignment) return fail<{ id: string }>('Tarea no encontrada');
        if (assignment.lesson.module.course.enrollments.length === 0) {
            return fail<{ id: string }>('No estás inscripto en este curso');
        }

        // Auto-marca de "atrasado" si la fecha de entrega ya pasó.
        const now = new Date();
        const isLate = assignment.dueAt !== null && assignment.dueAt < now;

        const submission = await prisma.lmsSubmission.upsert({
            where: {
                assignmentId_studentId: {
                    assignmentId: assignment.id,
                    studentId: session.studentId,
                },
            },
            create: {
                assignmentId: assignment.id,
                studentId: session.studentId,
                fileUrl: parsed.data.fileUrl ?? null,
                textContent: parsed.data.textContent ?? null,
                status: isLate ? 'ATRASADO' : 'ENTREGADO',
                submittedAt: now,
            },
            update: {
                fileUrl: parsed.data.fileUrl ?? null,
                textContent: parsed.data.textContent ?? null,
                status: isLate ? 'ATRASADO' : 'ENTREGADO',
                submittedAt: now,
            },
        });

        revalidatePath(
            `/aula/cursos/${assignment.lesson.module.courseId}/leccion/${assignment.lessonId}`,
        );

        // Gamificación (Fase 4): +10 pts al entregar la tarea (fire-and-forget).
        void awardPointsForEvent({
            userId: session.studentId,
            sourceType: 'ASSIGNMENT_SUBMITTED',
            amount: 10,
            reason: 'Entrega de tarea',
            courseId: assignment.lesson.module.courseId,
            sourceId: submission.id,
            dedupeKey: `ASSIGNMENT_SUBMITTED:${submission.id}`,
        }).catch((err) => console.error('[gamification] ASSIGNMENT_SUBMITTED failed', err));

        return ok({ id: submission.id });
    } catch (error) {
        return fail<{ id: string }>(toActionError(error, 'No se pudo entregar la tarea'));
    }
}

export async function gradeLmsSubmission(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = gradeSubmissionSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const submission = await prisma.lmsSubmission.findUnique({
            where: { id: parsed.data.submissionId },
            include: {
                assignment: {
                    include: {
                        lesson: {
                            include: {
                                module: {
                                    include: { course: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!submission) return fail<{ id: string }>('Entrega no encontrada');
        if (
            submission.assignment.lesson.module.course.academicInstitutionId !== ctx.institutionId
        ) {
            return fail<{ id: string }>('La entrega no pertenece a esta institución');
        }

        const clippedScore = clipChilenGrade(parsed.data.score);

        const updated = await prisma.lmsSubmission.update({
            where: { id: submission.id },
            data: {
                score: clippedScore,
                feedback: parsed.data.feedback ?? null,
                status: 'CALIFICADO',
                gradedAt: new Date(),
            },
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsSubmission',
            entityId: updated.id,
            metadata: {
                studentId: submission.studentId,
                score: clippedScore,
            },
        });

        revalidatePath(`/aula/cursos/${submission.assignment.lesson.module.courseId}`);

        // Gamificación (Fase 4): +5 pts al recibir calificación (fire-and-forget).
        void awardPointsForEvent({
            userId: submission.studentId,
            sourceType: 'ASSIGNMENT_GRADED',
            amount: 5,
            reason: 'Tarea calificada',
            courseId: submission.assignment.lesson.module.courseId,
            sourceId: updated.id,
            dedupeKey: `ASSIGNMENT_GRADED:${updated.id}`,
        }).catch((err) => console.error('[gamification] ASSIGNMENT_GRADED failed', err));

        return ok({ id: updated.id });
    } catch (error) {
        return fail<{ id: string }>(toActionError(error, 'No se pudo calificar la entrega'));
    }
}

export async function listSubmissionsForAssignment(
    slug: string,
    assignmentId: string,
): Promise<
    ActionResult<
        Array<{
            id: string;
            studentId: string;
            studentName: string;
            fileUrl: string | null;
            textContent: string | null;
            status: string;
            score: number | null;
            feedback: string | null;
            submittedAt: Date | null;
        }>
    >
> {
    try {
        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const assignment = await prisma.lmsAssignment.findUnique({
            where: { id: assignmentId },
            include: {
                lesson: { include: { module: { include: { course: true } } } },
            },
        });
        if (!assignment) return fail('Tarea no encontrada');
        if (assignment.lesson.module.course.academicInstitutionId !== ctx.institutionId) {
            return fail('La tarea no pertenece a esta institución');
        }

        const submissions = await prisma.lmsSubmission.findMany({
            where: { assignmentId },
            include: {
                student: { select: { id: true, name: true, lastname: true } },
            },
            orderBy: { submittedAt: { sort: 'desc', nulls: 'last' } },
        });

        return ok(
            submissions.map((s) => ({
                id: s.id,
                studentId: s.student.id,
                studentName: `${s.student.name} ${s.student.lastname}`.trim(),
                fileUrl: s.fileUrl,
                textContent: s.textContent,
                status: s.status,
                score: s.score,
                feedback: s.feedback,
                submittedAt: s.submittedAt,
            })),
        );
    } catch (error) {
        return fail<
            Array<{
                id: string;
                studentId: string;
                studentName: string;
                fileUrl: string | null;
                textContent: string | null;
                status: string;
                score: number | null;
                feedback: string | null;
                submittedAt: Date | null;
            }>
        >(toActionError(error, 'No se pudieron listar las entregas'));
    }
}

export async function getMySubmission(assignmentId: string): Promise<
    ActionResult<{
        id: string;
        fileUrl: string | null;
        textContent: string | null;
        status: string;
        score: number | null;
        feedback: string | null;
        submittedAt: Date | null;
    } | null>
> {
    try {
        const session = await getStudentAuthSession();
        if (!session) return fail('No estás autenticado');

        const submission = await prisma.lmsSubmission.findUnique({
            where: {
                assignmentId_studentId: {
                    assignmentId,
                    studentId: session.studentId,
                },
            },
        });
        if (!submission) return ok(null);
        return ok({
            id: submission.id,
            fileUrl: submission.fileUrl,
            textContent: submission.textContent,
            status: submission.status,
            score: submission.score,
            feedback: submission.feedback,
            submittedAt: submission.submittedAt,
        });
    } catch (error) {
        return fail<{
            id: string;
            fileUrl: string | null;
            textContent: string | null;
            status: string;
            score: number | null;
            feedback: string | null;
            submittedAt: Date | null;
        } | null>(toActionError(error, 'No se pudo leer tu entrega'));
    }
}
