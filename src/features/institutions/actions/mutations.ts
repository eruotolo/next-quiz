'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { logAudit } from '@/shared/lib/audit';
import { USER_ROLE } from '@/shared/lib/roles';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { institutionSchema } from '@/features/institutions/schemas/institution.schemas';
import { revalidatePath } from 'next/cache';

async function requireSuperAdmin(): Promise<{ id: string; email: string; userRoleName: string }> {
    const session = await auth();
    if (session?.user.userRoleName !== USER_ROLE.SUPER_ADMIN) throw new Error('Unauthorized');
    return { id: session.user.id, email: session.user.email ?? '', userRoleName: session.user.userRoleName };
}

export async function createInstitution(data: unknown): Promise<{ data: { id: string } | null; error: string | null }> {
    const actor = await requireSuperAdmin().catch(() => null);
    if (!actor) return { data: null, error: 'No autorizado' };

    const parsed = institutionSchema.safeParse(data);
    if (!parsed.success) return { data: null, error: parsed.error.errors[0]?.message ?? 'Error de validación' };

    try {
        const institution = await prisma.academicInstitution.create({
            data: parsed.data,
            select: { id: true },
        });
        await logAudit({
            action: AUDIT_ACTION.INSTITUTION_CREATE,
            actorId: actor.id,
            actorEmail: actor.email,
            actorRole: actor.userRoleName,
            entity: 'AcademicInstitution',
            entityId: institution.id,
        });
        revalidatePath('/config/institutions');
        return { data: { id: institution.id }, error: null };
    } catch (err) {
        const msg = err instanceof Error && err.message.includes('Unique') ? 'El nombre o slug ya está en uso.' : 'Error al crear la institución.';
        return { data: null, error: msg };
    }
}

export async function updateInstitution(id: string, data: unknown): Promise<{ data: null; error: string | null }> {
    const actor = await requireSuperAdmin().catch(() => null);
    if (!actor) return { data: null, error: 'No autorizado' };

    const parsed = institutionSchema.safeParse(data);
    if (!parsed.success) return { data: null, error: parsed.error.errors[0]?.message ?? 'Error de validación' };

    try {
        await prisma.academicInstitution.update({ where: { id }, data: parsed.data });
        await logAudit({
            action: AUDIT_ACTION.INSTITUTION_UPDATE,
            actorId: actor.id,
            actorEmail: actor.email,
            actorRole: actor.userRoleName,
            entity: 'AcademicInstitution',
            entityId: id,
        });
        revalidatePath('/config/institutions');
        return { data: null, error: null };
    } catch (err) {
        const msg = err instanceof Error && err.message.includes('Unique') ? 'El nombre o slug ya está en uso.' : 'Error al actualizar la institución.';
        return { data: null, error: msg };
    }
}

export async function deleteInstitution(id: string): Promise<{ data: null; error: string | null }> {
    const actor = await requireSuperAdmin().catch(() => null);
    if (!actor) return { data: null, error: 'No autorizado' };

    try {
        const userCount = await prisma.user.count({ where: { academicInstitutionId: id } });
        if (userCount > 0) {
            return {
                data: null,
                error: `No se puede eliminar: la institución tiene ${userCount} usuario(s) asociado(s). Eliminá o reasignálos primero.`,
            };
        }

        await prisma.academicInstitution.delete({ where: { id } });
        await logAudit({
            action: AUDIT_ACTION.INSTITUTION_DELETE,
            actorId: actor.id,
            actorEmail: actor.email,
            actorRole: actor.userRoleName,
            entity: 'AcademicInstitution',
            entityId: id,
        });
        revalidatePath('/config/institutions');
        return { data: null, error: null };
    } catch {
        return { data: null, error: 'Error al eliminar la institución.' };
    }
}

export async function toggleInstitutionActive(id: string, active: boolean): Promise<{ data: null; error: string | null }> {
    const actor = await requireSuperAdmin().catch(() => null);
    if (!actor) return { data: null, error: 'No autorizado' };

    try {
        await prisma.academicInstitution.update({ where: { id }, data: { active } });
        await logAudit({
            action: AUDIT_ACTION.INSTITUTION_UPDATE,
            actorId: actor.id,
            actorEmail: actor.email,
            actorRole: actor.userRoleName,
            entity: 'AcademicInstitution',
            entityId: id,
            metadata: { active },
        });
        revalidatePath('/config/institutions');
        return { data: null, error: null };
    } catch {
        return { data: null, error: 'Error al actualizar el estado.' };
    }
}
