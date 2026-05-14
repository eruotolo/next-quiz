'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { examSchema, questionSchema } from '@/features/exams/schemas/exam.schemas';
import { revalidatePath } from 'next/cache';

async function getSessionUser() {
    const session = await auth();
    const slug = session?.user.institutionSlug;
    if (!slug) throw new Error('Unauthorized');
    return {
        slug,
        userId: session!.user.id,
        userEmail: session!.user.email,
        userRole: session!.user.userRoleName,
        institutionId: session!.user.academicInstitutionId,
    };
}

export async function createExam(data: unknown): Promise<{ id: string }> {
    const { slug, userId, userEmail, userRole, institutionId } = await getSessionUser();
    const { groupIds, ...rest } = examSchema.parse(data);
    const exam = await prisma.exam.create({
        data: { ...rest, groups: { connect: groupIds.map((id) => ({ id })) } },
    });
    await logAudit({
        action: AUDIT_ACTION.EXAM_CREATE,
        actorId: userId,
        actorEmail: userEmail,
        actorRole: userRole,
        academicInstitutionId: institutionId,
        entity: 'Exam',
        entityId: exam.id,
    });
    revalidatePath(`/${slug}/exams`);
    return { id: exam.id };
}

export async function updateExam(id: string, data: unknown): Promise<void> {
    const { slug, userId, userEmail, userRole, institutionId } = await getSessionUser();
    const { groupIds, ...rest } = examSchema.parse(data);
    await prisma.exam.update({
        where: { id },
        data: { ...rest, groups: { set: groupIds.map((id) => ({ id })) } },
    });
    await logAudit({
        action: AUDIT_ACTION.EXAM_UPDATE,
        actorId: userId,
        actorEmail: userEmail,
        actorRole: userRole,
        academicInstitutionId: institutionId,
        entity: 'Exam',
        entityId: id,
    });
    revalidatePath(`/${slug}/exams`);
    revalidatePath(`/${slug}/exams/${id}/edit`);
}

export async function deleteExam(id: string): Promise<void> {
    const { slug, userId, userEmail, userRole, institutionId } = await getSessionUser();
    await prisma.exam.delete({ where: { id } });
    await logAudit({
        action: AUDIT_ACTION.EXAM_DELETE,
        actorId: userId,
        actorEmail: userEmail,
        actorRole: userRole,
        academicInstitutionId: institutionId,
        entity: 'Exam',
        entityId: id,
    });
    revalidatePath(`/${slug}/exams`);
}

export async function toggleExamActive(id: string, active: boolean): Promise<void> {
    const { slug, userId, userEmail, userRole, institutionId } = await getSessionUser();
    await prisma.exam.update({ where: { id }, data: { active } });
    await logAudit({
        action: AUDIT_ACTION.EXAM_TOGGLE_ACTIVE,
        actorId: userId,
        actorEmail: userEmail,
        actorRole: userRole,
        academicInstitutionId: institutionId,
        entity: 'Exam',
        entityId: id,
        metadata: { active },
    });
    revalidatePath(`/${slug}/exams`);
}

export async function upsertQuestion(examId: string, data: unknown, order: number): Promise<void> {
    const { slug, userId, userEmail, userRole, institutionId } = await getSessionUser();
    const parsed = questionSchema.parse(data);

    let questionId: string;

    if (parsed.id) {
        await prisma.question.update({
            where: { id: parsed.id },
            data: {
                text: parsed.text,
                points: parsed.points,
                order,
                options: {
                    deleteMany: {},
                    create: parsed.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
                },
            },
        });
        questionId = parsed.id;
    } else {
        const question = await prisma.question.create({
            data: {
                examId,
                text: parsed.text,
                points: parsed.points,
                order,
                options: {
                    create: parsed.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
                },
            },
            select: { id: true },
        });
        questionId = question.id;
    }

    await logAudit({
        action: AUDIT_ACTION.QUESTION_UPSERT,
        actorId: userId,
        actorEmail: userEmail,
        actorRole: userRole,
        academicInstitutionId: institutionId,
        entity: 'Question',
        entityId: questionId,
        metadata: { examId },
    });
    revalidatePath(`/${slug}/exams/${examId}/edit`);
}

export async function deleteQuestion(id: string, examId: string): Promise<void> {
    const { slug, userId, userEmail, userRole, institutionId } = await getSessionUser();
    await prisma.question.delete({ where: { id } });
    await logAudit({
        action: AUDIT_ACTION.QUESTION_DELETE,
        actorId: userId,
        actorEmail: userEmail,
        actorRole: userRole,
        academicInstitutionId: institutionId,
        entity: 'Question',
        entityId: id,
        metadata: { examId },
    });
    revalidatePath(`/${slug}/exams/${examId}/edit`);
}
