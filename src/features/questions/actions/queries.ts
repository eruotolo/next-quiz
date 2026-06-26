'use server';

import { prisma } from '@/shared/lib/prisma';
import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import type { BankQuestionFilter } from '@/features/questions/schemas/bank-question.schemas';
import type {
    SafeBankQuestion,
    BankQuestionFilters,
} from '@/features/questions/types/bank-question.types';

async function getSessionUser(requestSlug: string) {
    const ctx = await requireInstitutionAccess(requestSlug);
    return {
        userId: ctx.userId,
        userRole: ctx.userRole,
        institutionId: ctx.institutionId,
    };
}

function toSafe(q: {
    id: string;
    text: string;
    questionType: 'UNICA' | 'MULTIPLE';
    subject: string | null;
    unit: string | null;
    difficulty: 'FACIL' | 'MEDIA' | 'DIFICIL';
    tags: string[];
    feedback: string | null;
    options: { id: string; text: string; isCorrect: boolean }[];
    createdAt: Date;
    updatedAt: Date;
}): SafeBankQuestion {
    return {
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
    };
}

export async function getBankQuestions(
    slug: string,
    filters: BankQuestionFilter = {},
): Promise<{ items: SafeBankQuestion[]; facets: BankQuestionFilters }> {
    const { institutionId } = await getSessionUser(slug);

    const where = {
        academicInstitutionId: institutionId,
        ...(filters.search && {
            OR: [
                { text: { contains: filters.search, mode: 'insensitive' as const } },
                { subject: { contains: filters.search, mode: 'insensitive' as const } },
                { unit: { contains: filters.search, mode: 'insensitive' as const } },
            ],
        }),
        ...(filters.subject && { subject: filters.subject }),
        ...(filters.unit && { unit: filters.unit }),
        ...(filters.difficulty && { difficulty: filters.difficulty }),
        ...(filters.tag && { tags: { has: filters.tag } }),
    };

    const [rows, subjects, units, tagsRows] = await Promise.all([
        prisma.bankQuestion.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            include: { options: { orderBy: { createdAt: 'asc' } } },
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

    return {
        items: rows.map(toSafe),
        facets: {
            subjects: subjects.map((s) => s.subject ?? '').filter(Boolean),
            units: units.map((u) => u.unit ?? '').filter(Boolean),
            tags: [...tagSet].sort(),
        },
    };
}

// Lista reducida para el diálogo "Desde banco" en el editor de exámenes.
// Reusa el filtro de exámenes del profesor para no exponer bancos ajenos.
export async function getBankQuestionsForPicker(
    slug: string,
    search: string,
): Promise<{ id: string; text: string; subject: string | null; difficulty: string }[]> {
    const { institutionId } = await getSessionUser(slug);
    const trimmed = search.trim();
    const where = {
        academicInstitutionId: institutionId,
        ...(trimmed.length >= 2 && {
            OR: [
                { text: { contains: trimmed, mode: 'insensitive' as const } },
                { subject: { contains: trimmed, mode: 'insensitive' as const } },
            ],
        }),
    };
    const rows = await prisma.bankQuestion.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: { id: true, text: true, subject: true, difficulty: true },
    });
    return rows;
}
