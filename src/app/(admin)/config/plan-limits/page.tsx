import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
import { prisma } from '@/shared/lib/prisma';
import { PlanLimitsClient } from '@/features/admin-plan/components/PlanLimitsClient';

export const metadata: Metadata = {
    title: 'Límites de planes · Aulika',
};

export default async function PlanLimitsPage() {
    const [limits, customPlans] = await Promise.all([
        prisma.planLimits.findMany({ orderBy: { plan: 'asc' } }),
        prisma.customPlan.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return (
        <main className="flex-1 p-8">
            <PlanLimitsClient limits={limits} customPlans={customPlans} />
        </main>
    );
}
