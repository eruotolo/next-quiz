'use server';

import { prisma } from '@/lib/prisma';
import { studentSchema } from '@/schemas/student';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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

export interface ImportStudentsResult {
    created: number;
    skipped: number;
    errors: Array<{ row: number; message: string }>;
}

export async function importStudents(
    rows: Array<{ name: string; lastname: string; email: string; rut: string; groupId: string }>,
): Promise<ImportStudentsResult> {
    type ValidRow = { name: string; lastname: string; email: string; rut: string; groupId: string; role: Role };

    const valid: ValidRow[] = [];
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        try {
            const parsed = studentSchema.parse(row);
            valid.push({ ...parsed, role: Role.STUDENT });
        } catch (err) {
            const msg =
                err instanceof z.ZodError
                    ? (err.errors[0]?.message ?? 'Datos inválidos')
                    : 'Error de validación';
            errors.push({ row: rowNum, message: msg });
        }
    }

    if (valid.length === 0) {
        return { created: 0, skipped: 0, errors };
    }

    const result = await prisma.user.createMany({ data: valid, skipDuplicates: true });

    revalidatePath('/admin/students');
    return { created: result.count, skipped: valid.length - result.count, errors };
}
