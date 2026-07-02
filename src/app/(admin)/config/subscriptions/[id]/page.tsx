import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SubscriptionDetailClient } from '@/features/admin-plan/components/SubscriptionDetailClient';
import { getSubscriptionById } from '@/features/admin-plan/actions/mutations';
import { Button } from '@/shared/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Detalle de suscripción · Aulika',
};

interface Props {
    params: Promise<{ id: string }>;
}

export default async function SubscriptionDetailPage({ params }: Props) {
    const { id } = await params;
    const result = await getSubscriptionById(id);

    if (!result.data) notFound();

    const { data: detail } = result;

    return (
        <main className="flex-1 p-8">
            <div className="mb-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/config/subscriptions">← Volver</Link>
                </Button>
            </div>
            <SubscriptionDetailClient detail={detail} />
        </main>
    );
}
