import type * as React from 'react';
import type { Metadata } from 'next';
import { PayerForm } from '@/features/subscriptions/components/PayerForm';

export const metadata: Metadata = {
    title: 'Suscripción Plan Colegio · Aulika',
    description: 'Suscribite al plan Colegio para equipos docentes.',
};

export default function RegistroColegioPage(): React.JSX.Element {
    return <PayerForm plan="COLEGIO" />;
}
