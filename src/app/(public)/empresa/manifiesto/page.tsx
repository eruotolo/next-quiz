import { L3SubpageLayout } from '@/features/landing/components/L3SubpageLayout';
import { L3CTA } from '@/features/landing/components/L3CTA';

export const dynamic = 'force-static';

export default function ManifiestoPage() {
    return (
        <>
            <L3SubpageLayout
                tag="EMPRESA · VALORES"
                title="Nuestro Manifiesto."
                description="Creemos que la tecnología debe estar al servicio del aprendizaje, no de la burocracia académica."
            >
                <div className="text-ink-dim space-y-12 leading-relaxed">
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">La Educación es Humana</h2>
                        <p>
                            Aulika no busca reemplazar al profesor, sino liberarlo de las tareas
                            repetitivas. Queremos que pases menos tiempo corrigiendo y más tiempo
                            enseñando.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">Integridad por Diseño</h2>
                        <p>
                            Una evaluación justa es un derecho de los estudiantes. Construimos
                            herramientas que garantizan que el esfuerzo personal sea lo único que
                            cuente.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">Soberanía de Datos</h2>
                        <p>
                            Los datos de los estudiantes son sagrados. Cumplimos con los más altos
                            estándares de protección de datos en Chile, asegurando que la
                            información nunca salga del control de la institución.
                        </p>
                    </section>

                    <div className="border-border font-display text-ink border-t pt-8 text-xl italic">
                        "Por un aula sin papel, pero con más sentido."
                    </div>
                </div>
            </L3SubpageLayout>
            <L3CTA />
        </>
    );
}
