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
                <div className="bg-success/5 border-success/20 flex items-center justify-between rounded-[22px] border p-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-success size-2 animate-pulse rounded-full" />
                        <span className="font-display text-success text-[20px] font-medium">
                            Todos los sistemas operativos
                        </span>
                    </div>
                    <span className="text-mute font-mono text-[10px] font-bold tracking-[0.15em] uppercase">
                        Actualizado hace 2 min
                    </span>
                </div>

                <div className="divide-border border-border divide-y overflow-hidden rounded-[22px] border bg-white shadow-sm">
                    {[
                        ['Plataforma de Exámenes', 'Operacional'],
                        ['Panel de Control Docente', 'Operacional'],
                        ['API y Base de Datos', 'Operacional'],
                        ['Servicio de Corrección Automática', 'Operacional'],
                    ].map(([name, status]) => (
                        <div
                            key={name}
                            className="hover:bg-paper-warm/50 flex items-center justify-between p-6 transition-colors"
                        >
                            <span className="text-ink text-[15px] font-medium">{name}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-success text-[11px] font-bold tracking-widest uppercase">
                                    {status}
                                </span>
                                <div className="bg-success size-1.5 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </L3SubpageLayout>
    );
}
