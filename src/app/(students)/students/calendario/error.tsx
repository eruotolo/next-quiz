'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function CalendarioError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[calendario] render error', error);
    }, [error]);

    return (
        <div className="border-border bg-surface mx-auto flex max-w-md flex-col items-center gap-3 rounded-[16px] border p-8 text-center">
            <p className="text-mute font-mono text-[10px] font-bold tracking-[0.12em] uppercase">
                Error
            </p>
            <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.01em]">
                No pudimos cargar el calendario
            </h2>
            <p className="text-ink-dim text-[13.5px]">Reintentá en unos segundos.</p>
            <div className="mt-2 flex gap-2">
                <button
                    type="button"
                    onClick={reset}
                    className="bg-primary hover:bg-primary/90 rounded-full px-4 py-2 text-[13px] font-semibold text-white"
                >
                    Reintentar
                </button>
                <Link
                    href={'/calendario' as `/${string}`}
                    className="border-border hover:bg-paper-warm rounded-full border px-4 py-2 text-[13px] font-semibold"
                >
                    Recargar
                </Link>
            </div>
        </div>
    );
}
