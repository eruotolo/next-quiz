'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_SLUG } from '@/features/demo/lib/demo';

export function DemoLoginCard() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    const handleEnter = async (): Promise<void> => {
        setError(null);
        setIsPending(true);
        try {
            const result = await signIn('credentials', {
                email: DEMO_EMAIL,
                password: DEMO_PASSWORD,
                redirect: false,
            });
            if (result?.error) {
                setError('No se pudo iniciar el demo. Intenta de nuevo en unos segundos.');
                return;
            }
            router.replace(`/${DEMO_SLUG}`);
        } catch {
            setError('Ocurrió un error inesperado. Intenta de nuevo.');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <span className="text-mute font-mono text-[11px] tracking-[0.1em] uppercase">
                    Prueba Aulika
                </span>
                <h1 className="font-display text-ink mt-2 text-[38px] leading-none font-semibold tracking-[-0.03em]">
                    Modo demo
                </h1>
                <p className="text-ink-dim mt-2 text-[14px] leading-relaxed">
                    Entra a un panel de prueba con datos de ejemplo. Crea un examen y mira cómo
                    funciona. Lo que crees es temporal y se borra al cerrar sesión.
                </p>
            </div>

            {/* Credenciales visibles */}
            <div className="bg-paper-warm border-border space-y-2 rounded-[10px] border p-4">
                <div className="flex items-center justify-between">
                    <span className="text-mute font-mono text-[10px] tracking-[0.08em] uppercase">
                        Usuario
                    </span>
                    <span className="text-ink text-[13px] font-medium">{DEMO_EMAIL}</span>
                </div>
                <div className="border-border border-t" />
                <div className="flex items-center justify-between">
                    <span className="text-mute font-mono text-[10px] tracking-[0.08em] uppercase">
                        Contraseña
                    </span>
                    <span className="text-ink text-[13px] font-medium">{DEMO_PASSWORD}</span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-danger-wash text-destructive flex items-center gap-2 rounded-[8px] px-4 py-3 text-[13px]">
                    <span className="bg-destructive flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white">
                        !
                    </span>
                    {error}
                </div>
            )}

            {/* Entrar */}
            <Button
                variant="ink"
                size="lg"
                type="button"
                disabled={isPending}
                className="w-full"
                onClick={() => {
                    void handleEnter();
                }}
            >
                {isPending ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <>
                        <Sparkles className="size-4" />
                        Entrar al demo
                        <ArrowRight className="size-4" />
                    </>
                )}
            </Button>
        </div>
    );
}
