'use server';

import { prisma } from '@/lib/prisma';
import { createResultSession, getStudentSession } from '@/lib/student-session';
import { type SubmitAnswerInput, submitAnswerSchema } from '@/schemas/exam-session';

export async function submitAnswer(input: SubmitAnswerInput): Promise<void> {
    const session = await getStudentSession();
    if (!session) throw new Error('Sesión de examen no válida.');

    const { questionId, optionId } = submitAnswerSchema.parse(input);

    const [question, option] = await Promise.all([
        prisma.question.findFirst({ where: { id: questionId, examId: session.examId } }),
        prisma.option.findFirst({ where: { id: optionId, questionId }, select: { id: true } }),
    ]);

    if (!question) throw new Error('Pregunta no encontrada.');
    if (!option) throw new Error('Opción no válida.');

    await prisma.answer.upsert({
        where: { attemptKey_questionId: { attemptKey: session.attemptKey, questionId } },
        update: { optionId },
        create: {
            attemptKey: session.attemptKey,
            studentId: session.studentId,
            examId: session.examId,
            questionId,
            optionId,
        },
    });
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

    const answerMap: Record<string, string> = {};
    for (const a of answers) answerMap[a.questionId] = a.optionId;

    let score = 0;
    let maxScore = 0;
    for (const q of exam.questions) {
        maxScore += q.points;
        const correctId = q.options[0]?.id;
        if (correctId && answerMap[q.id] === correctId) score += q.points;
    }

    const result = await prisma.result.create({
        data: { studentId, examId, score, maxScore, answers: answerMap },
    });

    await prisma.answer.deleteMany({ where: { attemptKey } });
    await createResultSession(result.id, studentId);

    return { resultId: result.id };
}
