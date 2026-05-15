import { auth } from '@/features/auth/auth';
import { ExamEditorClient } from '@/features/exams/components/ExamEditorClient';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { notFound, redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ slug: string; id: string }>;
}

export default async function ExamEditorPage({ params }: PageProps) {
    const [{ id }, session] = await Promise.all([params, auth()]);
    if (!session) redirect('/login');

    const isProfesor = session.user.userRoleName === USER_ROLE.PROFESOR;

    const exam = await prisma.exam.findUnique({
        where: {
            id,
            ...(isProfesor && {
                groups: { some: { professors: { some: { id: session.user.id } } } },
            }),
        },
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
