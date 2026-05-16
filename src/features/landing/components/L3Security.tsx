import { Tag } from '@/shared/components/ui/badge';

const SECURITY_FEATURES = [
    { 
        t: 'Acceso Único y Validado', 
        d: 'Aseguramos que cada estudiante ingrese con su RUT oficial o Email. El sistema valida la identidad al instante, evitando duplicidad de perfiles o errores accidentales en el ingreso.'
    },
    { 
        t: 'Sesiones Blindadas', 
        d: 'La conexión del alumno es privada y exclusiva para su evaluación. El acceso se activa solo durante el examen y se cierra automáticamente al finalizar, garantizando total privacidad.' 
    },
    { 
        t: 'Protección de Integridad', 
        d: 'Herramientas inteligentes para evitar copias: bloqueo de cambio de pestañas, orden aleatorio de opciones y monitoreo de actividad en tiempo real durante toda la prueba.' 
    },
    { 
        t: 'Garantía de No Pérdida', 
        d: 'Guardamos cada respuesta al segundo. Si hay un corte de internet o energía, el progreso queda respaldado para que el alumno retome exactamente donde quedó.' 
    },
];

export function L3Security(): React.JSX.Element {
    return (
        <section className="bg-ink py-24 md:py-32 text-white overflow-hidden" id="seguridad">
            <div className="mx-auto max-w-[1400px] px-6 md:px-14">
                <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-16 lg:gap-24 items-start">
                    <div className="space-y-8">
                        <Tag tone="lime" size="sm" className="font-bold border-none shadow-sm">SEGURIDAD</Tag>
                        <h2 className="font-display text-[48px] md:text-[56px] font-medium tracking-[-0.03em] leading-[1] text-white">
                            Diseñado para que el examen <br />
                            <em className="text-lime not-italic italic">sea de verdad</em>.
                        </h2>
                        <p className="text-[17px] leading-relaxed text-white/60 max-w-[420px]">
                            La seguridad es la base de nuestra confianza. Cada etapa, desde el ingreso hasta la entrega final, está diseñada para garantizar una evaluación justa, transparente y con datos protegidos.
                        </p>
                        
                        <div className="flex flex-wrap gap-3 pt-4">
                            <Tag tone="ink" className="bg-white/5 border-white/10 font-bold text-[11px] h-7 px-3">
                                <span className="text-lime mr-2">●</span> Servidores en Chile
                            </Tag>
                            <Tag tone="ink" className="bg-white/5 border-white/10 font-bold text-[11px] h-7 px-3">
                                <span className="text-lime mr-2">●</span> Conexión Cifrada
                            </Tag>
                            <Tag tone="ink" className="bg-white/5 border-white/10 font-bold text-[11px] h-7 px-3">
                                <span className="text-lime mr-2">●</span> Cumplimiento Ley de Datos
                            </Tag>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {SECURITY_FEATURES.map((feat, i) => (
                            <div 
                                key={feat.t} 
                                className="p-7 bg-white/5 border border-white/10 rounded-[22px] transition-all hover:bg-white/[0.08] group"
                            >
                                <div className="font-mono text-[11px] font-bold text-lime tracking-widest mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                    /{String(i + 1).padStart(2, '0')}
                                </div>
                                <h4 className="font-display text-[20px] font-medium tracking-tight text-white mb-2.5">
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
