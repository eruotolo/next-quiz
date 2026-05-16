import { auth } from '@/features/auth/auth';
import { ExamsClient } from '@/features/exams/components/ExamsClient';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { redirect } from 'next/navigation';

export default async function ExamsPage() {
    const session = await auth();
    if (!session) redirect('/login');

    const isProfesor = session.user.userRoleName === USER_ROLE.PROFESOR;
    const profesorId = session.user.id;

    const [exams, groups] = await Promise.all([
        prisma.exam.findMany({
            where: isProfesor
                ? { groups: { some: { professors: { some: { id: profesorId } } } } }
                : undefined,
            include: {
                groups: true,
                _count: { select: { questions: true, results: true } },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.group.findMany({
            where: isProfesor ? { professors: { some: { id: profesorId } } } : undefined,
            orderBy: { name: 'asc' },
        }),
    ]);

    return <ExamsClient exams={exams} groups={groups} />;
}
