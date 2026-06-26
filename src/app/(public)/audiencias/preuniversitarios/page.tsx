import type { Metadata } from 'next';
import { L3SubpageLayout } from '@/features/landing/components/L3SubpageLayout';
import { L3CTA } from '@/features/landing/components/L3CTA';
import { Check } from 'lucide-react';

export const dynamic = 'force-static';

export const metadata: Metadata = {
    title: 'Plataforma de Evaluación para Preuniversitarios y Preparación PAES',
    description:
        'Simula ensayos PAES masivos y mide el avance de cada estudiante en tiempo real. Rankings instantáneos, análisis de distractores y reportes por sede. Usado por preuniversitarios chilenos.',
    alternates: { canonical: 'https://www.aulika.cl/audiencias/preuniversitarios' },
    openGraph: {
        title: 'Evaluaciones PAES para Preuniversitarios | Aulika',
        description:
            'Ensayos masivos con corrección automática, rankings en tiempo real y análisis por eje temático.',
        url: 'https://www.aulika.cl/audiencias/preuniversitarios',
    },
};

export default function PreuniversitariosPage() {
    return (
        <>
            <L3SubpageLayout
                tag="AUDIENCIAS · PREUNIVERSITARIOS"
                title="Simulacros PAES de alto rendimiento."
                description="Entendemos que el volumen y la precisión son clave. Aulika permite aplicar ensayos masivos con resultados en tiempo real y rankings de desempeño."
            >
                <div className="text-ink-dim space-y-16 leading-relaxed">
                    <section>
                        <h2 className="font-display text-ink mb-6 text-[28px] font-medium">
                            Ensayos Masivos
                        </h2>
                        <p className="text-[17px]">
                            Soporta a miles de alumnos rindiendo simultáneamente sin latencia.
                            Nuestra arquitectura está preparada para las 'horas punta' de los
                            ensayos nacionales, garantizando estabilidad total.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-display text-ink mb-6 text-[28px] font-medium">
                            Banco tipo PAES
                        </h2>
                        <p className="text-[17px]">
                            Organiza tus preguntas por eje temático y nivel de dificultad. Reutiliza
                            preguntas de años anteriores y mide el índice de discriminación de cada
                            ítem con métricas avanzadas.
                        </p>
                    </section>

                    <section className="border-border rounded-[22px] border bg-white p-10 shadow-sm">
                        <h3 className="font-display text-ink mb-6 text-[22px] font-medium">
                            Funciones para Preus:
                        </h3>
                        <ul className="space-y-4">
                            {[
                                [
                                    'Ranking instantáneo',
                                    'Los alumnos compiten y ven su posición al momento de terminar.',
                                ],
                                [
                                    'Análisis de distractores',
                                    'Entiende por qué los alumnos están marcando la opción incorrecta.',
                                ],
                                [
                                    'Reportes por sede',
                                    'Compara el rendimiento entre tus distintas sucursales de forma automática.',
                                ],
                            ].map(([title, desc]) => (
                                <li key={title} className="flex items-start gap-4">
                                    <div className="bg-primary/10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                                        <Check className="text-primary size-3.5" strokeWidth={3} />
                                    </div>
                                    <div className="text-[15px]">
                                        <strong className="text-ink font-bold">{title}:</strong>{' '}
                                        {desc}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </L3SubpageLayout>
            <L3CTA />
        </>
    );
}
