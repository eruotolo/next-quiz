import { ExamsClient } from '@/features/exams/components/ExamsClient';
import { demoExamFilter } from '@/features/demo/lib/demo';
import { prisma } from '@/shared/lib/prisma';
import { requireInstitutionPageAccess } from '@/shared/lib/auth-guard';
import { examProfessorFilter, groupProfessorFilter } from '@/shared/lib/scoping';

export default async function ExamsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { institutionId, isProfesor, userId, isDemo, demoSessionId } =
        await requireInstitutionPageAccess(slug);

    // Scope: exámenes y grupos de la institución; el Profesor solo los de sus grupos.
    // En modo demo, además, cada visitante solo ve los exámenes de su sesión.
    const [exams, groups] = await Promise.all([
        prisma.exam.findMany({
            where: {
                academicInstitutionId: institutionId,
                ...(isProfesor && examProfessorFilter(userId)),
                ...demoExamFilter({ isDemo, demoSessionId }),
            },
            include: {
                groups: true,
                _count: { select: { questions: true, results: true } },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.group.findMany({
            where: {
                academicInstitutionId: institutionId,
                ...(isProfesor && groupProfessorFilter(userId)),
            },
            orderBy: { name: 'asc' },
        }),
    ]);

    return <ExamsClient exams={exams} groups={groups} />;
}
