'use server';

import { randomBytes } from 'node:crypto';
import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { logAudit } from '@/shared/lib/audit';
import { sendEmail, buildAdminWelcomeEmail } from '@/shared/lib/email';
import { USER_ROLE } from '@/shared/lib/roles';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { adminUserCreateSchema, adminUserUpdateSchema } from '@/features/admin-users/schemas/admin-user.schemas';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

async function requireSuperAdmin(): Promise<{ id: string; email: string; userRoleName: string }> {
    const session = await auth();
    if (session?.user.userRoleName !== USER_ROLE.SUPER_ADMIN) throw new Error('Unauthorized');
    return { id: session.user.id, email: session.user.email ?? '', userRoleName: session.user.userRoleName };
}

export async function createAdminUser(
    data: unknown,
): Promise<{ data: { id: string; emailSent: boolean } | null; error: string | null }> {
    const actor = await requireSuperAdmin().catch(() => null);
    if (!actor) return { data: null, error: 'No autorizado' };

    const parsed = adminUserCreateSchema.safeParse(data);
    if (!parsed.success) return { data: null, error: parsed.error.errors[0]?.message ?? 'Error de validación' };

    const isSuperAdmin = parsed.data.role === USER_ROLE.SUPER_ADMIN;
    if (!isSuperAdmin && !parsed.data.academicInstitutionId) {
        return { data: null, error: 'La institución es requerida para el rol Administrador.' };
    }

    const rawPassword = randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    try {
        const targetRole = await prisma.userRole.findUnique({ where: { name: parsed.data.role } });
        if (!targetRole) return { data: null, error: 'Rol no encontrado.' };

        const user = await prisma.user.create({
            data: {
                name: parsed.data.name,
                lastname: parsed.data.lastname,
                email: parsed.data.email,
                rut: parsed.data.rut,
                password: hashedPassword,
                userRoleId: targetRole.id,
                academicInstitutionId: parsed.data.academicInstitutionId ?? null,
            },
            select: { id: true },
        });

        const { sent, error: emailError } = await sendEmail({
            to: parsed.data.email,
            toName: `${parsed.data.name} ${parsed.data.lastname}`,
            subject: 'Bienvenido/a a Aulika — Tus credenciales',
            htmlContent: buildAdminWelcomeEmail(parsed.data.name, parsed.data.email, rawPassword),
        });

        await logAudit({
            action: AUDIT_ACTION.ADMIN_USER_CREATE,
            actorId: actor.id,
            actorEmail: actor.email,
            actorRole: actor.userRoleName,
            academicInstitutionId: parsed.data.academicInstitutionId ?? null,
            entity: 'User',
            entityId: user.id,
            metadata: { role: parsed.data.role, emailSent: sent, emailError: emailError ?? null },
        });

        revalidatePath('/config/admins');
        return { data: { id: user.id, emailSent: sent }, error: emailError ?? null };
    } catch (err) {
        const msg =
            err instanceof Error && err.message.includes('Unique')
                ? 'El email o RUT ya está en uso.'
                : 'Error al crear el usuario.';
        return { data: null, error: msg };
    }
}

export async function updateAdminUser(
    id: string,
    data: unknown,
): Promise<{ data: null; error: string | null }> {
    const actor = await requireSuperAdmin().catch(() => null);
    if (!actor) return { data: null, error: 'No autorizado' };

    const parsed = adminUserUpdateSchema.safeParse(data);
    if (!parsed.success) return { data: null, error: parsed.error.errors[0]?.message ?? 'Error de validación' };

    const isSuperAdmin = parsed.data.role === USER_ROLE.SUPER_ADMIN;
    if (!isSuperAdmin && !parsed.data.academicInstitutionId) {
        return { data: null, error: 'La institución es requerida para el rol Administrador.' };
    }

    try {
        const targetRole = await prisma.userRole.findUnique({ where: { name: parsed.data.role } });
        if (!targetRole) return { data: null, error: 'Rol no encontrado.' };

        await prisma.user.update({
            where: { id },
            data: {
                name: parsed.data.name,
                lastname: parsed.data.lastname,
                email: parsed.data.email,
                rut: parsed.data.rut,
                userRoleId: targetRole.id,
                academicInstitutionId: parsed.data.academicInstitutionId ?? null,
            },
        });

        await logAudit({
            action: AUDIT_ACTION.ADMIN_USER_UPDATE,
            actorId: actor.id,
            actorEmail: actor.email,
            actorRole: actor.userRoleName,
            entity: 'User',
            entityId: id,
            metadata: { role: parsed.data.role },
        });

        revalidatePath('/config/admins');
        return { data: null, error: null };
    } catch (err) {
        const msg =
            err instanceof Error && err.message.includes('Unique')
                ? 'El email o RUT ya está en uso.'
                : 'Error al actualizar el usuario.';
        return { data: null, error: msg };
    }
}

export async function deleteAdminUser(id: string): Promise<{ data: null; error: string | null }> {
    const actor = await requireSuperAdmin().catch(() => null);
    if (!actor) return { data: null, error: 'No autorizado' };

    try {
        await prisma.user.delete({
            where: {
                id,
                userRole: { name: { in: [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN] } },
            },
        });
        await logAudit({
            action: AUDIT_ACTION.ADMIN_USER_DELETE,
            actorId: actor.id,
            actorEmail: actor.email,
            actorRole: actor.userRoleName,
            entity: 'User',
            entityId: id,
        });
        revalidatePath('/config/admins');
        return { data: null, error: null };
    } catch {
        return { data: null, error: 'Error al eliminar el usuario.' };
    }
}
