import type { Plan } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';

export interface InstitutionFlags {
    examsEnabled: boolean;
    lmsEnabled: boolean;
    examsPlanCode: string | null;
    lmsPlanCode: string | null;
}

/**
 * Fallback mientras las columnas `examsEnabled`/`lmsEnabled` aún no existen
 * en producción (la migración de Fase 1 puede no haber corrido en todos los
 * entornos). Mantiene la app funcional con la heurística histórica basada
 * en `plan`:
 *   - Exámenes: siempre activos (producto core de Aulika).
 *   - LMS: solo para planes pagos (DOCENTE, COLEGIO, INSTITUCIONAL).
 */
function flagsFromPlan(plan: Plan): InstitutionFlags {
    return {
        examsEnabled: true,
        lmsEnabled: plan !== 'FREE',
        examsPlanCode: null,
        lmsPlanCode: null,
    };
}

/**
 * Lee los flags de habilitación de productos de una institución con fallback
 * defensivo. Si la institución no existe o la query falla (entorno con la
 * migración pendiente), devuelve la heurística por `plan`.
 */
export async function getInstitutionFlags(
    institutionId: string | null,
    plan: Plan,
): Promise<InstitutionFlags> {
    if (!institutionId) return flagsFromPlan(plan);

    try {
        const inst = await prisma.academicInstitution.findUnique({
            where: { id: institutionId },
            select: {
                examsEnabled: true,
                lmsEnabled: true,
                examsPlanCode: true,
                lmsPlanCode: true,
            },
        });
        if (!inst) return flagsFromPlan(plan);
        return {
            examsEnabled: inst.examsEnabled,
            lmsEnabled: inst.lmsEnabled,
            examsPlanCode: inst.examsPlanCode,
            lmsPlanCode: inst.lmsPlanCode,
        };
    } catch {
        return flagsFromPlan(plan);
    }
}
