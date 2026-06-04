import { L3SubpageLayout } from '@/features/landing/components/L3SubpageLayout';
import { L3CTA } from '@/features/landing/components/L3CTA';

export const dynamic = 'force-static';

export default function HistoriaPage() {
    return (
        <>
            <L3SubpageLayout
                tag="EMPRESA · ORIGEN"
                title="Nuestra Historia."
                description="Desde el sur de Chile para todo el país. Aulika nació de una necesidad real detectada en las aulas de Chiloé."
            >
                <div className="text-ink-dim space-y-12 leading-relaxed">
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">El Inicio en Castro</h2>
                        <p>
                            Todo comenzó en Castro, Chiloé. Al observar la enorme cantidad de papel
                            y tiempo que los profesores invertían en la logística de las pruebas,
                            decidimos que era hora de crear una herramienta que fuera simple,
                            robusta y, sobre todo, justa para el contexto chileno.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            De un prototipo a una plataforma nacional
                        </h2>
                        <p>
                            Lo que empezó como un apoyo para un par de liceos locales, pronto
                            demostró ser una solución necesaria en todo Chile. Crow Advance, la
                            empresa detrás de Aulika, se fundó con la misión de descentralizar la
                            tecnología educativa de calidad.
                        </p>
                    </section>
                </div>
            </L3SubpageLayout>
            <L3CTA />
        </>
    );
}
