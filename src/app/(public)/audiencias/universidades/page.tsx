import type { Metadata } from 'next';
import { L3SubpageLayout } from '@/features/landing/components/L3SubpageLayout';
import { L3CTA } from '@/features/landing/components/L3CTA';

export const dynamic = 'force-static';

export const metadata: Metadata = {
    title: 'Plataforma de Evaluación para Universidades e Institutos',
    description:
        'Evaluaciones en línea para universidades, institutos profesionales y CFT en Chile. Gestión de estudiantes por RUT, banco de preguntas por ramo y análisis de resultados por cohorte.',
    alternates: { canonical: 'https://www.aulika.cl/audiencias/universidades' },
    openGraph: {
        title: 'Plataforma de Evaluación para Universidades | Aulika',
        description:
            'Escala tus evaluaciones sin límites. Integridad académica, múltiples roles y auditoría completa de cada examen.',
        url: 'https://www.aulika.cl/audiencias/universidades',
    },
};

export default function UniversidadesPage() {
    return (
        <>
            <L3SubpageLayout
                tag="AUDIENCIAS · UNIVERSIDADES"
                title="Evaluación académica de nivel superior."
                description="Desde cátedras masivas hasta exámenes de grado. Seguridad, integridad y flexibilidad para instituciones de educación superior."
            >
                <div className="text-ink-dim space-y-12 leading-relaxed">
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Integración y Escalabilidad
                        </h2>
                        <p>
                            Diseñado para integrarse con sistemas de gestión académica y LMS. Aulika
                            actúa como el motor de evaluación especializado que tu universidad
                            necesita.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">Integridad Académica</h2>
                        <p>
                            Herramientas avanzadas para prevenir el fraude: monitoreo de actividad,
                            bloqueo de navegadores y marcas de agua digitales en las preguntas.
                        </p>
                    </section>

                    <section className="border-border rounded-2xl border bg-white p-8 shadow-sm">
                        <h3 className="text-ink mb-3 text-xl font-bold">
                            Para Facultades y Escuelas:
                        </h3>
                        <ul className="list-disc space-y-2 pl-5">
                            <li>
                                <strong>Rúbricas digitales:</strong> Evalúa preguntas abiertas y
                                proyectos con criterios estandarizados.
                            </li>
                            <li>
                                <strong>Múltiples examinadores:</strong> Gestión de roles para
                                ayudantes, profesores y coordinadores.
                            </li>
                            <li>
                                <strong>Auditoría completa:</strong> Registro detallado de cada
                                acción realizada durante el examen.
                            </li>
                        </ul>
                    </section>
                </div>
            </L3SubpageLayout>
            <L3CTA />
        </>
    );
}
