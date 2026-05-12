'use server';

import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { isValidRut, normalizeRut } from '@/lib/rut';
import { createStudentSession } from '@/lib/student-session';
import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const schema = z.object({
    rut: z
        .string()
        .min(1, 'RUT requerido')
        .transform((v) => normalizeRut(v))
        .refine((v) => isValidRut(v), 'RUT inválido'),
});

interface ActionState {
    error?: string;
    resultId?: string;
}

export async function validateStudent(
    _prevState: ActionState,
    formData: FormData,
): Promise<ActionState> {
    const result = schema.safeParse({ rut: formData.get('rut') });
    if (!result.success) {
        return { error: result.error.errors[0]?.message ?? 'RUT inválido' };
    }

    const { rut } = result.data;

    const student = await prisma.user.findFirst({
        where: { rut, role: Role.STUDENT },
        select: { id: true, groupId: true },
    });

    if (!student) {
        return { error: 'RUT no encontrado. Verificá con tu profesor.' };
    }

    if (!student.groupId) {
        return { error: 'No estás asignado a ningún grupo. Verificá con tu profesor.' };
    }

    const exam = await prisma.exam.findFirst({
        where: { active: true, groups: { some: { id: student.groupId } } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, timeLimit: true },
    });

    if (!exam) {
        return { error: 'Tu grupo no tiene un examen activo en este momento.' };
    }

    const existing = await prisma.result.findUnique({
        where: { studentId_examId: { studentId: student.id, examId: exam.id } },
    });
    if (existing) {
        return { error: 'Ya completaste este examen.', resultId: existing.id };
    }

    const endsAt = Date.now() + exam.timeLimit * 60 * 1000;
    const attemptKey = randomUUID();

    await createStudentSession({ studentId: student.id, examId: exam.id, endsAt, attemptKey });

    redirect(`/examen/${exam.id}`);
}
