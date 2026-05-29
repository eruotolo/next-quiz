import type { Plan, PlanLimits } from '@prisma/client';
import { cache } from 'react';
import { prisma } from '@/shared/lib/prisma';

/**
 * Lee los límites de un plan. Memoizado por request con React `cache()` para
 * deduplicar lecturas dentro de la misma operación. Entre requests siempre
 * relee de la base de datos, lo que evita incoherencias entre instancias
 * serverless (un cambio de límites aplica de inmediato en todas).
 */
export const getPlanLimits = cache(async (plan: Plan): Promise<PlanLimits> => {
    const limits = await prisma.planLimits.findUnique({ where: { plan } });
    if (!limits) throw new Error(`PlanLimits not found for plan: ${plan}`);
    return limits;
});

/**
 * Antes invalidaba un cache en memoria con TTL. Ahora los límites se releen por
 * request, por lo que no hay cache persistente que invalidar. Se conserva como
 * no-op para compatibilidad con los llamadores existentes.
 */
export function invalidatePlanLimitsCache(plan?: Plan): void {
    void plan;
}
