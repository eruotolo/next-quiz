import { PaesLanding } from '@/features/paes/components/PaesLanding';
import { PAES_CATALOG } from '@/features/paes/lib/catalog';

export const metadata = {
    title: 'Simulador PAES — Aulika',
    description:
        'Practica para la PAES con ensayos cronometrados. Todas las asignaturas. Gratis, sin registro, sin límite de intentos.',
};

export default function PaesPage(): React.JSX.Element {
    return <PaesLanding subjects={PAES_CATALOG} />;
}
