import type { Metadata } from 'next';
import { L3SubpageLayout } from '@/features/landing/components/L3SubpageLayout';
import { L3CTA } from '@/features/landing/components/L3CTA';

export const dynamic = 'force-static';

export const metadata: Metadata = {
    title: 'Analítica Educativa para Directores de Colegio',
    description:
        'Transforma los datos de evaluación en decisiones estratégicas. Visualiza el rendimiento histórico, detecta brechas de aprendizaje y reduce costos de impresión. Para directores de establecimientos educacionales en Chile.',
    alternates: { canonical: 'https://www.aulika.cl/audiencias/directores' },
    openGraph: {
        title: 'Herramientas de Analítica Educativa para Directores | Aulika',
        description:
            'Panel de control institucional con datos de rendimiento histórico, detección temprana de brechas y optimización de recursos.',
        url: 'https://www.aulika.cl/audiencias/directores',
    },
};

export default function DirectoresPage() {
    return (
        <>
            <L3SubpageLayout
                tag="AUDIENCIAS · LIDERAZGO"
                title="Decisiones basadas en evidencia para Directores."
                description="Transforma los datos de evaluación en insights estratégicos para mejorar la calidad educativa de tu establecimiento."
            >
                <div className="text-ink-dim space-y-12 leading-relaxed">
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Panel de Control Institucional
                        </h2>
                        <p>
                            Visualiza el rendimiento histórico de tu colegio, detecta brechas de
                            aprendizaje de forma temprana y asigna recursos de apoyo pedagógico
                            donde más se necesitan.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Optimización de Recursos
                        </h2>
                        <p>
                            Reduce drásticamente el gasto en papel y logística de impresión,
                            permitiendo reasignar esos fondos a otras áreas críticas del proyecto
                            educativo.
                        </p>
                    </section>
                </div>
            </L3SubpageLayout>
            <L3CTA />
        </>
    );
}
