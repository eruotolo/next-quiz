import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/features/dashboard/components/DashboardClient';

interface Props {
    params: Promise<{ slug: string }>;
}

async function getStats(academicInstitutionId: string) {
    const [groups, students, exams, results, activeExams] = await Promise.all([
        prisma.group.count(),
        prisma.user.count({
            where: {
                userRole: { name: USER_ROLE.STUDENT },
                academicInstitutionId,
            },
        }),
        prisma.exam.count(),
        prisma.result.count(),
        prisma.exam.count({ where: { active: true } }),
    ]);
    return { groups, students, exams, results, activeExams };
}

export default async function InstitutionDashboardPage({ params }: Props) {
    const [{ slug }, session] = await Promise.all([params, auth()]);
    if (!session) redirect('/login');

    let institutionId: string;
    if (session.user.userRoleName === USER_ROLE.SUPER_ADMIN) {
        const inst = await prisma.academicInstitution.findUnique({ where: { slug }, select: { id: true } });
        if (!inst) redirect('/config');
        institutionId = inst.id;
    } else {
        if (!session.user.academicInstitutionId) redirect('/login');
        institutionId = session.user.academicInstitutionId;
    }

    const [stats, groups] = await Promise.all([
        getStats(institutionId),
        prisma.group.findMany({ orderBy: { name: 'asc' } }),
    ]);

    const firstName = session.user.name?.split(' ')[0] ?? 'Admin';

    return <DashboardClient firstName={firstName} stats={stats} groups={groups} slug={slug} />;
}
