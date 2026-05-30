'use server';

import { prisma } from '@/shared/lib/prisma';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { requireInstitutionAccess } from '@/shared/lib/auth-guard';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';
import { revalidatePath } from 'next/cache';

export async function deleteResult(slug: string, id: string): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug);

        // Scope de institución vía el examen del resultado (cierra IDOR) y
        // verificación de existencia.
        const res = await prisma.result.deleteMany({
            where: { id, exam: { academicInstitutionId: ctx.institutionId } },
        });
        if (res.count === 0) return fail('Resultado no encontrado.');

        await logAudit({
            action: AUDIT_ACTION.RESULT_DELETE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'Result',
            entityId: id,
        });
        revalidatePath(`/${slug}/results`);
        revalidatePath(`/${slug}/liveresults`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al eliminar el resultado.'));
    }
}
