import { L3SubpageLayout } from '@/features/landing/components/L3SubpageLayout';
import { L3CTA } from '@/features/landing/components/L3CTA';

export const dynamic = 'force-static';

export default function UniversidadesPage() {
    return (
        <>
            <L3SubpageLayout
                tag="AUDIENCIAS · UNIVERSIDADES"
                title="Evaluación académica de nivel superior."
                description="Desde cátedras masivas hasta exámenes de grado. Seguridad, integridad y flexibilidad para instituciones de educación superior."
            >
                <div className="space-y-12 text-ink-dim leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-ink mb-4">Integración y Escalabilidad</h2>
                        <p>
                            Diseñado para integrarse con sistemas de gestión académica y LMS. Aulika actúa como el motor de evaluación especializado que tu universidad necesita.
                        </p>
                    </section>
                    
                    <section>
                        <h2 className="text-2xl font-bold text-ink mb-4">Integridad Académica</h2>
                        <p>
                            Herramientas avanzadas para prevenir el fraude: monitoreo de actividad, bloqueo de navegadores y marcas de agua digitales en las preguntas.
                        </p>
                    </section>

                    <section className="bg-white p-8 rounded-2xl border border-border shadow-sm">
                        <h3 className="text-xl font-bold text-ink mb-3">Para Facultades y Escuelas:</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Rúbricas digitales:</strong> Evalúa preguntas abiertas y proyectos con criterios estandarizados.</li>
                            <li><strong>Múltiples examinadores:</strong> Gestión de roles para ayudantes, profesores y coordinadores.</li>
                            <li><strong>Auditoría completa:</strong> Registro detallado de cada acción realizada durante el examen.</li>
                        </ul>
                    </section>
                </div>
            </L3SubpageLayout>
            <L3CTA />
        </>
    );
}
