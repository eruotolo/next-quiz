'use server';

import { prisma } from '@/shared/lib/prisma';
import { logAudit } from '@/shared/lib/audit';
import { periodSchema } from '@/features/periods/schemas/period.schemas';
import { USER_ROLE } from '@/shared/lib/roles';
import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';
import { revalidatePath } from 'next/cache';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';

const ADMIN_ONLY = [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN] as const;

/** Mensaje claro cuando el nombre de período ya existe en la institución (P2002). */
function periodErrorMessage(err: unknown): string {
    if (err instanceof Error && err.message.includes('Unique')) {
        return 'Ya existe un período con ese nombre en esta institución.';
    }
    return toActionError(err, 'Error al guardar el período.');
}

/** Desactiva los demás períodos activos del mismo año (un solo activo por año). */
function deactivateActivePeersQuery(institutionId: string, year: number, exceptId?: string) {
    return prisma.academicPeriod.updateMany({
        where: {
            academicInstitutionId: institutionId,
            year,
            isActive: true,
            ...(exceptId ? { id: { not: exceptId } } : {}),
        },
        data: { isActive: false },
    });
}

export async function createPeriod(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_ONLY]);
        const parsed = periodSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

        const existing = await prisma.academicPeriod.findFirst({
            where: { academicInstitutionId: ctx.institutionId, name: parsed.data.name },
            select: { id: true },
        });
        if (existing) return fail('Ya existe un período con ese nombre en esta institución.');

        // Transacción: al marcar como activo, se desactivan los demás del año de
        // forma atómica con la creación (evita estado intermedio sin activo).
        const period = await prisma.$transaction(async (tx) => {
            if (parsed.data.isActive) {
                await tx.academicPeriod.updateMany({
                    where: {
                        academicInstitutionId: ctx.institutionId,
                        year: parsed.data.year,
                        isActive: true,
                    },
                    data: { isActive: false },
                });
            }
            return tx.academicPeriod.create({
                data: { ...parsed.data, academicInstitutionId: ctx.institutionId },
                select: { id: true },
            });
        });

        await logAudit({
            action: AUDIT_ACTION.PERIOD_CREATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'AcademicPeriod',
            entityId: period.id,
        });

        revalidatePath(`/${slug}/periods`);
        return ok({ id: period.id });
    } catch (err) {
        return fail(periodErrorMessage(err));
    }
}

export async function updatePeriod(
    slug: string,
    id: string,
    data: unknown,
): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_ONLY]);
        const parsed = periodSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

        const existing = await prisma.academicPeriod.findFirst({
            where: {
                academicInstitutionId: ctx.institutionId,
                name: parsed.data.name,
                id: { not: id },
            },
            select: { id: true },
        });
        if (existing) return fail('Ya existe un período con ese nombre en esta institución.');

        const res = await prisma.$transaction(async (tx) => {
            if (parsed.data.isActive) {
                await tx.academicPeriod.updateMany({
                    where: {
                        academicInstitutionId: ctx.institutionId,
                        year: parsed.data.year,
                        isActive: true,
                        id: { not: id },
                    },
                    data: { isActive: false },
                });
            }
            return tx.academicPeriod.updateMany({
                where: { id, academicInstitutionId: ctx.institutionId },
                data: parsed.data,
            });
        });
        if (res.count === 0) return fail('Período no encontrado.');

        await logAudit({
            action: AUDIT_ACTION.PERIOD_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'AcademicPeriod',
            entityId: id,
        });

        revalidatePath(`/${slug}/periods`);
        return ok(null);
    } catch (err) {
        return fail(periodErrorMessage(err));
    }
}

export async function deletePeriod(slug: string, id: string): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_ONLY]);

        const res = await prisma.academicPeriod.deleteMany({
            where: { id, academicInstitutionId: ctx.institutionId },
        });
        if (res.count === 0) return fail('Período no encontrado.');

        await logAudit({
            action: AUDIT_ACTION.PERIOD_DELETE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'AcademicPeriod',
            entityId: id,
        });

        revalidatePath(`/${slug}/periods`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al eliminar el período.'));
    }
}

export async function setActivePeriod(
    slug: string,
    id: string,
    year: number,
): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_ONLY]);

        // Atómico: desactiva los demás del año y activa este en una sola transacción.
        const [, activate] = await prisma.$transaction([
            deactivateActivePeersQuery(ctx.institutionId, year, id),
            prisma.academicPeriod.updateMany({
                where: { id, academicInstitutionId: ctx.institutionId },
                data: { isActive: true },
            }),
        ]);
        if (activate.count === 0) return fail('Período no encontrado.');

        await logAudit({
            action: AUDIT_ACTION.PERIOD_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'AcademicPeriod',
            entityId: id,
            metadata: { action: 'setActive' },
        });

        revalidatePath(`/${slug}/periods`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al cambiar estado del período.'));
    }
}
