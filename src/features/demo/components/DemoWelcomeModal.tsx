'use client';

import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { AlertTriangle, Building2, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

const STORAGE_KEY = 'aulika-demo-welcome-seen';

interface InfoItemProps {
    icon: ComponentType<{ size?: number; className?: string }>;
    iconClass: string;
    title: string;
    desc: string;
}

function InfoItem({ icon: Icon, iconClass, title, desc }: InfoItemProps) {
    return (
        <div className="flex items-start gap-3 py-3.5">
            <Icon size={16} className={`mt-0.5 shrink-0 ${iconClass}`} />
            <div className="min-w-0">
                <p className="text-ink text-[13px] font-semibold">{title}</p>
                <p className="text-mute mt-0.5 text-[12px] leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

export function DemoWelcomeModal() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!sessionStorage.getItem(STORAGE_KEY)) {
            setOpen(true);
        }
    }, []);

    function handleClose(): void {
        sessionStorage.setItem(STORAGE_KEY, '1');
        setOpen(false);
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) handleClose();
            }}
        >
            <DialogContent className="max-w-[400px]">
                <DialogHeader>
                    <div className="bg-ink mb-3 flex h-10 w-10 items-center justify-center rounded-[10px]">
                        <Sparkles size={17} className="text-white" />
                    </div>
                    <DialogTitle className="font-display text-ink text-[20px] font-bold tracking-tight">
                        Bienvenido al modo demo
                    </DialogTitle>
                    <p className="text-mute text-[13px] leading-relaxed">
                        Explorás Aulika como{' '}
                        <strong className="text-ink font-semibold">Administrador</strong> de una
                        institución de prueba.
                    </p>
                </DialogHeader>

                <div className="divide-border divide-y">
                    <InfoItem
                        icon={ShieldCheck}
                        iconClass="text-primary"
                        title="Acceso completo de Administrador"
                        desc="Podés crear exámenes, gestionar grupos, ver resultados en vivo y explorar todas las funciones del panel."
                    />
                    <InfoItem
                        icon={Trash2}
                        iconClass="text-destructive"
                        title="Datos temporales"
                        desc="Todo lo que crees se elimina automáticamente al cerrar sesión. La demo no persiste ningún dato real."
                    />
                    <InfoItem
                        icon={AlertTriangle}
                        iconClass="text-amber-500"
                        title="Solo para exploración"
                        desc="No puede usarse con fines comerciales ni para gestionar datos de instituciones reales."
                    />
                    <InfoItem
                        icon={Building2}
                        iconClass="text-mute"
                        title="Institución preconfigurada"
                        desc="Grupos, alumnos y materias de ejemplo ya están listos para que explores sin configurar nada."
                    />
                </div>

                <Button variant="ink" size="md" className="mt-1 w-full" onClick={handleClose}>
                    Entendido, comenzar demo
                </Button>
            </DialogContent>
        </Dialog>
    );
}
