import type { Metadata } from 'next';

import { L3Hero } from '@/features/landing/components/L3Hero';
import { L3Trust } from '@/features/landing/components/L3Trust';
import { L3Walkthrough } from '@/features/landing/components/L3Walkthrough';
import { L3Comparison } from '@/features/landing/components/L3Comparison';
import { L3Segments } from '@/features/landing/components/L3Segments';
import { L3Security } from '@/features/landing/components/L3Security';
import { L3Stats } from '@/features/landing/components/L3Stats';
import { L3Testimonials } from '@/features/landing/components/L3Testimonials';
import { L3Pricing } from '@/features/landing/components/L3Pricing';
import { L3FAQ } from '@/features/landing/components/L3FAQ';
import { L3CTA } from '@/features/landing/components/L3CTA';
import { L3Footer } from '@/features/landing/components/L3Footer';

export const metadata: Metadata = {
    title: 'Ensayos PAES Online · Gestión de Exámenes para Instituciones',
    description:
        'La plataforma líder en Chile para crear, aplicar y corregir ensayos PAES y exámenes institucionales. Sin papel, con resultados en tiempo real y análisis avanzado por IA.',
    openGraph: {
        title: 'EduNext Quiz · La evolución del examen de aula',
        description: 'Digitaliza tus evaluaciones con corrección automática y analítica instantánea. Diseñado para colegios y preuniversitarios de Chile.',
        type: 'website',
    },
};

export default function MarketingPage(): React.JSX.Element {
    return (
        <>
            <L3Hero />
            <L3Trust />
            <L3Walkthrough />
            <L3Comparison />
            <L3Segments />
            <L3Security />
            <L3Stats />
            <L3Testimonials />
            <L3Pricing />
            <L3FAQ />
            <L3CTA />
        </>
    );
}
