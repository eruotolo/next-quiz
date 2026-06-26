import type { Metadata } from 'next';
import { L3SubpageLayout } from '@/features/landing/components/L3SubpageLayout';
import { L3CTA } from '@/features/landing/components/L3CTA';
import { Check } from 'lucide-react';

export const dynamic = 'force-static';

export const metadata: Metadata = {
    title: 'Evaluaciones Online para Colegios',
    description:
        'Sistema de evaluación digital para colegios chilenos. Corrección automática, banco de preguntas reutilizable y tablero en vivo para el UTP. Sin papel, sin fotocopias.',
    alternates: { canonical: 'https://www.aulika.cl/audiencias/colegios' },
    openGraph: {
        title: 'Evaluaciones Online para Colegios | Aulika',
        description:
            'Diseñado para el ritmo del aula escolar chilena. Resultados instantáneos y reportes compatibles con libros de clases digitales.',
        url: 'https://www.aulika.cl/audiencias/colegios',
    },
};

export default function ColegiosPage() {
    return (
        <>
            <L3SubpageLayout
                tag="AUDIENCIAS · COLEGIOS"
                title="Diseñado para el ritmo del aula escolar."
                description="Desde 1° básico hasta IV° medio, Aulika se adapta a la realidad de los colegios chilenos, facilitando la evaluación sin aumentar la carga docente."
            >
                <div className="text-ink-dim space-y-16 leading-relaxed">
                    <section>
                        <h2 className="font-display text-ink mb-6 text-[28px] font-medium">
                            Evaluación por Unidad
                        </h2>
                        <p className="text-[17px]">
                            Los colegios necesitan medir el progreso paso a paso. Aulika permite
                            crear evaluaciones cortas de unidad que se corrigen al instante,
                            permitiendo al profesor retroalimentar en la misma clase.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-display text-ink mb-6 text-[28px] font-medium">
                            Integración con UTP
                        </h2>
                        <p className="text-[17px]">
                            Sabemos que la Unidad Técnico Pedagógica requiere reportes claros.
                            Nuestra plataforma genera archivos exportables compatibles con la
                            mayoría de los libros de clases digitales usados en Chile.
                        </p>
                    </section>

                    <section className="border-border rounded-[22px] border bg-white p-10 shadow-sm">
                        <h3 className="font-display text-ink mb-6 text-[22px] font-medium">
                            Beneficios clave para el colegio:
                        </h3>
                        <ul className="space-y-4">
                            {[
                                [
                                    'Cero papel',
                                    'Ahorro inmediato en fotocopias e insumos escolares.',
                                ],
                                [
                                    'Resultados inmediatos',
                                    'El alumno conoce su desempeño al finalizar la evaluación.',
                                ],
                                [
                                    'Análisis por eje',
                                    'Identifica qué objetivos de aprendizaje necesitan refuerzo real.',
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
