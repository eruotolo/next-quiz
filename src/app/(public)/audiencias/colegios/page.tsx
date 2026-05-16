import { L3SubpageLayout } from '@/features/landing/components/L3SubpageLayout';
import { L3CTA } from '@/features/landing/components/L3CTA';
import { Check } from 'lucide-react';

export const dynamic = 'force-static';

export default function ColegiosPage() {
    return (
        <>
            <L3SubpageLayout
                tag="AUDIENCIAS · COLEGIOS"
                title="Diseñado para el ritmo del aula escolar."
                description="Desde 1° básico hasta IV° medio, Aulika se adapta a la realidad de los colegios chilenos, facilitando la evaluación sin aumentar la carga docente."
            >
                <div className="space-y-16 text-ink-dim leading-relaxed">
                    <section>
                        <h2 className="font-display text-[28px] font-medium text-ink mb-6">Evaluación por Unidad</h2>
                        <p className="text-[17px]">
                            Los colegios necesitan medir el progreso paso a paso. Aulika permite crear evaluaciones cortas de unidad que se corrigen al instante, permitiendo al profesor retroalimentar en la misma clase.
                        </p>
                    </section>
                    
                    <section>
                        <h2 className="font-display text-[28px] font-medium text-ink mb-6">Integración con UTP</h2>
                        <p className="text-[17px]">
                            Sabemos que la Unidad Técnico Pedagógica requiere reportes claros. Nuestra plataforma genera archivos exportables compatibles con la mayoría de los libros de clases digitales usados en Chile.
                        </p>
                    </section>

                    <section className="bg-white p-10 rounded-[22px] border border-border shadow-sm">
                        <h3 className="font-display text-[22px] font-medium text-ink mb-6">Beneficios clave para el colegio:</h3>
                        <ul className="space-y-4">
                            {[
                                ['Cero papel', 'Ahorro inmediato en fotocopias e insumos escolares.'],
                                ['Resultados inmediatos', 'El alumno conoce su desempeño al finalizar la evaluación.'],
                                ['Análisis por eje', 'Identifica qué objetivos de aprendizaje necesitan refuerzo real.'],
                            ].map(([title, desc]) => (
                                <li key={title} className="flex items-start gap-4">
                                    <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="size-3.5 text-primary" strokeWidth={3} />
                                    </div>
                                    <div className="text-[15px]">
                                        <strong className="text-ink font-bold">{title}:</strong> {desc}
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
