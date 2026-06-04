import { Tag } from '@/shared/components/ui/badge';

const SECURITY_FEATURES = [
    {
        t: 'Acceso Único y Validado',
        d: 'Aseguramos que cada estudiante ingrese con su RUT oficial o Email. El sistema valida la identidad al instante, evitando duplicidad de perfiles o errores accidentales en el ingreso.',
    },
    {
        t: 'Sesiones Blindadas',
        d: 'La conexión del alumno es privada y exclusiva para su evaluación. El acceso se activa solo durante el examen y se cierra automáticamente al finalizar, garantizando total privacidad.',
    },
    {
        t: 'Protección de Integridad',
        d: 'Herramientas inteligentes para evitar copias: bloqueo de cambio de pestañas, orden aleatorio de opciones y monitoreo de actividad en tiempo real durante toda la prueba.',
    },
    {
        t: 'Garantía de No Pérdida',
        d: 'Guardamos cada respuesta al segundo. Si hay un corte de internet o energía, el progreso queda respaldado para que el alumno retome exactamente donde quedó.',
    },
];

export function L3Security(): React.JSX.Element {
    return (
        <section className="bg-ink overflow-hidden py-24 text-white md:py-32" id="seguridad">
            <div className="mx-auto max-w-[1400px] px-6 md:px-14">
                <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
                    <div className="space-y-8">
                        <Tag tone="lime" size="sm" className="border-none font-bold shadow-sm">
                            SEGURIDAD
                        </Tag>
                        <h2 className="font-display text-[48px] leading-[1] font-medium tracking-[-0.03em] text-white md:text-[56px]">
                            Diseñado para que el examen <br />
                            <em className="text-lime italic not-italic">sea de verdad</em>.
                        </h2>
                        <p className="max-w-[420px] text-[17px] leading-relaxed text-white/60">
                            La seguridad es la base de nuestra confianza. Cada etapa, desde el
                            ingreso hasta la entrega final, está diseñada para garantizar una
                            evaluación justa, transparente y con datos protegidos.
                        </p>

                        <div className="flex flex-wrap gap-3 pt-4">
                            <Tag
                                tone="ink"
                                className="h-7 border-white/10 bg-white/5 px-3 text-[11px] font-bold"
                            >
                                <span className="text-lime mr-2">●</span> Servidores en Chile
                            </Tag>
                            <Tag
                                tone="ink"
                                className="h-7 border-white/10 bg-white/5 px-3 text-[11px] font-bold"
                            >
                                <span className="text-lime mr-2">●</span> Conexión Cifrada
                            </Tag>
                            <Tag
                                tone="ink"
                                className="h-7 border-white/10 bg-white/5 px-3 text-[11px] font-bold"
                            >
                                <span className="text-lime mr-2">●</span> Cumplimiento Ley de Datos
                            </Tag>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {SECURITY_FEATURES.map((feat, i) => (
                            <div
                                key={feat.t}
                                className="group rounded-[22px] border border-white/10 bg-white/5 p-7 transition-all hover:bg-white/[0.08]"
                            >
                                <div className="text-lime mb-3 font-mono text-[11px] font-bold tracking-widest opacity-60 transition-opacity group-hover:opacity-100">
                                    /{String(i + 1).padStart(2, '0')}
                                </div>
                                <h4 className="font-display mb-2.5 text-[20px] font-medium tracking-tight text-white">
                                    {feat.t}
                                </h4>
                                <p className="text-[13.5px] leading-[1.6] text-white/50">
                                    {feat.d}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
