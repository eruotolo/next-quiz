import { ExamCarousel } from '@/features/exam-session/components/ExamCarousel';
import { buildQuestionSeed, seededShuffle } from '@/features/exam-session/lib/shuffle';
import { getStudentSession } from '@/features/exam-session/lib/session';
import type { SafeExam, SafeQuestion } from '@/features/exam-session/types/exam.types';
import { prisma } from '@/shared/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ examId: string }>;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: gates secuenciales del examen (sesión, oneAttempt, uniqueIp, intento, respuestas) — separarlos dispersaría las validaciones
export default async function ExamPage({ params }: PageProps) {
    const { examId } = await params;
    const session = await getStudentSession();

    if (!session || session.examId !== examId) {
        redirect('/examen/login');
    }

    const exam = await prisma.exam.findUnique({
        where: { id: examId, active: true },
        include: {
            questions: {
                orderBy: { order: 'asc' },
                select: {
                    id: true,
                    text: true,
                    points: true,
                    order: true,
                    questionType: true,
                    options: {
                        select: { id: true, text: true },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            },
        },
    });

    if (!exam) redirect('/examen/login');

    // oneAttempt: redirect to existing result if student already completed this exam
    if (exam.oneAttempt) {
        const existingResult = await prisma.result.findUnique({
            where: { studentId_examId: { studentId: session.studentId, examId } },
            select: { id: true },
        });
        if (existingResult) redirect(`/examen/resultado/${existingResult.id}`);
    }

    // uniqueIp: block if another student already answered from the same IP
    if (exam.uniqueIp) {
        const requestHeaders = await headers();
        const clientIp =
            requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ??
            requestHeaders.get('x-real-ip') ??
            null;
        if (clientIp) {
            const ipConflict = await prisma.answer.findFirst({
                where: { examId, ip: clientIp, NOT: { studentId: session.studentId } },
                select: { id: true },
            });
            if (ipConflict) redirect('/examen/login');
        }
    }

    // Intento persistente: el tiempo restante autoritativo vive en la DB.
    // Sin intento iniciado (endsAt nulo) → primero las instrucciones.
    const attempt = await prisma.examAttempt.findUnique({
        where: { attemptKey: session.attemptKey },
        select: { endsAt: true },
    });
    if (!attempt?.endsAt) redirect(`/examen/${examId}/intro`);

    const orderedQuestions: SafeQuestion[] = exam.randomizeQuestions
        ? seededShuffle(exam.questions, buildQuestionSeed(session.attemptKey, exam.id))
        : exam.questions;

    const safeExam: SafeExam = {
        id: exam.id,
        title: exam.title,
        timeLimit: exam.timeLimit,
        antiCheatEnabled: exam.antiCheatEnabled,
        lockTabSwitch: exam.lockTabSwitch,
        questions: orderedQuestions,
    };

    // Respuestas ya guardadas del intento: hidratan la UI al reanudar o
    // navegar hacia atrás (la selección guardada vuelve a mostrarse).
    const answerRows = await prisma.answer.findMany({
        where: { attemptKey: session.attemptKey },
        select: { questionId: true, optionId: true, markedForReview: true },
    });
    const initialAnswers: Record<string, string[]> = {};
    const markedQuestionIds = new Set<string>();
    for (const row of answerRows) {
        const prev = initialAnswers[row.questionId];
        if (prev) {
            prev.push(row.optionId);
        } else {
            initialAnswers[row.questionId] = [row.optionId];
        }
        if (row.markedForReview) markedQuestionIds.add(row.questionId);
    }

    const remainingSeconds = Math.max(0, Math.ceil((attempt.endsAt.getTime() - Date.now()) / 1000));

    return (
        <ExamCarousel
            exam={safeExam}
            initialSeconds={remainingSeconds}
            initialAnswers={initialAnswers}
            initialMarked={[...markedQuestionIds]}
        />
    );
}
