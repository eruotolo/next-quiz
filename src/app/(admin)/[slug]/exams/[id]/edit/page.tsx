import { ExamEditorClient } from '@/features/exams/components/ExamEditorClient';
import { demoExamFilter } from '@/features/demo/lib/demo';
import { prisma } from '@/shared/lib/prisma';
import { requireInstitutionPageAccess } from '@/shared/lib/auth-guard';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ slug: string; id: string }>;
}

export default async function ExamEditorPage({ params }: PageProps) {
    const { slug, id } = await params;
    const { institutionId, isProfesor, userId, isDemo, demoSessionId } =
        await requireInstitutionPageAccess(slug);

    const [exam, subjects] = await Promise.all([
        prisma.exam.findFirst({
            where: {
                id,
                academicInstitutionId: institutionId,
                ...(isProfesor && {
                    groups: { some: { professors: { some: { id: userId } } } },
                }),
                ...demoExamFilter({ isDemo, demoSessionId }),
            },
            include: {
                groups: true,
                questions: {
                    orderBy: { order: 'asc' },
                    include: { options: { orderBy: { createdAt: 'asc' } } },
                },
            },
        }),
        prisma.exam.groupBy({
            by: ['subject'],
            where: {
                academicInstitutionId: institutionId,
                subject: { not: null },
                ...(isProfesor && {
                    groups: { some: { professors: { some: { id: userId } } } },
                }),
                ...demoExamFilter({ isDemo, demoSessionId }),
            },
            _min: { subject: true },
            orderBy: { _min: { subject: 'asc' } },
        }),
    ]);

    if (!exam) notFound();

    const subjectList = subjects
        .map((s) => s._min.subject)
        .filter((s): s is string => s !== null)
        .sort();

    return <ExamEditorClient exam={exam} subjects={subjectList} />;
}
