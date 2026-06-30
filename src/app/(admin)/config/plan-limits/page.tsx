import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
import { prisma } from '@/shared/lib/prisma';
import { PlanLimitsClient } from '@/features/admin-plan/components/PlanLimitsClient';

export const metadata: Metadata = {
    title: 'Límites de planes · Aulika',
};

export default async function PlanLimitsPage() {
    const [limits, customPlans] = await Promise.all([
        // Trae todas las filas (legacy sin planCode + los 6 packs por producto).
        // El orden estable garantiza que las filas heredadas aparezcan primero
        // dentro de cada plan comercial.
        prisma.planLimits.findMany({ orderBy: [{ plan: 'asc' }, { planCode: 'asc' }] }),
        prisma.customPlan.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return (
        <main className="flex-1 p-8">
            <PlanLimitsClient limits={limits} customPlans={customPlans} />
        </main>
    );
}
