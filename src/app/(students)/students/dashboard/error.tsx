'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
            <div className="bg-danger-wash flex size-12 items-center justify-center rounded-full">
                <AlertCircle className="text-destructive size-6" />
            </div>
            <div>
                <h2 className="text-ink mb-1 text-[17px] font-semibold">
                    Error al cargar el dashboard
                </h2>
                <p className="text-mute max-w-sm text-[13.5px]">
                    {error.message ?? 'Ocurrió un error inesperado. Intenta recargar la página.'}
                </p>
            </div>
            <Button onClick={reset} variant="outline" size="sm">
                Reintentar
            </Button>
        </div>
    );
}
