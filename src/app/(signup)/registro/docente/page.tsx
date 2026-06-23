import type { Metadata } from 'next';
import { PayerForm } from '@/features/subscriptions/components/PayerForm';

export const metadata: Metadata = {
    title: 'Suscripción Plan Docente · Aulika',
    description: 'Suscribite al plan Docente y digitalizá tus evaluaciones.',
};

export default function RegistroDocentePage() {
    return <PayerForm plan="DOCENTE" />;
}
