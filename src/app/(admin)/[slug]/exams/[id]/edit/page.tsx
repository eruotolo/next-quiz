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

    // Scope de institución (cierra IDOR) + scope de profesor por sus grupos.
    // En modo demo, el examen debe pertenecer a la sesión del visitante.
    const exam = await prisma.exam.findFirst({
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
    });

    if (!exam) notFound();

    return <ExamEditorClient exam={exam} />;
}
