import { ConfigExamsClient } from '@/features/config/components/ConfigExamsClient';
import { prisma } from '@/shared/lib/prisma';

export default async function ConfigExamsPage() {
    const [rawExams, count] = await Promise.all([
        prisma.exam.findMany({
            where: { demoSessionId: null, academicInstitutionId: { not: null } },
            include: {
                academicInstitution: { select: { name: true, slug: true } },
                createdBy: { select: { name: true, lastname: true } },
                _count: { select: { questions: true, results: true, groups: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 500,
        }),
        prisma.exam.count({ where: { demoSessionId: null } }),
    ]);

    const exams = rawExams.filter(
        (e): e is typeof e & { academicInstitution: { name: string; slug: string } } =>
            e.academicInstitution !== null,
    );

    return <ConfigExamsClient exams={exams} />;
}
