import type { Plan, PlanLimits } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
    data: PlanLimits;
    expiresAt: number;
}

const cache = new Map<Plan, CacheEntry>();

export async function getPlanLimits(plan: Plan): Promise<PlanLimits> {
    const cached = cache.get(plan);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const limits = await prisma.planLimits.findUnique({ where: { plan } });
    if (!limits) throw new Error(`PlanLimits not found for plan: ${plan}`);

    cache.set(plan, { data: limits, expiresAt: Date.now() + CACHE_TTL_MS });
    return limits;
}

export function invalidatePlanLimitsCache(plan?: Plan): void {
    if (plan !== undefined) {
        cache.delete(plan);
    } else {
        cache.clear();
    }
}
