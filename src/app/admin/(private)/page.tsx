import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { DashboardClient } from './_components/DashboardClient';

async function getStats() {
    const [groups, students, exams, results, activeExams] = await Promise.all([
        prisma.group.count(),
        prisma.user.count({ where: { role: Role.STUDENT } }),
        prisma.exam.count(),
        prisma.result.count(),
        prisma.exam.count({ where: { active: true } }),
    ]);
    return { groups, students, exams, results, activeExams };
}

export default async function AdminDashboardPage() {
    const [session, stats, groups] = await Promise.all([
        auth(),
        getStats(),
        prisma.group.findMany({ orderBy: { name: 'asc' } }),
    ]);

    const firstName = session?.user?.name?.split(' ')[0] ?? 'Admin';

    return <DashboardClient firstName={firstName} stats={stats} groups={groups} />;
}
