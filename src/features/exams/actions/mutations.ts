'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { examSchema, questionSchema } from '@/features/exams/schemas/exam.schemas';
import { revalidatePath } from 'next/cache';

async function getSlug(): Promise<string> {
    const session = await auth();
    const slug = session?.user.institutionSlug;
    if (!slug) throw new Error('Unauthorized');
    return slug;
}

export async function createExam(data: unknown): Promise<{ id: string }> {
    const slug = await getSlug();
    const { groupIds, ...rest } = examSchema.parse(data);
    const exam = await prisma.exam.create({
        data: { ...rest, groups: { connect: groupIds.map((id) => ({ id })) } },
    });
    revalidatePath(`/${slug}/exams`);
    return { id: exam.id };
}

export async function updateExam(id: string, data: unknown): Promise<void> {
    const slug = await getSlug();
    const { groupIds, ...rest } = examSchema.parse(data);
    await prisma.exam.update({
        where: { id },
        data: { ...rest, groups: { set: groupIds.map((id) => ({ id })) } },
    });
    revalidatePath(`/${slug}/exams`);
    revalidatePath(`/${slug}/exams/${id}/edit`);
}

export async function deleteExam(id: string): Promise<void> {
    const slug = await getSlug();
    await prisma.exam.delete({ where: { id } });
    revalidatePath(`/${slug}/exams`);
}

export async function toggleExamActive(id: string, active: boolean): Promise<void> {
    const slug = await getSlug();
    await prisma.exam.update({ where: { id }, data: { active } });
    revalidatePath(`/${slug}/exams`);
}

export async function upsertQuestion(examId: string, data: unknown, order: number): Promise<void> {
    const slug = await getSlug();
    const parsed = questionSchema.parse(data);

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
    } else {
        await prisma.question.create({
            data: {
                examId,
                text: parsed.text,
                points: parsed.points,
                order,
                options: {
                    create: parsed.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
                },
            },
        });
    }

    revalidatePath(`/${slug}/exams/${examId}/edit`);
}

export async function deleteQuestion(id: string, examId: string): Promise<void> {
    const slug = await getSlug();
    await prisma.question.delete({ where: { id } });
    revalidatePath(`/${slug}/exams/${examId}/edit`);
}
