'use server';

import { prisma } from '@/shared/lib/prisma';
import {
    createResultSession,
    createStudentSession,
    getStudentAuthSession,
    getStudentSession,
} from '@/features/exam-session/lib/session';
import { getOrCreateAttempt, sessionEndsAtFor } from '@/features/exam-session/lib/attempt';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
    type SubmitAnswerInput,
    submitAnswerSchema,
} from '@/features/exam-session/schemas/exam-session.schemas';
import { calcGrade } from '@/features/results/lib/grade';
import { buildExamResultEmail, sendEmail } from '@/shared/lib/email';

/**
 * Inicia (o reanuda) el intento de un examen elegido en la página de selección.
 * Valida que el examen pertenezca al grupo del estudiante y siga pendiente.
 */
export async function startSelectedExam(examId: string): Promise<void> {
    const authSession = await getStudentAuthSession();
    if (!authSession) redirect('/examen/login');

    const student = await prisma.user.findUnique({
        where: { id: authSession.studentId },
        select: { academicInstitutionId: true },
    });
    if (!student) redirect('/examen/login');

    // Doble candado: el examen debe ser del grupo Y de la institución del estudiante.
    const exam = await prisma.exam.findFirst({
        where: {
            id: examId,
            active: true,
            academicInstitutionId: student.academicInstitutionId,
            groups: { some: { id: authSession.groupId } },
            questions: { some: {} },
            results: { none: { studentId: authSession.studentId } },
        },
        select: { id: true, timeLimit: true, scheduledAt: true, closesAt: true },
    });
    if (!exam) redirect('/examen/seleccion');

    const existingAttempt = await prisma.examAttempt.findUnique({
        where: { studentId_examId: { studentId: authSession.studentId, examId: exam.id } },
    });

    // Tiempo agotado sin entregar (cerró el navegador o perdió conexión mientras
    // rendía): se auto-entrega lo respondido y se muestra el resultado.
    if (existingAttempt?.endsAt && existingAttempt.endsAt.getTime() <= Date.now()) {
        const resultId = await gradeAttempt(
            authSession.studentId,
            exam.id,
            existingAttempt.attemptKey,
        );
        await createResultSession(resultId, authSession.studentId);
        redirect(`/examen/resultado/${resultId}`);
    }

    // Sin intento en curso: respetar la ventana del examen (no antes del inicio ni
    // después del cierre). Un intento ya iniciado se reanuda aunque el examen cierre.
    const now = Date.now();
    if (!existingAttempt?.endsAt) {
        const notOpen = exam.scheduledAt !== null && exam.scheduledAt.getTime() > now;
        const closed = exam.closesAt !== null && exam.closesAt.getTime() < now;
        if (notOpen || closed) redirect('/examen/seleccion');
    }

    const attempt = await getOrCreateAttempt(authSession.studentId, exam.id);

    await createStudentSession({
        studentId: authSession.studentId,
        examId: exam.id,
        endsAt: sessionEndsAtFor(attempt, exam.timeLimit),
        attemptKey: attempt.attemptKey,
    });

    redirect(attempt.endsAt ? `/examen/${exam.id}` : `/examen/${exam.id}/intro`);
}

/**
 * Abre el resultado de un examen ya rendido por el estudiante autenticado.
 * Crea la sesión de resultado (cookie) tras validar la propiedad y redirige.
 */
export async function viewMyResult(resultId: string): Promise<void> {
    const authSession = await getStudentAuthSession();
    if (!authSession) redirect('/examen/login');

    const result = await prisma.result.findFirst({
        where: { id: resultId, studentId: authSession.studentId },
        select: { id: true },
    });
    if (!result) redirect('/examen/seleccion');

    await createResultSession(result.id, authSession.studentId);
    redirect(`/examen/resultado/${result.id}`);
}

/**
 * Arranca el cronómetro al presionar "Comenzar examen" en las instrucciones.
 * Si el intento ya tenía endsAt (reanudación) lo respeta.
 */
export async function beginExam(): Promise<void> {
    const session = await getStudentSession();
    if (!session) redirect('/examen/login');

    const attempt = await prisma.examAttempt.findUnique({
        where: { attemptKey: session.attemptKey },
    });
    if (!attempt) redirect('/examen/login');

    let endsAt = attempt.endsAt;
    if (!endsAt) {
        const exam = await prisma.exam.findUnique({
            where: { id: session.examId },
            select: { timeLimit: true },
        });
        if (!exam) redirect('/examen/login');
        endsAt = new Date(Date.now() + exam.timeLimit * 60 * 1000);
        await prisma.examAttempt.update({
            where: { attemptKey: session.attemptKey },
            data: { startedAt: new Date(), endsAt },
        });
    }

    await createStudentSession({
        studentId: session.studentId,
        examId: session.examId,
        endsAt: endsAt.getTime(),
        attemptKey: session.attemptKey,
    });

    redirect(`/examen/${session.examId}`);
}

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

    const requestHeaders = await headers();
    const ip =
        requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        requestHeaders.get('x-real-ip') ??
        undefined;

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
                ip,
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

export async function toggleMarkQuestion(questionId: string): Promise<void> {
    const session = await getStudentSession();
    if (!session) return;

    const existing = await prisma.answer.findFirst({
        where: { attemptKey: session.attemptKey, questionId },
        select: { markedForReview: true },
    });
    if (!existing) return;

    await prisma.answer.updateMany({
        where: { attemptKey: session.attemptKey, questionId },
        data: { markedForReview: !existing.markedForReview },
    });
}

export async function recordTabSwitch(durationMs: number): Promise<void> {
    const session = await getStudentSession();
    if (!session) return;

    await prisma.tabSwitchEvent.create({
        data: {
            attemptKey: session.attemptKey,
            studentId: session.studentId,
            examId: session.examId,
            durationMs,
        },
    });
}

export async function recordAnswerTiming(questionId: string, ms: number): Promise<void> {
    const session = await getStudentSession();
    if (!session) return;

    await prisma.answer.updateMany({
        where: { attemptKey: session.attemptKey, questionId },
        data: { timeSpentMs: ms, answeredAt: new Date() },
    });
}

/**
 * Califica el intento (por attemptKey) y persiste el Result. No depende de la
 * cookie de sesión, por lo que sirve tanto para la entrega normal como para la
 * auto-entrega de un intento cuyo tiempo venció. Idempotente: si ya existe el
 * Result, lo devuelve sin recalcular.
 */
async function gradeAttempt(studentId: string, examId: string, attemptKey: string): Promise<string> {
    const existing = await prisma.result.findUnique({
        where: { studentId_examId: { studentId, examId } },
    });
    if (existing) return existing.id;

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
        const prev = answerMap[a.questionId];
        if (prev) {
            prev.push(a.optionId);
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

    try {
        const result = await prisma.result.create({
            data: { studentId, examId, score, maxScore, answers: answerMap },
        });

        await prisma.answer.deleteMany({ where: { attemptKey } });
        await prisma.examAttempt.deleteMany({ where: { attemptKey } });

        // Email fire-and-forget al alumno con su resultado. No bloquea la entrega
        // ni falla si Brevo no está configurado o el alumno no tiene email.
        void sendExamResultEmail(
            studentId,
            exam.title,
            score,
            maxScore,
            exam.maxGrade,
            exam.passingGrade,
            exam.passingPercentage,
        );

        return result.id;
    } catch (err: unknown) {
        if ((err as { code?: string })?.code === 'P2002') {
            const existingFallback = await prisma.result.findUnique({
                where: { studentId_examId: { studentId, examId } },
            });
            if (existingFallback) return existingFallback.id;
        }
        throw err;
    }
}

async function sendExamResultEmail(
    studentId: string,
    examTitle: string,
    score: number,
    maxScore: number,
    maxGrade: number,
    passingGrade: number,
    passingPercentage: number,
): Promise<void> {
    try {
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            select: { email: true, name: true, lastname: true },
        });
        if (!student?.email) return;
        const grade = calcGrade(score, maxScore, maxGrade, passingGrade, passingPercentage);
        await sendEmail({
            to: student.email,
            toName: `${student.name} ${student.lastname}`,
            subject: `Resultado: ${examTitle}`,
            htmlContent: buildExamResultEmail(
                `${student.name} ${student.lastname}`,
                examTitle,
                grade,
                maxGrade,
                passingGrade,
            ),
        });
    } catch (err) {
        console.error('[email] sendExamResultEmail failed:', err);
    }
}

async function computeAndSave(): Promise<{ resultId: string }> {
    try {
        const session = await getStudentSession();
        if (!session) throw new Error('Sesión no válida.');

        const resultId = await gradeAttempt(session.studentId, session.examId, session.attemptKey);
        await createResultSession(resultId, session.studentId);

        return { resultId };
    } catch (err) {
        console.error('Error en computeAndSave:', err);
        throw new Error('Error al finalizar el examen. Por favor, intenta de nuevo.');
    }
}

export async function logoutStudent(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete('aulika-student-auth');
    cookieStore.delete('aulika-student-session');
    cookieStore.delete('aulika-result-session');
    cookieStore.delete('student_session');
    cookieStore.delete('result_session');
    redirect('/examen/login');
}
