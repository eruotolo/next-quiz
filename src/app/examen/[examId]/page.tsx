import { ExamCarousel } from '@/components/exam/ExamCarousel';
import { prisma } from '@/lib/prisma';
import { getStudentSession } from '@/lib/student-session';
import type { SafeExam } from '@/types/exam';
import { redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ examId: string }>;
}

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
                include: {
                    options: {
                        select: { id: true, text: true },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            },
        },
    });

    if (!exam) redirect('/examen/login');

    const safeExam: SafeExam = {
        id: exam.id,
        title: exam.title,
        timeLimit: exam.timeLimit,
        antiCheatEnabled: exam.antiCheatEnabled,
        questions: exam.questions.map((q) => ({
            id: q.id,
            text: q.text,
            points: q.points,
            order: q.order,
            options: q.options,
        })),
    };

    const remainingSeconds = Math.max(0, Math.ceil((session.endsAt - Date.now()) / 1000));

    return <ExamCarousel exam={safeExam} initialSeconds={remainingSeconds} />;
}
