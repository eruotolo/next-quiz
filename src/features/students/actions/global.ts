'use server';

import { randomBytes } from 'node:crypto';
import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { logAudit } from '@/shared/lib/audit';
import { USER_ROLE } from '@/shared/lib/roles';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { revalidatePath } from 'next/cache';
import { isValidRut, normalizeRut } from '@/shared/lib/rut';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import type { PaginatedResult, PaginationParams } from '@/shared/types/pagination';

export interface GlobalStudentRow {
    id: string;
    name: string;
    lastname: string;
    rut: string;
    email: string;
    institution: { id: string; name: string } | null;
    group: { id: string; name: string } | null;
}

async function requireSuperAdmin(): Promise<{ id: string; email: string; userRoleName: string }> {
    const session = await auth();
    if (session?.user.userRoleName !== USER_ROLE.SUPER_ADMIN) throw new Error('Unauthorized');
    return { id: session.user.id, email: session.user.email ?? '', userRoleName: session.user.userRoleName };
}

const studentGlobalSchema = z.object({
    name: z.string().min(1, 'Nombre requerido').max(100),
    lastname: z.string().min(1, 'Apellido requerido').max(100),
    rut: z
        .string()
        .min(1, 'RUT requerido')
        .transform((v) => normalizeRut(v))
        .refine((v) => isValidRut(v), 'RUT inválido'),
    email: z.string().email('Email inválido'),
    academicInstitutionId: z.string().uuid('Institución inválida'),
    groupId: z.string().uuid('Grupo inválido').optional(),
});

export async function getStudentsGlobal(
    params: PaginationParams & { institutionId?: string },
): Promise<PaginatedResult<GlobalStudentRow>> {
    const session = await auth();
    if (session?.user.userRoleName !== USER_ROLE.SUPER_ADMIN) throw new Error('Unauthorized');

    // biome-ignore lint/suspicious/noExplicitAny: dynamic where
    const where: Record<string, any> = {
        userRole: { name: USER_ROLE.STUDENT },
    };

    if (params.institutionId) {
        where.academicInstitutionId = params.institutionId;
    }

    if (params.q) {
        where.OR = [
            { name: { contains: params.q, mode: 'insensitive' } },
            { lastname: { contains: params.q, mode: 'insensitive' } },
            { rut: { contains: params.q, mode: 'insensitive' } },
            { email: { contains: params.q, mode: 'insensitive' } },
        ];
    }

    const skip = (params.page - 1) * params.perPage;

    const [items, total] = await prisma.$transaction([
        prisma.user.findMany({
            where,
            orderBy: [{ name: 'asc' }, { lastname: 'asc' }],
            skip,
            take: params.perPage,
            select: {
                id: true,
                name: true,
                lastname: true,
                rut: true,
                email: true,
                academicInstitution: { select: { id: true, name: true } },
                group: { select: { id: true, name: true } },
            },
        }),
        prisma.user.count({ where }),
    ]);

    return {
        items: items.map((u) => ({ ...u, institution: u.academicInstitution })),
        total,
        page: params.page,
        perPage: params.perPage,
    };
}

export async function createStudentGlobal(
    data: unknown,
): Promise<{ data: { id: string } | null; error: string | null }> {
    const actor = await requireSuperAdmin().catch(() => null);
    if (!actor) return { data: null, error: 'No autorizado' };

    const parsed = studentGlobalSchema.safeParse(data);
    if (!parsed.success) return { data: null, error: parsed.error.errors[0]?.message ?? 'Error de validación' };

    const studentRole = await prisma.userRole.findUnique({ where: { name: USER_ROLE.STUDENT } });
    if (!studentRole) return { data: null, error: 'Rol Estudiante no encontrado.' };

    const rawPassword = randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    try {
        const student = await prisma.user.create({
            data: {
                name: parsed.data.name,
                lastname: parsed.data.lastname,
                rut: parsed.data.rut,
                email: parsed.data.email,
                password: hashedPassword,
                userRoleId: studentRole.id,
                academicInstitutionId: parsed.data.academicInstitutionId,
                groupId: parsed.data.groupId ?? null,
            },
            select: { id: true },
        });

        await logAudit({
            action: AUDIT_ACTION.STUDENT_CREATE,
            actorId: actor.id,
            actorEmail: actor.email,
            actorRole: actor.userRoleName,
            academicInstitutionId: parsed.data.academicInstitutionId,
            entity: 'User',
            entityId: student.id,
        });

        revalidatePath('/config/students');
        return { data: { id: student.id }, error: null };
    } catch (err) {
        const msg =
            err instanceof Error && err.message.includes('Unique')
                ? 'El RUT o email ya está en uso.'
                : 'Error al crear el alumno.';
        return { data: null, error: msg };
    }
}

export async function updateStudentGlobal(
    id: string,
    data: unknown,
): Promise<{ data: null; error: string | null }> {
    const actor = await requireSuperAdmin().catch(() => null);
    if (!actor) return { data: null, error: 'No autorizado' };

    const parsed = studentGlobalSchema.safeParse(data);
    if (!parsed.success) return { data: null, error: parsed.error.errors[0]?.message ?? 'Error de validación' };

    try {
        await prisma.user.update({
            where: { id },
            data: {
                name: parsed.data.name,
                lastname: parsed.data.lastname,
                rut: parsed.data.rut,
                email: parsed.data.email,
                academicInstitutionId: parsed.data.academicInstitutionId,
                groupId: parsed.data.groupId ?? null,
            },
        });

        await logAudit({
            action: AUDIT_ACTION.STUDENT_UPDATE,
            actorId: actor.id,
            actorEmail: actor.email,
            actorRole: actor.userRoleName,
            entity: 'User',
            entityId: id,
        });

        revalidatePath('/config/students');
        return { data: null, error: null };
    } catch (err) {
        const msg =
            err instanceof Error && err.message.includes('Unique')
                ? 'El RUT o email ya está en uso.'
                : 'Error al actualizar el alumno.';
        return { data: null, error: msg };
    }
}

export async function deleteStudentGlobal(id: string): Promise<{ data: null; error: string | null }> {
    const actor = await requireSuperAdmin().catch(() => null);
    if (!actor) return { data: null, error: 'No autorizado' };

    try {
        await prisma.user.delete({
            where: { id, userRole: { name: USER_ROLE.STUDENT } },
        });

        await logAudit({
            action: AUDIT_ACTION.STUDENT_DELETE,
            actorId: actor.id,
            actorEmail: actor.email,
            actorRole: actor.userRoleName,
            entity: 'User',
            entityId: id,
        });

        revalidatePath('/config/students');
        return { data: null, error: null };
    } catch {
        return { data: null, error: 'Error al eliminar el alumno.' };
    }
}
