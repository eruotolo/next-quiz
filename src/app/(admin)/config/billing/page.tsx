import type { Metadata } from 'next';
import { BillingDashboardClient } from '@/features/admin-plan/components/BillingDashboardClient';
import { getBillingStats } from '@/features/admin-plan/actions/mutations';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Facturación · Aulika',
};

export default async function BillingPage() {
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
        <main className="flex-1 p-8">
            <BillingDashboardClient stats={stats} />
        </main>
    );
}
