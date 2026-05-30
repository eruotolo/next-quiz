'use server';

import { prisma } from '@/shared/lib/prisma';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { groupSchema } from '@/features/groups/schemas/group.schemas';
import { USER_ROLE } from '@/shared/lib/roles';
import { requireInstitutionAccess } from '@/shared/lib/auth-guard';
import { assertQuota } from '@/features/subscriptions/lib/quota';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';
import { revalidatePath } from 'next/cache';

const ADMIN_ONLY = [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN] as const;

interface NormalizedGroup {
    name: string;
    stream: string | null;
    tutorId: string | null;
}

/**
 * Normaliza los datos del grupo y valida que el tutor (si se indica) sea un
 * profesor de la misma institución. Devuelve null si el tutor no es válido.
 */
async function normalizeGroupData(
    parsed: { name: string; stream?: string; tutorId?: string | null },
    institutionId: string,
): Promise<NormalizedGroup | null> {
    const tutorId = parsed.tutorId ?? null;
    if (tutorId) {
        const tutor = await prisma.user.findFirst({
            where: {
                id: tutorId,
                academicInstitutionId: institutionId,
                userRole: { name: USER_ROLE.PROFESOR },
            },
            select: { id: true },
        });
        if (!tutor) return null;
    }
    return {
        name: parsed.name,
        stream: parsed.stream && parsed.stream !== '' ? parsed.stream : null,
        tutorId,
    };
}

export async function createGroup(slug: string, data: unknown): Promise<ActionResult<{ id: string }>> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_ONLY]);
        const parsed = groupSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

        const gdata = await normalizeGroupData(parsed.data, ctx.institutionId);
        if (!gdata) return fail('El tutor seleccionado no pertenece a esta institución.');

        await assertQuota(ctx.institutionId, 'group', ctx.userRole);

        const group = await prisma.group.create({
            data: { ...gdata, academicInstitutionId: ctx.institutionId },
            select: { id: true },
        });
        await logAudit({
            action: AUDIT_ACTION.GROUP_CREATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'Group',
            entityId: group.id,
        });
        revalidatePath(`/${slug}/groups`);
        return ok({ id: group.id });
    } catch (err) {
        return fail(toActionError(err, 'Error al crear el grupo.'));
    }
}

export async function updateGroup(slug: string, id: string, data: unknown): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_ONLY]);
        const parsed = groupSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

        const gdata = await normalizeGroupData(parsed.data, ctx.institutionId);
        if (!gdata) return fail('El tutor seleccionado no pertenece a esta institución.');

        const res = await prisma.group.updateMany({
            where: { id, academicInstitutionId: ctx.institutionId },
            data: gdata,
        });
        if (res.count === 0) return fail('Grupo no encontrado.');

        await logAudit({
            action: AUDIT_ACTION.GROUP_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'Group',
            entityId: id,
        });
        revalidatePath(`/${slug}/groups`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al actualizar el grupo.'));
    }
}

export async function deleteGroup(slug: string, id: string): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_ONLY]);

        const res = await prisma.group.deleteMany({
            where: { id, academicInstitutionId: ctx.institutionId },
        });
        if (res.count === 0) return fail('Grupo no encontrado.');

        await logAudit({
            action: AUDIT_ACTION.GROUP_DELETE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'Group',
            entityId: id,
        });
        revalidatePath(`/${slug}/groups`);
        revalidatePath(`/${slug}/students`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al eliminar el grupo.'));
    }
}
