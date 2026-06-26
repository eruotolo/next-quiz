'use server';

import { prisma } from '@/shared/lib/prisma';
import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';

async function assertExamInstitution(examId: string, institutionId: string): Promise<void> {
    const exam = await prisma.exam.findFirst({
        where: { id: examId, academicInstitutionId: institutionId },
        select: { id: true },
    });
    if (!exam) throw new Error('Examen no encontrado o sin acceso');
}

/**
 * Pausa el intento de un alumno: pone endsAt = null.
 * El alumno queda en estado "intro" (timer detenido, respuestas conservadas).
 * Al refrescar su página, el sistema lo redirige a la pantalla de instrucciones.
 */
export async function pauseExamAttempt(
    slug: string,
    studentId: string,
    examId: string,
): Promise<void> {
    const { institutionId } = await requireInstitutionAccess(slug);
    await assertExamInstitution(examId, institutionId);

    await prisma.examAttempt.updateMany({
        where: { studentId, examId },
        data: { endsAt: null },
    });
}

/**
 * Cancela el intento de un alumno: elimina sus respuestas y el intento.
 * El alumno puede volver a rendir el examen desde cero.
 */
export async function cancelExamAttempt(
    slug: string,
    studentId: string,
    examId: string,
): Promise<void> {
    const { institutionId } = await requireInstitutionAccess(slug);
    await assertExamInstitution(examId, institutionId);

    await prisma.$transaction([
        prisma.answer.deleteMany({ where: { studentId, examId } }),
        prisma.examAttempt.deleteMany({ where: { studentId, examId } }),
    ]);
}
