'use client';

import { validateStudent } from '@/actions/student-auth';
import { RutInput } from '@/components/inputs/RutInput';
import { Button } from '@/components/ui/button';
import { GraduationCap, Loader2 } from 'lucide-react';
import { LogoMark } from '@/components/ui/logo';
import Link from 'next/link';
import { useActionState } from 'react';

const initialState = { error: undefined, resultId: undefined };

export default function StudentLoginPage() {
    const [state, action, isPending] = useActionState(validateStudent, initialState);

    return (
        <div className="flex min-h-screen flex-col bg-[linear-gradient(135deg,#e6f1fe_0%,#ffffff_50%,#f0f7ff_100%)]">
            {/* Header */}
            <header className="flex items-center gap-3 px-8 py-6">
                <LogoMark size={36} />
                <span className="text-lg font-bold text-foreground">EduNext Quiz</span>
            </header>

            {/* Card */}
            <main className="flex flex-1 items-center justify-center px-4 py-12">
                <div className="w-full max-w-[420px]">
                    <div className="rounded-[18px] border border-border bg-white p-10 shadow-[0_24px_64px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.03)]">
                        {/* Icon */}
                        <div className="mb-8 flex flex-col items-center gap-3">
                            <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-primary/10">
                                <GraduationCap size={32} className="text-primary" />
                            </div>
                            <div className="text-center">
                                <h1 className="text-2xl font-extrabold text-foreground">
                                    Ingresar al examen
                                </h1>
                                <p className="mt-1 max-w-[280px] text-[13px] text-muted-foreground">
                                    Ingresá tu RUT para acceder al examen activo de tu grupo
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form action={action} className="flex flex-col gap-6">
                            <RutInput
                                name="rut"
                                label="Tu RUT"
                                labelPlacement="outside"
                                placeholder="12.345.678-9"
                                isDisabled={isPending}
                            />

                            {state?.error && (
                                <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                                    <span className="bg-destructive mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                                        !
                                    </span>
                                    <p className="text-sm text-destructive">{state.error}</p>
                                </div>
                            )}

                            {state?.resultId && (
                                <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-center shadow-sm">
                                    <p className="mb-2 text-sm font-medium text-success">
                                        Ya completaste este examen.
                                    </p>
                                    <Link
                                        href={`/examen/resultado/${state.resultId}`}
                                        className="text-sm font-bold text-primary hover:underline"
                                    >
                                        Ver tu resultado →
                                    </Link>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isPending}
                                size="lg"
                                className="mt-2 w-full rounded-full font-bold shadow-lg shadow-primary/20"
                            >
                                {isPending && <Loader2 className="animate-spin" />}
                                Comenzar examen
                            </Button>
                        </form>
                    </div>

                    {/* Back */}
                    <p className="mt-6 text-center text-[13px] text-muted-foreground">
                        ¿Sos administrador?{' '}
                        <Link href="/admin/login" className="font-medium text-primary">
                            Accedé aquí
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
