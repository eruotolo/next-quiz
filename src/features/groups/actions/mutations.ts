'use server';

import { prisma } from '@/shared/lib/prisma';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { groupSchema, type GroupInput } from '@/features/groups/schemas/group.schemas';
import { USER_ROLE } from '@/shared/lib/roles';
import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { assertQuota } from '@/features/subscriptions/lib/quota';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';
import { revalidatePath } from 'next/cache';

const ADMIN_ONLY = [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN] as const;

interface NormalizedGroup {
    name: string;
    stream: string | null;
    tutorId: string | null;
    programId: string | null;
    periodId: string | null;
    courseSectionIds: string[];
}

/**
 * Normaliza los datos del grupo y valida que el tutor (si se indica), el
 * programa (si se indica) y el período (si se indica) pertenezcan a la
 * institución (anti-IDOR). Los `courseSectionIds` se validan al persistir
 * (updateMany con filtro por institución). Devuelve null si algo no es válido.
 */
async function normalizeGroupData(
    parsed: GroupInput,
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
    const programId = parsed.programId ?? null;
    if (programId) {
        const program = await prisma.program.findFirst({
            where: { id: programId, academicInstitutionId: institutionId },
            select: { id: true },
        });
        if (!program) return null;
    }
    const periodId = parsed.periodId ?? null;
    if (periodId) {
        const period = await prisma.academicPeriod.findFirst({
            where: { id: periodId, academicInstitutionId: institutionId },
            select: { id: true },
        });
        if (!period) return null;
    }
    return {
        name: parsed.name,
        stream: parsed.stream && parsed.stream !== '' ? parsed.stream : null,
        tutorId,
        programId,
        periodId,
        courseSectionIds: parsed.courseSectionIds ?? [],
    };
}

export async function createGroup(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_ONLY]);
        const parsed = groupSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

        const gdata = await normalizeGroupData(parsed.data, ctx.institutionId);
        if (!gdata) return fail('El tutor seleccionado no pertenece a esta institución.');

        await assertQuota(ctx.institutionId, 'group', ctx.userRole);

        const group = await prisma.$transaction(async (tx) => {
            const g = await tx.group.create({
                data: {
                    name: gdata.name,
                    stream: gdata.stream,
                    tutorId: gdata.tutorId,
                    programId: gdata.programId,
                    periodId: gdata.periodId,
                    academicInstitutionId: ctx.institutionId,
                },
                select: { id: true },
            });
            // Vincula los ramos seleccionados al nuevo grupo (filtro anti-IDOR).
            if (gdata.courseSectionIds.length > 0) {
                await tx.courseSection.updateMany({
                    where: {
                        id: { in: gdata.courseSectionIds },
                        period: { academicInstitutionId: ctx.institutionId },
                    },
                    data: { groupId: g.id },
                });
            }
            return g;
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
            data: {
                name: gdata.name,
                stream: gdata.stream,
                tutorId: gdata.tutorId,
                programId: gdata.programId,
                periodId: gdata.periodId,
            },
        });
        if (res.count === 0) return fail('Grupo no encontrado.');

        // Reasigna los ramos del grupo: los seleccionados → groupId = id; los que
        // ya no están → groupId = null (filtro anti-IDOR por institución).
        await prisma.$transaction([
            prisma.courseSection.updateMany({
                where: {
                    id: { in: gdata.courseSectionIds },
                    period: { academicInstitutionId: ctx.institutionId },
                },
                data: { groupId: id },
            }),
            prisma.courseSection.updateMany({
                where: {
                    groupId: id,
                    id: { notIn: gdata.courseSectionIds },
                    period: { academicInstitutionId: ctx.institutionId },
                },
                data: { groupId: null },
            }),
        ]);

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
