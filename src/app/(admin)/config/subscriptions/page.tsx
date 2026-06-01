import type * as React from 'react';
import type { Metadata } from 'next';
import { SubscriptionsClient } from '@/features/admin-plan/components/SubscriptionsClient';
import { getSubscriptions } from '@/features/admin-plan/actions/mutations';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Suscripciones y pagos · Aulika',
};

export default async function SubscriptionsPage(): Promise<React.JSX.Element> {
    const result = await getSubscriptions({ page: 1 });
    const initial = result.data ?? { rows: [], total: 0, page: 1, pageSize: 10 };

    return <SubscriptionsClient initial={initial} />;
}
