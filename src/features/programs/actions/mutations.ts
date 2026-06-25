'use server';

import { revalidatePath } from 'next/cache';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { programSchema } from '@/features/programs/schemas/program.schemas';
import { assertQuota } from '@/features/subscriptions/lib/quota';
import { logAudit } from '@/shared/lib/audit';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';

const ADMIN_ONLY = [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN] as const;

interface NormalizedProgram {
    name: string;
    code: string | null;
    description: string | null;
}

function normalizeProgramData(parsed: {
    name: string;
    code?: string;
    description?: string;
}): NormalizedProgram {
    return {
        name: parsed.name.trim(),
        code: parsed.code && parsed.code !== '' ? parsed.code.trim() : null,
        description: parsed.description && parsed.description !== '' ? parsed.description.trim() : null,
    };
}

/** Mensaje claro cuando el nombre de programa ya existe en la institución. */
function programErrorMessage(err: unknown): string {
    if (err instanceof Error && err.message.includes('Unique')) {
        return 'Ya existe un programa con ese nombre en esta institución.';
    }
    return toActionError(err, 'Error al guardar el programa.');
}

export async function createProgram(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_ONLY]);
        const parsed = programSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

        await assertQuota(ctx.institutionId, 'program', ctx.userRole);

        const program = await prisma.program.create({
            data: {
                ...normalizeProgramData(parsed.data),
                academicInstitutionId: ctx.institutionId,
            },
            select: { id: true },
        });
        await logAudit({
            action: AUDIT_ACTION.PROGRAM_CREATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'Program',
            entityId: program.id,
        });
        revalidatePath(`/${slug}/programs`);
        return ok({ id: program.id });
    } catch (err) {
        return fail(programErrorMessage(err));
    }
}

export async function updateProgram(slug: string, id: string, data: unknown): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_ONLY]);
        const parsed = programSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

        const res = await prisma.program.updateMany({
            where: { id, academicInstitutionId: ctx.institutionId },
            data: normalizeProgramData(parsed.data),
        });
        if (res.count === 0) return fail('Programa no encontrado.');

        await logAudit({
            action: AUDIT_ACTION.PROGRAM_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'Program',
            entityId: id,
        });
        revalidatePath(`/${slug}/programs`);
        revalidatePath(`/${slug}/programs/${id}`);
        return ok(null);
    } catch (err) {
        return fail(programErrorMessage(err));
    }
}

export async function deleteProgram(slug: string, id: string): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_ONLY]);

        const res = await prisma.program.deleteMany({
            where: { id, academicInstitutionId: ctx.institutionId },
        });
        if (res.count === 0) return fail('Programa no encontrado.');

        await logAudit({
            action: AUDIT_ACTION.PROGRAM_DELETE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'Program',
            entityId: id,
        });
        revalidatePath(`/${slug}/programs`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al eliminar el programa.'));
    }
}
