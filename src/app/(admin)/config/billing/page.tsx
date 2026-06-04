import type * as React from 'react';
import type { Metadata } from 'next';
import { CreditCard } from 'lucide-react';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { BillingDashboardClient } from '@/features/admin-plan/components/BillingDashboardClient';
import { getBillingStats } from '@/features/admin-plan/actions/mutations';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Facturación · Aulika',
};

export default async function BillingPage(): Promise<React.JSX.Element> {
    const result = await getBillingStats();
    const stats = result.data ?? {
        mrr: 0,
        activeCount: 0,
        pendingCount: 0,
        cancelledCount: 0,
        pausedCount: 0,
        revenueLast12Months: [],
        byPlan: [],
    };

    return (
        <div className="bg-paper flex min-h-screen flex-col">
            <AdminTopBar
                breadcrumb={['Aulika · Plataforma', 'Panel Global', 'Facturación']}
                title="Facturación"
                subtitle="Métricas de ingresos y suscripciones activas"
                icon={<CreditCard size={18} />}
            />
            <main className="flex-1 p-8">
                <BillingDashboardClient stats={stats} />
            </main>
        </div>
    );
}
