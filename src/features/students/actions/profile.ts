'use server';

import { prisma } from '@/shared/lib/prisma';
import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';
import {
    studentProfileUpdateSchema,
    type StudentProfileUpdateInput,
} from '@/features/students/schemas/profile.schemas';

export async function updateStudentProfile(
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const session = await getStudentAuthSession();
        if (!session) return fail('No autenticado');

        const parsed = studentProfileUpdateSchema.safeParse(data);
        if (!parsed.success) {
            return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');
        }
        const input: StudentProfileUpdateInput = parsed.data;

        const existing = await prisma.user.findUnique({
            where: { id: session.studentId },
            select: { email: true },
        });
        if (!existing) return fail('Estudiante no encontrado');

        if (input.email.toLowerCase() !== existing.email.toLowerCase()) {
            const conflict = await prisma.user.findFirst({
                where: {
                    email: { equals: input.email, mode: 'insensitive' },
                    id: { not: session.studentId },
                },
                select: { id: true },
            });
            if (conflict) return fail('Ya existe otra cuenta con ese email');
        }

        const phone = input.phone?.trim() ? input.phone.trim() : null;

        await prisma.user.update({
            where: { id: session.studentId },
            data: {
                name: input.name.trim(),
                lastname: input.lastname.trim(),
                email: input.email.trim(),
                phone,
            },
        });

        return ok({ id: session.studentId });
    } catch (err) {
        return fail(toActionError(err, 'Error al guardar el perfil'));
    }
}
