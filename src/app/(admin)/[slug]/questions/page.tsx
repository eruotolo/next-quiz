import { QuestionsClient } from '@/features/questions/components/QuestionsClient';
import { prisma } from '@/shared/lib/prisma';
import { requireInstitutionPageAccess } from '@/shared/lib/auth-guard';
import type { SafeBankQuestion, BankQuestionFilters } from '@/features/questions/types/bank-question.types';

export default async function QuestionsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<React.JSX.Element> {
    const { slug } = await params;
    const { institutionId, institutionName } = await requireInstitutionPageAccess(slug);

    // Banco por institución (transversal: Admin y Profesor comparten la biblioteca).
    const [rows, subjects, units, tagsRows] = await Promise.all([
        prisma.bankQuestion.findMany({
            where: { academicInstitutionId: institutionId },
            include: { options: { orderBy: { createdAt: 'asc' } } },
            orderBy: { updatedAt: 'desc' },
        }),
        prisma.bankQuestion.findMany({
            where: { academicInstitutionId: institutionId, subject: { not: null } },
            distinct: ['subject'],
            select: { subject: true },
        }),
        prisma.bankQuestion.findMany({
            where: { academicInstitutionId: institutionId, unit: { not: null } },
            distinct: ['unit'],
            select: { unit: true },
        }),
        prisma.bankQuestion.findMany({
            where: { academicInstitutionId: institutionId },
            select: { tags: true },
        }),
    ]);

    const tagSet = new Set<string>();
    for (const t of tagsRows) for (const tag of t.tags) tagSet.add(tag);

    const items: SafeBankQuestion[] = rows.map((q) => ({
        id: q.id,
        text: q.text,
        questionType: q.questionType,
        subject: q.subject,
        unit: q.unit,
        difficulty: q.difficulty,
        tags: q.tags,
        feedback: q.feedback,
        options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
    }));

    const facets: BankQuestionFilters = {
        subjects: subjects.map((s) => s.subject ?? '').filter(Boolean),
        units: units.map((u) => u.unit ?? '').filter(Boolean),
        tags: [...tagSet].sort(),
    };

    return <QuestionsClient slug={slug} initialItems={items} facets={facets} institutionName={institutionName} />;
}
