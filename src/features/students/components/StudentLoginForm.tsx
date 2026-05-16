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
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-mute">
                    Acceso estudiante
                </span>
                <h1 className="mt-2 font-display text-[38px] font-semibold leading-none tracking-[-0.03em] text-ink">
                    Hola, identificate.
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">
                    Ingresá tu RUT o email para acceder al examen disponible.
                </p>
            </div>

            {/* Form */}
            <form action={action} className="space-y-3">
                {/* RUT/Email input with prefix */}
                <div className="flex h-[46px] items-center overflow-hidden rounded-[8px] border border-border bg-white transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                    <span className="flex h-full shrink-0 items-center border-r border-border bg-paper-warm px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-mute">
                        RUT / Email
                    </span>
                    <input
                        name="credential"
                        type="text"
                        placeholder="12.345.678-9 o alumno@correo.cl"
                        disabled={isPending}
                        autoComplete="off"
                        className="flex-1 bg-transparent px-3 text-[14px] text-ink outline-none placeholder:text-mute/50 disabled:opacity-60"
                    />
                </div>

                {/* Error */}
                {state?.error && (
                    <div className="flex items-center gap-2 rounded-[8px] bg-danger-wash px-4 py-3 text-[13px] text-destructive">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-white">
                            !
                        </span>
                        {state.error}
                    </div>
                )}

                <Button type="submit" variant="primary" size="lg" disabled={isPending} className="w-full mt-1">
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
            <div className="rounded-[8px] bg-paper-warm px-4 py-3 text-center">
                <p className="text-[12px] text-ink-dim">
                    ¿Sos docente?{' '}
                    <Link href="/login" className="font-medium text-primary">
                        Panel administrativo →
                    </Link>
                </p>
            </div>
        </div>
    );
}
