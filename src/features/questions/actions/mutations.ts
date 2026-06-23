'use server';

import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { bankQuestionSchema } from '@/features/questions/schemas/bank-question.schemas';
import { logAudit } from '@/shared/lib/audit';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { revalidatePath } from 'next/cache';

async function getSessionUser(requestSlug: string) {
    const ctx = await requireInstitutionAccess(requestSlug);
    return {
        userId: ctx.userId,
        userEmail: ctx.userEmail,
        userRole: ctx.userRole,
        institutionId: ctx.institutionId,
    };
}

async function assertProfessorExamAccess(examId: string, professorId: string): Promise<void> {
    const exam = await prisma.exam.findFirst({
        where: { id: examId, groups: { some: { professors: { some: { id: professorId } } } } },
        select: { id: true },
    });
    if (!exam) throw new Error('Forbidden');
}

async function assertBankQuestionInInstitution(
    bankQuestionId: string,
    institutionId: string,
): Promise<void> {
    const q = await prisma.bankQuestion.findFirst({
        where: { id: bankQuestionId, academicInstitutionId: institutionId },
        select: { id: true },
    });
    if (!q) throw new Error('Forbidden');
}

async function assertExamInInstitution(examId: string, institutionId: string): Promise<void> {
    const exam = await prisma.exam.findFirst({
        where: { id: examId, academicInstitutionId: institutionId },
        select: { id: true },
    });
    if (!exam) throw new Error('Forbidden');
}

export async function createBankQuestion(slug: string, data: unknown): Promise<{ id: string }> {
    const { userId, userEmail, userRole, institutionId } = await getSessionUser(slug);
    const parsed = bankQuestionSchema.parse(data);

    const created = await prisma.bankQuestion.create({
        data: {
            text: parsed.text,
            questionType: parsed.questionType,
            subject: parsed.subject ?? null,
            unit: parsed.unit ?? null,
            difficulty: parsed.difficulty,
            tags: parsed.tags,
            feedback: parsed.feedback ?? null,
            academicInstitutionId: institutionId,
            createdById: userId,
            options: {
                create: parsed.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
            },
        },
        select: { id: true },
    });

    await logAudit({
        action: AUDIT_ACTION.QUESTION_BANK_CREATE,
        actorId: userId,
        actorEmail: userEmail,
        actorRole: userRole,
        academicInstitutionId: institutionId,
        entity: 'BankQuestion',
        entityId: created.id,
    });

    revalidatePath(`/${slug}/questions`);
    return { id: created.id };
}

export async function updateBankQuestion(
    slug: string,
    id: string,
    data: unknown,
): Promise<void> {
    const { userId, userEmail, userRole, institutionId } = await getSessionUser(slug);
    await assertBankQuestionInInstitution(id, institutionId);
    const parsed = bankQuestionSchema.parse(data);

    await prisma.bankQuestion.update({
        where: { id },
        data: {
            text: parsed.text,
            questionType: parsed.questionType,
            subject: parsed.subject ?? null,
            unit: parsed.unit ?? null,
            difficulty: parsed.difficulty,
            tags: parsed.tags,
            feedback: parsed.feedback ?? null,
            options: {
                deleteMany: {},
                create: parsed.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
            },
        },
    });

    await logAudit({
        action: AUDIT_ACTION.QUESTION_BANK_UPDATE,
        actorId: userId,
        actorEmail: userEmail,
        actorRole: userRole,
        academicInstitutionId: institutionId,
        entity: 'BankQuestion',
        entityId: id,
    });

    revalidatePath(`/${slug}/questions`);
}

export async function deleteBankQuestion(slug: string, id: string): Promise<void> {
    const { userId, userEmail, userRole, institutionId } = await getSessionUser(slug);
    await assertBankQuestionInInstitution(id, institutionId);

    await prisma.bankQuestion.delete({ where: { id } });

    await logAudit({
        action: AUDIT_ACTION.QUESTION_BANK_DELETE,
        actorId: userId,
        actorEmail: userEmail,
        actorRole: userRole,
        academicInstitutionId: institutionId,
        entity: 'BankQuestion',
        entityId: id,
    });

    revalidatePath(`/${slug}/questions`);
}

export async function cloneBankQuestion(slug: string, id: string): Promise<{ id: string }> {
    const { userId, userEmail, userRole, institutionId } = await getSessionUser(slug);
    await assertBankQuestionInInstitution(id, institutionId);

    const source = await prisma.bankQuestion.findUniqueOrThrow({
        where: { id },
        include: { options: { orderBy: { createdAt: 'asc' } } },
    });

    const created = await prisma.bankQuestion.create({
        data: {
            text: `Copia de ${source.text}`,
            questionType: source.questionType,
            subject: source.subject,
            unit: source.unit,
            difficulty: source.difficulty,
            tags: source.tags,
            feedback: source.feedback,
            academicInstitutionId: institutionId,
            createdById: userId,
            options: {
                create: source.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
            },
        },
        select: { id: true },
    });

    await logAudit({
        action: AUDIT_ACTION.QUESTION_BANK_CREATE,
        actorId: userId,
        actorEmail: userEmail,
        actorRole: userRole,
        academicInstitutionId: institutionId,
        entity: 'BankQuestion',
        entityId: created.id,
    });

    revalidatePath(`/${slug}/questions`);
    return { id: created.id };
}

// Clona una pregunta del banco al examen: crea Question + Options del examen
// con order = max(order)+1. Verifica scope de la pregunta (institución) y del
// examen (institución para todos los roles; profesor además → sus grupos).
// No muta el banco.
export async function copyBankQuestionToExam(
    slug: string,
    bankQuestionId: string,
    examId: string,
): Promise<{ questionId: string }> {
    const { userId, userEmail, userRole, institutionId } = await getSessionUser(slug);
    await assertExamInInstitution(examId, institutionId);
    if (userRole === USER_ROLE.PROFESOR) await assertProfessorExamAccess(examId, userId);

    const bank = await prisma.bankQuestion.findFirst({
        where: { id: bankQuestionId, academicInstitutionId: institutionId },
        include: { options: { orderBy: { createdAt: 'asc' } } },
    });
    if (!bank) throw new Error('Forbidden');

    const maxOrder = await prisma.question.aggregate({
        where: { examId },
        _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const question = await prisma.question.create({
        data: {
            examId,
            text: bank.text,
            points: 1,
            order: nextOrder,
            questionType: bank.questionType,
            subject: bank.subject,
            unit: bank.unit,
            difficulty: bank.difficulty,
            tags: bank.tags,
            feedback: bank.feedback,
            options: {
                create: bank.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
            },
        },
        select: { id: true },
    });

    await logAudit({
        action: AUDIT_ACTION.QUESTION_BANK_COPY,
        actorId: userId,
        actorEmail: userEmail,
        actorRole: userRole,
        academicInstitutionId: institutionId,
        entity: 'Question',
        entityId: question.id,
    });

    revalidatePath(`/${slug}/exams/${examId}/edit`);
    return { questionId: question.id };
}
