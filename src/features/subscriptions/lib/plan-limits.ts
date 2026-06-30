import type { Plan, PlanLimits } from '@prisma/client';
import { cache } from 'react';
import { prisma } from '@/shared/lib/prisma';

/**
 * Lee los límites de un plan. Memoizado por request con React `cache()` para
 * deduplicar lecturas dentro de la misma operación. Entre requests siempre
 * relee de la base de datos, lo que evita incoherencias entre instancias
 * serverless (un cambio de límites aplica de inmediato en todas).
 *
 * Resolución híbrida:
 *  - Si `planCode` es un string concreto, busca por compound key (planes por
 *    producto: exams_free, lms_colegio, pack_completo…).
 *  - Si `planCode` es null/undefined, busca el plan heredado (planCode nulo).
 *    Prisma no permite `findUnique` con compound key cuando un componente es
 *    null, así que se resuelve con `findFirst`.
 */
export const getPlanLimits = cache(
    async (plan: Plan, planCode?: string | null): Promise<PlanLimits> => {
        const limits = planCode
            ? await prisma.planLimits.findUnique({
                  where: { plan_planCode: { plan, planCode } },
              })
            : await prisma.planLimits.findFirst({
                  where: { plan, planCode: null },
              });
        if (!limits) {
            throw new Error(`PlanLimits not found for plan: ${plan}, planCode: ${planCode ?? 'null'}`);
        }
        return limits;
    },
);

/**
 * Antes invalidaba un cache en memoria con TTL. Ahora los límites se releen por
 * request, por lo que no hay cache persistente que invalidar. Se conserva como
 * no-op para compatibilidad con los llamadores existentes.
 */
export function invalidatePlanLimitsCache(plan?: Plan): void {
    void plan;
}
