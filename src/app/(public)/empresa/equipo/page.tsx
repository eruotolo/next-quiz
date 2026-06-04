import { L3SubpageLayout } from '@/features/landing/components/L3SubpageLayout';
import { L3CTA } from '@/features/landing/components/L3CTA';

export const dynamic = 'force-static';

export default function EquipoPage() {
    return (
        <>
            <L3SubpageLayout
                tag="EMPRESA · PERSONAS"
                title="El equipo detrás de Aulika."
                description="Somos un grupo interdisciplinario de ingenieros, diseñadores y educadores comprometidos con la transformación digital del aula chilena."
            >
                <div className="text-ink-dim space-y-12 leading-relaxed">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        <div className="space-y-4">
                            <h3 className="text-ink text-xl font-bold">Ingeniería de Software</h3>
                            <p>
                                Especialistas en sistemas distribuidos y seguridad, encargados de
                                que Aulika nunca falle cuando miles de alumnos rinden al mismo
                                tiempo.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-ink text-xl font-bold">Diseño UX/UI</h3>
                            <p>
                                Enfocados en crear interfaces que hasta el profesor con menos
                                experiencia tecnológica pueda usar sin frustración.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-ink text-xl font-bold">Asesoría Pedagógica</h3>
                            <p>
                                Docentes activos que validan cada nueva funcionalidad para asegurar
                                que responda a las necesidades reales del currículum nacional.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-ink text-xl font-bold">
                                Soporte y Éxito del Cliente
                            </h3>
                            <p>
                                Ubicados en Santiago y Castro, listos para acompañar a las
                                instituciones en su proceso de adopción digital.
                            </p>
                        </div>
                    </div>
                </div>
            </L3SubpageLayout>
            <L3CTA />
        </>
    );
}
