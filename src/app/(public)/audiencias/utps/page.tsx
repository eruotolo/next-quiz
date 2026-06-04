import { L3SubpageLayout } from '@/features/landing/components/L3SubpageLayout';
import { L3CTA } from '@/features/landing/components/L3CTA';

export const dynamic = 'force-static';

export default function UTPsPage() {
    return (
        <>
            <L3SubpageLayout
                tag="AUDIENCIAS · GESTIÓN"
                title="Herramientas para Unidades Técnico Pedagógicas."
                description="Centraliza la evaluación de tu institución, estandariza criterios y obtén reportes de cobertura curricular automáticos."
            >
                <div className="text-ink-dim space-y-12 leading-relaxed">
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Supervisión en Tiempo Real
                        </h2>
                        <p>
                            Observa cuántas evaluaciones se están aplicando en el momento y accede a
                            los resultados consolidados por departamento o nivel sin tener que
                            esperar a que los profesores entreguen sus planillas.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Estandarización de Evaluaciones
                        </h2>
                        <p>
                            Crea "exámenes maestros" que pueden ser aplicados por distintos
                            profesores a diferentes paralelos, garantizando que todos los alumnos
                            sean evaluados bajo el mismo estándar institucional.
                        </p>
                    </section>
                </div>
            </L3SubpageLayout>
            <L3CTA />
        </>
    );
}
