import type * as React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/shared/lib/prisma';
import { RegistrationForm } from '@/features/subscriptions/components/RegistrationForm';
import { PendingPaymentPoller } from '@/features/subscriptions/components/PendingPaymentPoller';

export const metadata: Metadata = {
    title: 'Completar registro · Plan Colegio · Aulika',
};

interface Props {
    searchParams: Promise<{ sub?: string }>;
}

export default async function ColegioExitoPage({ searchParams }: Props): Promise<React.JSX.Element> {
    const { sub } = await searchParams;
    if (!sub) notFound();

    const subscription = await prisma.subscription.findUnique({
        where: { id: sub },
        select: {
            id: true,
            status: true,
            plan: true,
            metadata: true,
        },
    });

    if (!subscription || subscription.plan !== 'COLEGIO') notFound();

    const meta = (subscription.metadata as Record<string, string> | null) ?? {};
    const prefillEmail = meta.payerEmail;

    if (subscription.status === 'authorized') {
        return (
            <RegistrationForm
                subscriptionId={sub}
                prefillEmail={prefillEmail}
                planName="Colegio"
            />
        );
    }

    return <PendingPaymentPoller subscriptionId={sub} planName="Colegio" />;
}
