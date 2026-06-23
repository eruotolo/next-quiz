import type { Metadata } from 'next';
import { SignupFreeForm } from '@/features/subscriptions/components/SignupFreeForm';

export const metadata: Metadata = {
    title: 'Crear cuenta gratis · Aulika',
    description: 'Registrá tu institución sin tarjeta de crédito.',
};

export default function RegistroFreePage() {
    return <SignupFreeForm />;
}
