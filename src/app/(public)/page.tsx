import type { Metadata } from 'next';

import { JsonLd } from '@/shared/components/seo/JsonLd';
import {
    organizationSchema,
    softwareApplicationSchema,
    websiteSchema,
    faqSchema,
} from '@/shared/components/seo/schemas';
import { L3Hero } from '@/features/landing/components/L3Hero';
import { L3Walkthrough } from '@/features/landing/components/L3Walkthrough';
import { L3Comparison } from '@/features/landing/components/L3Comparison';
import { L3Segments } from '@/features/landing/components/L3Segments';
import { L3Security } from '@/features/landing/components/L3Security';
import { L3Stats } from '@/features/landing/components/L3Stats';
import { L3PreuPDV } from '@/features/landing/components/L3PreuPDV';
import { L3Pricing } from '@/features/landing/components/L3Pricing';
import { L3FAQ } from '@/features/landing/components/L3FAQ';
import { FAQS } from '@/features/landing/lib/faq-data';
import { L3CTA } from '@/features/landing/components/L3CTA';

export const metadata: Metadata = {
    title: 'Evaluaciones Online para Colegios y Universidades en Chile',
    description:
        'Crea, aplica y corrige evaluaciones digitales con corrección automática. Login por RUT, resultados en tiempo real, banco de preguntas reutilizable. Para colegios y universidades de Chile. Prueba gratis 30 días.',
    keywords: [
        'evaluaciones online Chile',
        'sistema de evaluación colegios',
        'plataforma exámenes universidades Chile',
        'evaluación digital educación',
        'exámenes online por RUT',
        'corrección automática evaluaciones',
        'PAES simulador online',
        'plataforma educativa chilena',
        'software evaluación académica',
    ],
    alternates: {
        canonical: 'https://www.aulika.cl',
    },
    openGraph: {
        title: 'Aulika | La evaluación académica sin papel, sin demoras',
        description:
            'Digitaliza las evaluaciones de tu institución. Corrección automática, resultados en vivo y banco de preguntas. Prueba gratis 30 días.',
        type: 'website',
        url: 'https://www.aulika.cl',
    },
};

export default function MarketingPage() {
    return (
        <>
            <JsonLd data={organizationSchema} />
            <JsonLd data={softwareApplicationSchema} />
            <JsonLd data={websiteSchema} />
            <JsonLd data={faqSchema(FAQS)} />

            <L3Hero />
            {/*<L3Trust />*/}
            <L3Walkthrough />
            <L3Comparison />
            <L3Segments />
            <L3Security />
            <L3Stats />
            {/*<L3Testimonials />*/}
            <L3PreuPDV />
            <L3Pricing />
            <L3FAQ faqs={FAQS} />
            <L3CTA />
        </>
    );
}
