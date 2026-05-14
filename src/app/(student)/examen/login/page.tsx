'use client';

import { validateStudent } from '@/features/students/actions/student-auth';
import { Button } from '@/shared/components/ui/button';
import { GraduationCap, Loader2 } from 'lucide-react';
import { LogoMark } from '@/shared/components/branding/logo';
import Link from 'next/link';
import { useActionState } from 'react';

const initialState = { error: undefined };

export default function StudentLoginPage() {
    const [state, action, isPending] = useActionState(validateStudent, initialState);

    return (
        <div className="flex min-h-screen flex-col bg-[linear-gradient(135deg,#e6f1fe_0%,#ffffff_50%,#f0f7ff_100%)]">
            {/* Header */}
            <header className="flex items-center gap-3 px-8 py-6">
                <LogoMark size={36} />
                <span className="text-foreground text-lg font-bold">EduNext Quiz</span>
            </header>

            {/* Card */}
            <main className="flex flex-1 items-center justify-center px-4 py-12">
                <div className="w-full max-w-[420px]">
                    <div className="border-border rounded-[18px] border bg-white p-10 shadow-[0_24px_64px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.03)]">
                        {/* Icon */}
                        <div className="mb-8 flex flex-col items-center gap-3">
                            <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-[18px]">
                                <GraduationCap size={32} className="text-primary" />
                            </div>
                            <div className="text-center">
                                <h1 className="text-foreground text-2xl font-extrabold">
                                    Ingresar al examen
                                </h1>
                                <p className="text-muted-foreground mt-1 max-w-[280px] text-[13px]">
                                    Ingresá tu RUT o email para acceder al examen activo de tu grupo
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form action={action} className="flex flex-col gap-6">
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="credential"
                                    className="text-foreground text-sm font-medium"
                                >
                                    RUT o Email
                                </label>
                                <input
                                    id="credential"
                                    name="credential"
                                    type="text"
                                    placeholder="12.345.678-9 o alumno@correo.cl"
                                    disabled={isPending}
                                    autoComplete="off"
                                    className="border-input placeholder:text-muted-foreground/60 focus:border-primary h-[48px] w-full rounded-xl border-2 px-4 text-[15px] font-medium transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            {state?.error && (
                                <div className="border-destructive/30 bg-destructive/10 flex items-start gap-3 rounded-xl border px-4 py-3">
                                    <span className="bg-destructive mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                                        !
                                    </span>
                                    <p className="text-destructive text-sm">{state.error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isPending}
                                size="lg"
                                className="shadow-primary/20 mt-2 w-full rounded-full font-bold shadow-lg"
                            >
                                {isPending && <Loader2 className="animate-spin" />}
                                Comenzar examen
                            </Button>
                        </form>
                    </div>

                    {/* Back */}
                    <p className="text-muted-foreground mt-6 text-center text-[13px]">
                        ¿Sos administrador?{' '}
                        <Link href="/admin/login" className="text-primary font-medium">
                            Accedé aquí
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
