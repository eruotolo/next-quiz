import type * as React from 'react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
import { prisma } from '@/shared/lib/prisma';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { PlanLimitsClient } from '@/features/admin-plan/components/PlanLimitsClient';
import { Sliders } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Límites de planes · Aulika',
};

export default async function PlanLimitsPage(): Promise<React.JSX.Element> {
    const limits = await prisma.planLimits.findMany({ orderBy: { plan: 'asc' } });

    return (
        <div className="flex flex-col min-h-screen bg-paper">
            <AdminTopBar
                breadcrumb={['Aulika · Plataforma', 'Panel Global', 'Límites de planes']}
                title="Límites de planes"
                subtitle="Configurá los recursos máximos por plan. Dejá en blanco para ilimitado."
                icon={<Sliders size={18} />}
            />
            <main className="flex-1 p-8">
                <PlanLimitsClient limits={limits} />
            </main>
        </div>
    );
}
