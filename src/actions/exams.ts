'use server';

import { prisma } from '@/lib/prisma';
import { examSchema, questionSchema } from '@/schemas/exam';
import { revalidatePath } from 'next/cache';

export async function createExam(data: unknown): Promise<{ id: string }> {
    const { groupIds, ...rest } = examSchema.parse(data);
    const exam = await prisma.exam.create({
        data: { ...rest, groups: { connect: groupIds.map((id) => ({ id })) } },
    });
    revalidatePath('/admin/exams');
    return { id: exam.id };
}

export async function updateExam(id: string, data: unknown): Promise<void> {
    const { groupIds, ...rest } = examSchema.parse(data);
    await prisma.exam.update({
        where: { id },
        data: { ...rest, groups: { set: groupIds.map((id) => ({ id })) } },
    });
    revalidatePath('/admin/exams');
    revalidatePath(`/admin/exams/${id}/edit`);
}

export async function deleteExam(id: string): Promise<void> {
    await prisma.exam.delete({ where: { id } });
    revalidatePath('/admin/exams');
}

export async function toggleExamActive(id: string, active: boolean): Promise<void> {
    await prisma.exam.update({ where: { id }, data: { active } });
    revalidatePath('/admin/exams');
}

export async function upsertQuestion(examId: string, data: unknown, order: number): Promise<void> {
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

    revalidatePath(`/admin/exams/${examId}/edit`);
}

export async function deleteQuestion(id: string, examId: string): Promise<void> {
    await prisma.question.delete({ where: { id } });
    revalidatePath(`/admin/exams/${examId}/edit`);
}
