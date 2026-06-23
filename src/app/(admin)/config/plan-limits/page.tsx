import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
import { prisma } from '@/shared/lib/prisma';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { PlanLimitsClient } from '@/features/admin-plan/components/PlanLimitsClient';
import { Sliders } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Límites de planes · Aulika',
};

export default async function PlanLimitsPage() {
    const [limits, customPlans] = await Promise.all([
        prisma.planLimits.findMany({ orderBy: { plan: 'asc' } }),
        prisma.customPlan.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return (
        <>
            <AdminTopBar
                breadcrumb={['Aulika · Plataforma', 'Panel Global', 'Límites de planes']}
                title="Límites de planes"
                subtitle="Configurá los recursos máximos por plan. Dejá en blanco para ilimitado."
                icon={<Sliders size={18} />}
            />
            <main className="flex-1 p-8">
                <PlanLimitsClient limits={limits} customPlans={customPlans} />
            </main>
        </>
    );
}
