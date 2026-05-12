'use server';

import { prisma } from '@/lib/prisma';
import { studentSchema } from '@/schemas/student';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function createStudent(data: unknown): Promise<void> {
    const parsed = studentSchema.parse(data);
    await prisma.user.create({ data: { ...parsed, role: Role.STUDENT } });
    revalidatePath('/admin/students');
}

export async function updateStudent(id: string, data: unknown): Promise<void> {
    const parsed = studentSchema.parse(data);
    await prisma.user.update({ where: { id }, data: parsed });
    revalidatePath('/admin/students');
}

export async function deleteStudent(id: string): Promise<void> {
    await prisma.user.delete({ where: { id, role: Role.STUDENT } });
    revalidatePath('/admin/students');
}
