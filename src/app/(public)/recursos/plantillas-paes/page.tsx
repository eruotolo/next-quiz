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
                <div className="space-y-16 text-ink-dim leading-relaxed">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="bg-white p-10 rounded-[22px] border border-border shadow-sm flex flex-col">
                            <h2 className="font-display text-[24px] font-medium text-ink mb-4">Preguntas Masivas</h2>
                            <p className="text-[15px] mb-8 flex-1">
                                Usa nuestra plantilla estandarizada para cargar cientos de preguntas en segundos. Soporta opciones múltiples, distractores y niveles de dificultad configurables.
                            </p>
                            <Link 
                                href="/templates/Plantilla_Preguntas_Aulika.csv" 
                                download 
                                prefetch={false}
                                className="flex items-center justify-between p-4 bg-paper-warm rounded-xl border border-border group hover:border-primary transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-white rounded-lg flex items-center justify-center border border-border">
                                        <Download className="size-5 text-ink-dim group-hover:text-primary transition-colors" />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-ink">Plantilla_Preguntas.csv</p>
                                        <p className="text-[11px] text-mute font-mono">CSV · 2KB</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Descargar</span>
                            </Link>
                        </section>
                        
                        <section className="bg-white p-10 rounded-[22px] border border-border shadow-sm flex flex-col">
                            <h2 className="font-display text-[24px] font-medium text-ink mb-4">Listado de Alumnos</h2>
                            <p className="text-[15px] mb-8 flex-1">
                                Carga tu lista de cursos completa para crear las sesiones de examen rápidamente. Solo necesitas el RUT, nombre y correo electrónico del estudiante para el enrolamiento.
                            </p>
                            <Link 
                                href="/templates/Formato_Lista_Cursos.csv" 
                                download 
                                prefetch={false}
                                className="flex items-center justify-between p-4 bg-paper-warm rounded-xl border border-border group hover:border-primary transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-white rounded-lg flex items-center justify-center border border-border">
                                        <Download className="size-5 text-ink-dim group-hover:text-primary transition-colors" />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-ink">Formato_Lista_Cursos.csv</p>
                                        <p className="text-[11px] text-mute font-mono">CSV · 1KB</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Descargar</span>
                            </Link>
                        </section>
                    </div>

                    <div className="bg-ink text-white p-10 rounded-[22px] relative overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-size-[20px_20px]" />
                        <h3 className="font-display text-[20px] font-medium mb-2">Tip de Importación:</h3>
                        <p className="text-white/60 text-[15px] leading-relaxed">
                            Asegúrate de no modificar los encabezados de la primera fila. El sistema utiliza estos nombres de columna para mapear los datos correctamente a tu banco de preguntas.
                        </p>
                    </div>
                </div>
            </L3SubpageLayoutPAES>
            <L3CTA />
        </>
    );
}
