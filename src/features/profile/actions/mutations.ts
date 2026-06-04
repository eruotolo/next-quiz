'use server';

import { auth } from '@/features/auth/auth';
import { profileUpdateSchema } from '@/features/profile/schemas/profile.schemas';
import { prisma } from '@/shared/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function updateMyProfile(data: unknown): Promise<{ error: string | null }> {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    const parsed = profileUpdateSchema.safeParse(data);
    if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Error de validación' };

    const passwordUpdate = parsed.data.password
        ? { password: await bcrypt.hash(parsed.data.password, 10) }
        : {};

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: parsed.data.name,
                lastname: parsed.data.lastname,
                email: parsed.data.email,
                rut: parsed.data.rut,
                ...passwordUpdate,
            },
        });
        revalidatePath('/perfil');
        return { error: null };
    } catch (err) {
        const msg =
            err instanceof Error && err.message.includes('Unique')
                ? 'El email o RUT ya está en uso.'
                : 'Error al actualizar el perfil.';
        return { error: msg };
    }
}
