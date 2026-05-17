import type * as React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Receipt } from 'lucide-react';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
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

export default async function SubscriptionDetailPage({ params }: Props): Promise<React.JSX.Element> {
    const { id } = await params;
    const result = await getSubscriptionById(id);

    if (!result.data) notFound();

    const { data: detail } = result;

    return (
        <div className="flex flex-col min-h-screen bg-paper">
            <AdminTopBar
                breadcrumb={['Panel Global', 'Suscripciones', `${detail.id.slice(0, 8)}…`]}
                title="Detalle de suscripción"
                subtitle={`${detail.institutionName ?? 'Sin institución'} · ${detail.plan}`}
                icon={<Receipt size={18} />}
                actions={
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/config/subscriptions">← Volver</Link>
                    </Button>
                }
            />
            <main className="flex-1 p-8">
                <SubscriptionDetailClient detail={detail} />
            </main>
        </div>
    );
}
