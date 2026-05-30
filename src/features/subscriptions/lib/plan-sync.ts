import type { Plan } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';

/**
 * Activa (o actualiza) el plan de una institución. Centraliza la única forma
 * correcta de fijar `institution.plan`, su vencimiento y la fecha de activación,
 * para que el panel, el webhook de pago y los flujos de signup queden
 * sincronizados con la realidad de la suscripción.
 */
export async function activateInstitutionPlan(
    institutionId: string,
    plan: Plan,
    expiresAt: Date | null,
): Promise<void> {
    await prisma.academicInstitution.update({
        where: { id: institutionId },
        data: { plan, planExpiresAt: expiresAt, activatedAt: new Date() },
    });
}

/**
 * Degrada una institución al plan FREE (al cancelar/expirar la suscripción).
 * No toca usuarios ni datos: solo baja el plan y limpia el vencimiento, de modo
 * que las cuotas vuelvan a las del plan gratuito.
 */
export async function downgradeInstitutionToFree(institutionId: string): Promise<void> {
    await prisma.academicInstitution.update({
        where: { id: institutionId },
        data: { plan: 'FREE', planExpiresAt: null },
    });
}
