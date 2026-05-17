import type * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export const metadata: Metadata = {
    title: 'Pago no completado · Aulika',
};

export default function DocenteErrorPage(): React.JSX.Element {
    return (
        <div className="flex flex-col items-center gap-5 py-8 text-center">
            <XCircle className="size-12 text-destructive" />
            <div>
                <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">
                    El pago no fue completado
                </h1>
                <p className="mt-2 text-[14px] text-ink-dim">
                    Podés volver a intentarlo o contactarnos si necesitás ayuda.
                </p>
            </div>
            <div className="flex gap-3">
                <Button variant="ink" asChild>
                    <Link href="/registro/docente">Intentar de nuevo</Link>
                </Button>
                <Button variant="ghost" asChild>
                    <Link href="/">Volver al inicio</Link>
                </Button>
            </div>
        </div>
    );
}
