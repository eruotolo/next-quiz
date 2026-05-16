import { L3SubpageLayout } from '@/features/landing/components/L3SubpageLayout';
import { L3CTA } from '@/features/landing/components/L3CTA';
import { Check } from 'lucide-react';

export const dynamic = 'force-static';

export default function PreuniversitariosPage() {
    return (
        <>
            <L3SubpageLayout
                tag="AUDIENCIAS · PREUNIVERSITARIOS"
                title="Simulacros PAES de alto rendimiento."
                description="Entendemos que el volumen y la precisión son clave. Aulika permite aplicar ensayos masivos con resultados en tiempo real y rankings de desempeño."
            >
                <div className="space-y-16 text-ink-dim leading-relaxed">
                    <section>
                        <h2 className="font-display text-[28px] font-medium text-ink mb-6">Ensayos Masivos</h2>
                        <p className="text-[17px]">
                            Soporta a miles de alumnos rindiendo simultáneamente sin latencia. Nuestra arquitectura está preparada para las 'horas punta' de los ensayos nacionales, garantizando estabilidad total.
                        </p>
                    </section>
                    
                    <section>
                        <h2 className="font-display text-[28px] font-medium text-ink mb-6">Banco tipo PAES</h2>
                        <p className="text-[17px]">
                            Organiza tus preguntas por eje temático y nivel de dificultad. Reutiliza preguntas de años anteriores y mide el índice de discriminación de cada ítem con métricas avanzadas.
                        </p>
                    </section>

                    <section className="bg-white p-10 rounded-[22px] border border-border shadow-sm">
                        <h3 className="font-display text-[22px] font-medium text-ink mb-6">Funciones para Preus:</h3>
                        <ul className="space-y-4">
                            {[
                                ['Ranking instantáneo', 'Los alumnos compiten y ven su posición al momento de terminar.'],
                                ['Análisis de distractores', 'Entiende por qué los alumnos están marcando la opción incorrecta.'],
                                ['Reportes por sede', 'Compara el rendimiento entre tus distintas sucursales de forma automática.'],
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
