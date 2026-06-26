import type { Metadata } from 'next';
import { SubscriptionsClient } from '@/features/admin-plan/components/SubscriptionsClient';
import { getSubscriptions } from '@/features/admin-plan/actions/mutations';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { CreditCard } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Suscripciones y pagos · Aulika',
};

export default async function SubscriptionsPage() {
    const result = await getSubscriptions({ page: 1 });
    const initial = result.data ?? { rows: [], total: 0, page: 1, pageSize: 10 };

    return (
        <>
            <AdminTopBar
                title="Suscripciones y pagos"
                breadcrumb={['Aulika · Plataforma', 'Panel Global', 'Suscripciones']}
                subtitle={`${initial.total} registros en total`}
                icon={<CreditCard size={18} />}
            />
            <SubscriptionsClient initial={initial} />
        </>
    );
}
