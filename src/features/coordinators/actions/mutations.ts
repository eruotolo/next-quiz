'use server';

import { revalidatePath } from 'next/cache';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { assignCoordinatorSchema } from '@/features/coordinators/schemas/coordinator.schemas';
import { logAudit } from '@/shared/lib/audit';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';

const ADMIN_ONLY = [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN] as const;

/**
 * Verifica que el programa pertenezca a la institución del contexto y que el
 * usuario sea un Profesor de la misma institución. Devuelve null si algo falla.
 */
async function validateProgramAndProfessor(
    programId: string,
    userId: string,
    institutionId: string,
): Promise<{ ok: boolean } | null> {
    const [program, professor] = await Promise.all([
        prisma.program.findFirst({
            where: { id: programId, academicInstitutionId: institutionId },
            select: { id: true },
        }),
        prisma.user.findFirst({
            where: {
                id: userId,
                academicInstitutionId: institutionId,
                userRole: { name: { in: [USER_ROLE.PROFESOR, USER_ROLE.ADMIN] } },
            },
            select: { id: true },
        }),
    ]);
    if (!program) return null;
    if (!professor) return { ok: false };
    return { ok: true };
}

export async function assignCoordinator(
    slug: string,
    programId: string,
    data: unknown,
): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_ONLY]);
        const parsed = assignCoordinatorSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

        const valid = await validateProgramAndProfessor(
            programId,
            parsed.data.userId,
            ctx.institutionId,
        );
        if (!valid) return fail('Programa no encontrado.');
        if (!valid.ok) return fail('El profesor seleccionado no pertenece a esta institución.');

        // Idempotente: el unique [userId, programId] evita duplicados.
        await prisma.programCoordinator.upsert({
            where: { userId_programId: { userId: parsed.data.userId, programId } },
            update: {},
            create: { userId: parsed.data.userId, programId },
        });

        await logAudit({
            action: AUDIT_ACTION.COORDINATOR_ASSIGN,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'ProgramCoordinator',
            entityId: programId,
            metadata: { userId: parsed.data.userId },
        });
        revalidatePath(`/${slug}/programs/${programId}`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al asignar el coordinador.'));
    }
}

export async function removeCoordinator(
    slug: string,
    programId: string,
    userId: string,
): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_ONLY]);

        // Asegura que el programa sea de esta institución antes de borrar.
        const program = await prisma.program.findFirst({
            where: { id: programId, academicInstitutionId: ctx.institutionId },
            select: { id: true },
        });
        if (!program) return fail('Programa no encontrado.');

        const res = await prisma.programCoordinator.deleteMany({
            where: { programId, userId },
        });
        if (res.count === 0) return fail('Coordinador no encontrado.');

        await logAudit({
            action: AUDIT_ACTION.COORDINATOR_REMOVE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'ProgramCoordinator',
            entityId: programId,
            metadata: { userId },
        });
        revalidatePath(`/${slug}/programs/${programId}`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al quitar el coordinador.'));
    }
}
