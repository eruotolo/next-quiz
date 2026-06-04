import Link from 'next/link';
import { L3SubpageLayoutPAES } from '@/features/landing/components/L3SubpageLayoutPAES';
import { L3CTA } from '@/features/landing/components/L3CTA';
import { Download } from 'lucide-react';

export const dynamic = 'force-static';

export default function PlantillasPAESPage() {
    return (
        <>
            <L3SubpageLayoutPAES
                tag="RECURSOS · DESCARGAS"
                title="Plantillas y Formatos."
                description="Descarga los formatos oficiales para importar tus bancos de preguntas y ensayos tipo PAES a nuestra plataforma de forma masiva."
            >
                <div className="text-ink-dim space-y-16 leading-relaxed">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        <section className="border-border flex flex-col rounded-[22px] border bg-white p-10 shadow-sm">
                            <h2 className="font-display text-ink mb-4 text-[24px] font-medium">
                                Preguntas Masivas
                            </h2>
                            <p className="mb-8 flex-1 text-[15px]">
                                Usa nuestra plantilla estandarizada para cargar cientos de preguntas
                                en segundos. Soporta opciones múltiples, distractores y niveles de
                                dificultad configurables.
                            </p>
                            <Link
                                href="/templates/Plantilla_Preguntas_Aulika.csv"
                                download
                                prefetch={false}
                                className="bg-paper-warm border-border group hover:border-primary flex items-center justify-between rounded-xl border p-4 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="border-border flex size-10 items-center justify-center rounded-lg border bg-white">
                                        <Download className="text-ink-dim group-hover:text-primary size-5 transition-colors" />
                                    </div>
                                    <div>
                                        <p className="text-ink text-[13px] font-bold">
                                            Plantilla_Preguntas.csv
                                        </p>
                                        <p className="text-mute font-mono text-[11px]">CSV · 2KB</p>
                                    </div>
                                </div>
                                <span className="text-primary text-[10px] font-bold tracking-widest uppercase">
                                    Descargar
                                </span>
                            </Link>
                        </section>

                        <section className="border-border flex flex-col rounded-[22px] border bg-white p-10 shadow-sm">
                            <h2 className="font-display text-ink mb-4 text-[24px] font-medium">
                                Listado de Alumnos
                            </h2>
                            <p className="mb-8 flex-1 text-[15px]">
                                Carga tu lista de cursos completa para crear las sesiones de examen
                                rápidamente. Solo necesitas el RUT, nombre y correo electrónico del
                                estudiante para el enrolamiento.
                            </p>
                            <Link
                                href="/templates/Formato_Lista_Cursos.csv"
                                download
                                prefetch={false}
                                className="bg-paper-warm border-border group hover:border-primary flex items-center justify-between rounded-xl border p-4 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="border-border flex size-10 items-center justify-center rounded-lg border bg-white">
                                        <Download className="text-ink-dim group-hover:text-primary size-5 transition-colors" />
                                    </div>
                                    <div>
                                        <p className="text-ink text-[13px] font-bold">
                                            Formato_Lista_Cursos.csv
                                        </p>
                                        <p className="text-mute font-mono text-[11px]">CSV · 1KB</p>
                                    </div>
                                </div>
                                <span className="text-primary text-[10px] font-bold tracking-widest uppercase">
                                    Descargar
                                </span>
                            </Link>
                        </section>
                    </div>

                    <div className="bg-ink relative overflow-hidden rounded-[22px] p-10 text-white">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-size-[20px_20px] opacity-[0.05]" />
                        <h3 className="font-display mb-2 text-[20px] font-medium">
                            Tip de Importación:
                        </h3>
                        <p className="text-[15px] leading-relaxed text-white/60">
                            Asegúrate de no modificar los encabezados de la primera fila. El sistema
                            utiliza estos nombres de columna para mapear los datos correctamente a
                            tu banco de preguntas.
                        </p>
                    </div>
                </div>
            </L3SubpageLayoutPAES>
            <L3CTA />
        </>
    );
}
