import type { Metadata } from 'next';
import { PaymentsClient } from '@/features/admin-plan/components/PaymentsClient';
import { getPayments } from '@/features/admin-plan/actions/mutations';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Pagos · Aulika',
};

export default async function PaymentsPage() {
    const result = await getPayments({ page: 1 });
    const initial = result.data ?? { rows: [], total: 0, page: 1, pageSize: 10 };

    return <PaymentsClient initial={initial} />;
}
