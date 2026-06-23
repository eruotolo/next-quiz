'use server';

import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import {
    createProfessorSchema,
    updateProfessorSchema,
} from '@/features/professors/schemas/professor.schemas';
import { logAudit } from '@/shared/lib/audit';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { assertQuota } from '@/features/subscriptions/lib/quota';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

const ADMIN_ONLY = [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN] as const;

// El módulo "Cuerpo Docente" gestiona ambos roles (lista Profesores y Administradores).
const MANAGED_ROLES = [USER_ROLE.PROFESOR, USER_ROLE.ADMIN] as const;

/** Valida que los grupos indicados pertenezcan a la institución (evita cross-tenant). */
async function groupsBelongToInstitution(
    groupIds: string[],
    institutionId: string,
): Promise<boolean> {
    if (groupIds.length === 0) return true;
    const count = await prisma.group.count({
        where: { id: { in: groupIds }, academicInstitutionId: institutionId },
    });
    return count === groupIds.length;
}

export async function createProfessor(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_ONLY]);

        const parsed = createProfessorSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

        const { groupIds, roleName, password, ...rest } = parsed.data;
        if (!(await groupsBelongToInstitution(groupIds, ctx.institutionId))) {
            return fail('Uno o más grupos no pertenecen a esta institución.');
        }

        await assertQuota(ctx.institutionId, 'professor', ctx.userRole);

        const hashedPassword = await bcrypt.hash(password, 10);
        const professor = await prisma.user.create({
            data: {
                ...rest,
                password: hashedPassword,
                userRole: { connect: { name: roleName } },
                academicInstitution: { connect: { id: ctx.institutionId } },
                professorGroups: { connect: groupIds.map((id) => ({ id })) },
            },
            select: { id: true },
        });

        await logAudit({
            action: AUDIT_ACTION.PROFESSOR_CREATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'User',
            entityId: professor.id,
        });
        revalidatePath(`/${slug}/professors`);
        return ok({ id: professor.id });
    } catch (err) {
        return fail(toActionError(err, 'Error al crear el profesor.'));
    }
}

export async function updateProfessor(
    slug: string,
    id: string,
    data: unknown,
): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_ONLY]);

        const parsed = updateProfessorSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

        // Scope: el usuario debe pertenecer a la institución y a un rol que
        // gestiona este módulo (Profesor o Administrador).
        const target = await prisma.user.findFirst({
            where: {
                id,
                academicInstitutionId: ctx.institutionId,
                userRole: { name: { in: [...MANAGED_ROLES] } },
            },
            select: { id: true },
        });
        if (!target) return fail('Usuario no encontrado.');

        const { groupIds, roleName, password, ...rest } = parsed.data;
        if (!(await groupsBelongToInstitution(groupIds, ctx.institutionId))) {
            return fail('Uno o más grupos no pertenecen a esta institución.');
        }

        const passwordData =
            password && password.length > 0 ? { password: await bcrypt.hash(password, 10) } : {};

        await prisma.user.update({
            where: { id },
            data: {
                ...rest,
                ...passwordData,
                userRole: { connect: { name: roleName } },
                professorGroups: { set: groupIds.map((gid) => ({ id: gid })) },
            },
        });

        await logAudit({
            action: AUDIT_ACTION.PROFESSOR_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'User',
            entityId: id,
        });
        revalidatePath(`/${slug}/professors`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al actualizar el profesor.'));
    }
}

export async function deleteProfessor(slug: string, id: string): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_ONLY]);

        // Nadie puede eliminarse a sí mismo (evita lockout de la institución).
        if (id === ctx.userId) return fail('No puedes eliminar tu propia cuenta.');

        const res = await prisma.user.deleteMany({
            where: {
                id,
                academicInstitutionId: ctx.institutionId,
                userRole: { name: { in: [...MANAGED_ROLES] } },
            },
        });
        if (res.count === 0) return fail('Usuario no encontrado.');

        await logAudit({
            action: AUDIT_ACTION.PROFESSOR_DELETE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'User',
            entityId: id,
        });
        revalidatePath(`/${slug}/professors`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al eliminar el profesor.'));
    }
}
