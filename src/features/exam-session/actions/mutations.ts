'use server';

import { prisma } from '@/shared/lib/prisma';
import { createResultSession, getStudentSession } from '@/features/exam-session/lib/session';
import {
    type SubmitAnswerInput,
    submitAnswerSchema,
} from '@/features/exam-session/schemas/exam-session.schemas';

export async function submitAnswer(input: SubmitAnswerInput): Promise<void> {
    const session = await getStudentSession();
    if (!session) throw new Error('Sesión de examen no válida.');

    const { questionId, optionIds } = submitAnswerSchema.parse(input);

    const [question, options] = await Promise.all([
        prisma.question.findFirst({ where: { id: questionId, examId: session.examId } }),
        prisma.option.findMany({
            where: { id: { in: optionIds }, questionId },
            select: { id: true },
        }),
    ]);

    if (!question) throw new Error('Pregunta no encontrada.');
    if (options.length !== optionIds.length) throw new Error('Una o más opciones no son válidas.');

    await prisma.$transaction([
        prisma.answer.deleteMany({
            where: { attemptKey: session.attemptKey, questionId },
        }),
        prisma.answer.createMany({
            data: optionIds.map((optionId) => ({
                attemptKey: session.attemptKey,
                studentId: session.studentId,
                examId: session.examId,
                questionId,
                optionId,
            })),
        }),
    ]);
}

export async function finishExam(): Promise<{ resultId: string }> {
    return computeAndSave();
}

export async function autoSubmit(): Promise<{ resultId: string }> {
    return computeAndSave();
}

async function computeAndSave(): Promise<{ resultId: string }> {
    const session = await getStudentSession();
    if (!session) throw new Error('Sesión no válida.');

    const { studentId, examId, attemptKey } = session;

    const existing = await prisma.result.findUnique({
        where: { studentId_examId: { studentId, examId } },
    });
    if (existing) {
        await createResultSession(existing.id, studentId);
        return { resultId: existing.id };
    }

    const [exam, answers] = await Promise.all([
        prisma.exam.findUnique({
            where: { id: examId },
            include: {
                questions: {
                    orderBy: { order: 'asc' },
                    include: {
                        options: { where: { isCorrect: true }, select: { id: true } },
                    },
                },
            },
        }),
        prisma.answer.findMany({ where: { attemptKey } }),
    ]);

    if (!exam) throw new Error('Examen no encontrado.');

    // Build answerMap: questionId -> array of selected optionIds
    const answerMap: Record<string, string[]> = {};
    for (const a of answers) {
        const existing = answerMap[a.questionId];
        if (existing) {
            existing.push(a.optionId);
        } else {
            answerMap[a.questionId] = [a.optionId];
        }
    }

    let score = 0;
    let maxScore = 0;
    for (const q of exam.questions) {
        maxScore += q.points;
        const correctSet = new Set(q.options.map((o) => o.id));
        const studentSet = new Set(answerMap[q.id] ?? []);
        // All-or-nothing: score only if selected set exactly matches correct set
        const isCorrect =
            correctSet.size === studentSet.size &&
            [...correctSet].every((id) => studentSet.has(id));
        if (isCorrect) score += q.points;
    }

    const result = await prisma.result.create({
        data: { studentId, examId, score, maxScore, answers: answerMap },
    });

    await prisma.answer.deleteMany({ where: { attemptKey } });
    await createResultSession(result.id, studentId);

    return { resultId: result.id };
}
