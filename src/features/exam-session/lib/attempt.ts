import { randomUUID } from 'node:crypto';
import { prisma } from '@/shared/lib/prisma';
import type { ExamAttempt } from '@prisma/client';

/**
 * Devuelve el intento vigente del estudiante para un examen, o crea uno nuevo.
 * Reusar el intento en un re-login evita resetear el tiempo y perder las
 * respuestas ya guardadas (la corrección lee por attemptKey).
 */
export async function getOrCreateAttempt(studentId: string, examId: string): Promise<ExamAttempt> {
    const existing = await prisma.examAttempt.findUnique({
        where: { studentId_examId: { studentId, examId } },
    });
    if (existing) return existing;

    try {
        return await prisma.examAttempt.create({
            data: { studentId, examId, attemptKey: randomUUID() },
        });
    } catch {
        // Carrera entre dos logins simultáneos: el unique ya lo creó.
        return prisma.examAttempt.findUniqueOrThrow({
            where: { studentId_examId: { studentId, examId } },
        });
    }
}

/**
 * endsAt para la cookie de sesión: el real del intento si ya comenzó, o un
 * máximo provisorio (instrucciones + duración del examen) si todavía no.
 */
export function sessionEndsAtFor(attempt: ExamAttempt, timeLimitMinutes: number): number {
    if (attempt.endsAt) return attempt.endsAt.getTime();
    return Date.now() + (timeLimitMinutes + 30) * 60 * 1000;
}
