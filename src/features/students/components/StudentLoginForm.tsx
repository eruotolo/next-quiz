'use client';

import type * as React from 'react';
import { validateStudent } from '@/features/students/actions/student-auth';
import { Button } from '@/shared/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useActionState } from 'react';

const initialState = { error: undefined };

export function StudentLoginForm(): React.JSX.Element {
    const [state, action, isPending] = useActionState(validateStudent, initialState);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <span className="text-mute font-mono text-[11px] tracking-[0.1em] uppercase">
                    Acceso estudiante
                </span>
                <h1 className="font-display text-ink mt-2 text-[38px] leading-none font-semibold tracking-[-0.03em]">
                    Hola, identificate.
                </h1>
                <p className="text-ink-dim mt-2 text-[14px] leading-relaxed">
                    Ingresá tu RUT o email para acceder al examen disponible.
                </p>
            </div>

            {/* Form */}
            <form action={action} className="space-y-3">
                {/* RUT/Email input with prefix */}
                <div className="border-border focus-within:border-primary focus-within:ring-primary/20 flex h-[46px] items-center overflow-hidden rounded-[8px] border bg-white transition-colors focus-within:ring-2">
                    <span className="border-border bg-paper-warm text-mute flex h-full shrink-0 items-center border-r px-3 font-mono text-[10px] tracking-[0.08em] uppercase">
                        RUT / Email
                    </span>
                    <input
                        name="credential"
                        type="text"
                        placeholder="12.345.678-9 o alumno@correo.cl"
                        disabled={isPending}
                        autoComplete="off"
                        className="text-ink placeholder:text-mute/50 flex-1 bg-transparent px-3 text-[14px] outline-none disabled:opacity-60"
                    />
                </div>

                {/* Error */}
                {state?.error && (
                    <div className="bg-danger-wash text-destructive flex items-center gap-2 rounded-[8px] px-4 py-3 text-[13px]">
                        <span className="bg-destructive flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white">
                            !
                        </span>
                        {state.error}
                    </div>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isPending}
                    className="mt-1 w-full"
                >
                    {isPending ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <>
                            Entrar al examen
                            <ArrowRight className="size-4" />
                        </>
                    )}
                </Button>
            </form>

            {/* Admin link */}
            <div className="bg-paper-warm rounded-[8px] px-4 py-3 text-center">
                <p className="text-ink-dim text-[12px]">
                    ¿Sos docente?{' '}
                    <Link href="/login" className="text-primary font-medium">
                        Panel administrativo →
                    </Link>
                </p>
            </div>
        </div>
    );
}
