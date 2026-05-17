import type * as React from 'react';
import type { Metadata } from 'next';
import { Wallet } from 'lucide-react';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { PaymentsClient } from '@/features/admin-plan/components/PaymentsClient';
import { getPayments } from '@/features/admin-plan/actions/mutations';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Pagos · Aulika',
};

export default async function PaymentsPage(): Promise<React.JSX.Element> {
    const result = await getPayments({ page: 1 });
    const initial = result.data ?? { rows: [], total: 0, page: 1, pageSize: 20 };

    return (
        <div className="flex flex-col min-h-screen bg-paper">
            <AdminTopBar
                breadcrumb={['Aulika · Plataforma', 'Panel Global', 'Pagos']}
                title="Pagos"
                subtitle={`${initial.total} cobros registrados`}
                icon={<Wallet size={18} />}
            />
            <main className="flex-1 p-8">
                <PaymentsClient initial={initial} />
            </main>
        </div>
    );
}
