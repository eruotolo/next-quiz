'use server';

import { prisma } from '@/shared/lib/prisma';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { requireInstitutionAccess } from '@/shared/lib/auth-guard';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';
import { revalidatePath } from 'next/cache';

export async function recalculateResult(
    slug: string,
    id: string,
): Promise<ActionResult<{ score: number; maxScore: number }>> {
    try {
        const ctx = await requireInstitutionAccess(slug);

        const result = await prisma.result.findFirst({
            where: { id, exam: { academicInstitutionId: ctx.institutionId } },
            select: {
                id: true,
                answers: true,
                exam: {
                    select: {
                        questions: {
                            select: {
                                id: true,
                                points: true,
                                options: { where: { isCorrect: true }, select: { id: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!result) return fail('Resultado no encontrado.');

        // Re-corrige las respuestas guardadas contra las opciones correctas
        // actuales (mismo criterio all-or-nothing que el submit original).
        const answerMap = (result.answers as Record<string, string[]> | null) ?? {};
        let score = 0;
        let maxScore = 0;
        for (const q of result.exam.questions) {
            maxScore += q.points;
            const correctSet = new Set(q.options.map((o) => o.id));
            const studentSet = new Set(answerMap[q.id] ?? []);
            const isCorrect =
                correctSet.size === studentSet.size && [...correctSet].every((oid) => studentSet.has(oid));
            if (isCorrect) score += q.points;
        }

        await prisma.result.update({ where: { id }, data: { score, maxScore } });
        await logAudit({
            action: AUDIT_ACTION.RESULT_RECALCULATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'Result',
            entityId: id,
            metadata: { score, maxScore },
        });
        revalidatePath(`/${slug}/results`);
        revalidatePath(`/${slug}/liveresults`);
        return ok({ score, maxScore });
    } catch (err) {
        return fail(toActionError(err, 'Error al recalcular el resultado.'));
    }
}

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
