import type * as React from 'react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { SubscriptionsClient } from '@/features/admin-plan/components/SubscriptionsClient';
import { getSubscriptions } from '@/features/admin-plan/actions/mutations';
import { CreditCard } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Suscripciones y pagos · Aulika',
};

export default async function SubscriptionsPage(): Promise<React.JSX.Element> {
    const result = await getSubscriptions({ page: 1 });
    const initial = result.data ?? { rows: [], total: 0, page: 1, pageSize: 10 };

    return (
        <div className="flex flex-col min-h-screen bg-paper">
            <AdminTopBar
                breadcrumb={['Aulika · Plataforma', 'Panel Global', 'Suscripciones']}
                title="Suscripciones y pagos"
                subtitle={`${initial.total} registros en total`}
                icon={<CreditCard size={18} />}
            />
            <main className="flex-1 p-8">
                <SubscriptionsClient initial={initial} />
            </main>
        </div>
    );
}
