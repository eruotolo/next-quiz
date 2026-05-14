import { prisma } from '@/shared/lib/prisma';
import { notFound } from 'next/navigation';
import { ExamEditorClient } from '@/features/exams/components/ExamEditorClient';

interface PageProps {
    params: Promise<{ slug: string; id: string }>;
}

export default async function ExamEditorPage({ params }: PageProps) {
    const { id } = await params;

    const exam = await prisma.exam.findUnique({
        where: { id },
        include: {
            groups: true,
            questions: {
                orderBy: { order: 'asc' },
                include: { options: { orderBy: { createdAt: 'asc' } } },
            },
        },
    });

    if (!exam) notFound();

    return <ExamEditorClient exam={exam} />;
}
