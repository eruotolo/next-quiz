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
                <div className="space-y-12 text-ink-dim leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-ink mb-4">La Educación es Humana</h2>
                        <p>
                            Aulika no busca reemplazar al profesor, sino liberarlo de las tareas repetitivas. Queremos que pases menos tiempo corrigiendo y más tiempo enseñando.
                        </p>
                    </section>
                    
                    <section>
                        <h2 className="text-2xl font-bold text-ink mb-4">Integridad por Diseño</h2>
                        <p>
                            Una evaluación justa es un derecho de los estudiantes. Construimos herramientas que garantizan que el esfuerzo personal sea lo único que cuente.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-ink mb-4">Soberanía de Datos</h2>
                        <p>
                            Los datos de los estudiantes son sagrados. Cumplimos con los más altos estándares de protección de datos en Chile, asegurando que la información nunca salga del control de la institución.
                        </p>
                    </section>

                    <div className="pt-8 border-t border-border font-display italic text-xl text-ink">
                        "Por un aula sin papel, pero con más sentido."
                    </div>
                </div>
            </L3SubpageLayout>
            <L3CTA />
        </>
    );
}
