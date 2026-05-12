import { prisma } from '@/lib/prisma';
import { ExamsClient } from './_components/ExamsClient';

export default async function ExamsPage() {
    const [exams, groups] = await Promise.all([
        prisma.exam.findMany({
            include: {
                group: true,
                _count: { select: { questions: true } },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.group.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return <ExamsClient exams={exams} groups={groups} />;
}
