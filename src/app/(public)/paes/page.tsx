import { PaesLanding } from '@/features/paes/components/PaesLanding';
import { PAES_CATALOG } from '@/features/paes/lib/catalog';

export const metadata = {
    title: 'Simulador PAES Gratis 2025 — Ensayos Cronometrados con Corrección Automática',
    description:
        'Practica para la PAES con ensayos cronometrados y corrección instantánea. Competencia Lectora, Matemática M1, M2 y Ciencias. Gratis, sin registro, sin límite de intentos.',
    alternates: { canonical: 'https://www.aulika.cl/paes' },
    openGraph: {
        title: 'Simulador PAES Gratis 2025 — Practica con Corrección Automática',
        description:
            'Ensayos PAES cronometrados con corrección al instante. Todas las asignaturas. Sin registro.',
        url: 'https://www.aulika.cl/paes',
    },
};

export default function PaesPage() {
    return <PaesLanding subjects={PAES_CATALOG} />;
}
