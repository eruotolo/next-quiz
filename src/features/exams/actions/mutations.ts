'use server';

import { auth } from '@/features/auth/auth';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import {
    examSchema,
    importQuestionsSchema,
    questionSchema,
} from '@/features/exams/schemas/exam.schemas';
import { logAudit } from '@/shared/lib/audit';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { assertQuota } from '@/features/subscriptions/lib/quota';
import { revalidatePath } from 'next/cache';

async function getSessionUser(requestSlug: string) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    const isSuperAdmin = session.user.userRoleName === USER_ROLE.SUPER_ADMIN;

    if (!isSuperAdmin) {
        const sessionSlug = session.user.institutionSlug;
        if (!sessionSlug || sessionSlug !== requestSlug) throw new Error('Unauthorized');
    }

    return {
        slug: requestSlug,
        userId: session.user.id,
        userEmail: session.user.email,
        userRole: session.user.userRoleName,
        institutionId: session.user.academicInstitutionId,
    };
}

async function getProfessorGroupIds(professorId: string): Promise<string[]> {
    const professor = await prisma.user.findUnique({
        where: { id: professorId },
        select: { professorGroups: { select: { id: true } } },
    });
    return professor?.professorGroups.map((g) => g.id) ?? [];
}

async function assertProfessorExamAccess(examId: string, professorId: string): Promise<void> {
    const exam = await prisma.exam.findFirst({
        where: { id: examId, groups: { some: { professors: { some: { id: professorId } } } } },
        select: { id: true },
    });
    if (!exam) throw new Error('Forbidden');
}

export async function createExam(slug: string, data: unknown): Promise<{ id: string }> {
    const { userId, userEmail, userRole, institutionId } = await getSessionUser(slug);
    const { groupIds, ...rest } = examSchema.parse(data);

    if (userRole === USER_ROLE.PROFESOR) {
        const professorGroupIds = await getProfessorGroupIds(userId);
        const invalid = groupIds.filter((id) => !professorGroupIds.includes(id));
        if (invalid.length > 0) throw new Error('Forbidden');
    }

    await assertQuota(institutionId, 'exam', userRole);

    const exam = await prisma.exam.create({
        data: {
            ...rest,
            groups: { connect: groupIds.map((id) => ({ id })) },
            academicInstitutionId: institutionId ?? undefined,
            createdById: userId,
        },
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

export async function updateExam(slug: string, id: string, data: unknown): Promise<void> {
    const { userId, userEmail, userRole, institutionId } = await getSessionUser(slug);
    const { groupIds, ...rest } = examSchema.parse(data);

    let finalGroupIds: string[];

    if (userRole === USER_ROLE.PROFESOR) {
        await assertProfessorExamAccess(id, userId);
        const professorGroupIds = await getProfessorGroupIds(userId);
        const invalid = groupIds.filter((gid) => !professorGroupIds.includes(gid));
        if (invalid.length > 0) throw new Error('Forbidden');
        const currentExam = await prisma.exam.findUnique({
            where: { id },
            select: { groups: { select: { id: true } } },
        });
        const preservedIds = (currentExam?.groups ?? [])
            .filter((g) => !professorGroupIds.includes(g.id))
            .map((g) => g.id);
        finalGroupIds = [...preservedIds, ...groupIds];
    } else {
        finalGroupIds = groupIds;
    }

    await prisma.exam.update({
        where: { id },
        data: { ...rest, groups: { set: finalGroupIds.map((gid) => ({ id: gid })) } },
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

export async function deleteExam(slug: string, id: string): Promise<void> {
    const { userId, userEmail, userRole, institutionId } = await getSessionUser(slug);
    if (userRole === USER_ROLE.PROFESOR) await assertProfessorExamAccess(id, userId);
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

export async function toggleExamActive(slug: string, id: string, active: boolean): Promise<void> {
    const { userId, userEmail, userRole, institutionId } = await getSessionUser(slug);
    if (userRole === USER_ROLE.PROFESOR) await assertProfessorExamAccess(id, userId);
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

export async function upsertQuestion(
    slug: string,
    examId: string,
    data: unknown,
    order: number,
): Promise<void> {
    const { userId, userEmail, userRole, institutionId } = await getSessionUser(slug);
    if (userRole === USER_ROLE.PROFESOR) await assertProfessorExamAccess(examId, userId);
    const parsed = questionSchema.parse(data);

    let questionId: string;

    if (parsed.id) {
        await prisma.question.update({
            where: { id: parsed.id },
            data: {
                text: parsed.text,
                points: parsed.points,
                order,
                questionType: parsed.questionType,
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
                questionType: parsed.questionType,
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

export async function deleteQuestion(slug: string, id: string, examId: string): Promise<void> {
    const { userId, userEmail, userRole, institutionId } = await getSessionUser(slug);
    if (userRole === USER_ROLE.PROFESOR) await assertProfessorExamAccess(examId, userId);
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

export async function importQuestions(
    slug: string,
    examId: string,
    questions: unknown,
): Promise<{ count: number }> {
    const { userId, userEmail, userRole, institutionId } = await getSessionUser(slug);
    if (userRole === USER_ROLE.PROFESOR) await assertProfessorExamAccess(examId, userId);
    const parsed = importQuestionsSchema.parse(questions);

    const maxOrderResult = await prisma.question.aggregate({
        where: { examId },
        _max: { order: true },
    });
    const baseOrder = (maxOrderResult._max.order ?? -1) + 1;

    await prisma.$transaction(
        parsed.map((q, i) =>
            prisma.question.create({
                data: {
                    examId,
                    text: q.text,
                    points: q.points,
                    order: baseOrder + i,
                    questionType: q.questionType,
                    options: {
                        create: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
                    },
                },
            }),
        ),
    );

    await logAudit({
        action: AUDIT_ACTION.QUESTIONS_IMPORT,
        actorId: userId,
        actorEmail: userEmail,
        actorRole: userRole,
        academicInstitutionId: institutionId,
        entity: 'Exam',
        entityId: examId,
        metadata: { count: parsed.length },
    });
    revalidatePath(`/${slug}/exams/${examId}/edit`);
    revalidatePath(`/${slug}/exams`);

    return { count: parsed.length };
}
