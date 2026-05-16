import { L3SubpageLayout } from '@/features/landing/components/L3SubpageLayout';

export const dynamic = 'force-static';

export default function EstadoPage() {
    return (
        <L3SubpageLayout
            tag="RECURSOS · STATUS"
            title="Estado del Sistema."
            description="Monitoreo en tiempo real de la disponibilidad y rendimiento de nuestros servicios críticos."
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between p-8 bg-success/5 border border-success/20 rounded-[22px]">
                    <div className="flex items-center gap-3">
                        <div className="size-2 bg-success rounded-full animate-pulse" />
                        <span className="font-display text-[20px] font-medium text-success">Todos los sistemas operativos</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-mute uppercase tracking-[0.15em]">Actualizado hace 2 min</span>
                </div>

                <div className="divide-y divide-border bg-white border border-border rounded-[22px] overflow-hidden shadow-sm">
                    {[
                        ['Plataforma de Exámenes', 'Operacional'],
                        ['Panel de Control Docente', 'Operacional'],
                        ['API y Base de Datos', 'Operacional'],
                        ['Servicio de Corrección Automática', 'Operacional'],
                    ].map(([name, status]) => (
                        <div key={name} className="p-6 flex justify-between items-center transition-colors hover:bg-paper-warm/50">
                            <span className="text-[15px] font-medium text-ink">{name}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-success uppercase tracking-widest">{status}</span>
                                <div className="size-1.5 bg-success rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </L3SubpageLayout>
    );
}
