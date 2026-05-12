'use client';

import { validateStudent } from '@/actions/student-auth';
import { RutInput } from '@/components/inputs/RutInput';
import { Button, Link } from '@heroui/react';
import { BookOpen, GraduationCap } from 'lucide-react';
import { useActionState } from 'react';

const initialState = { error: undefined, resultId: undefined };

export default function StudentLoginPage() {
    const [state, action, isPending] = useActionState(validateStudent, initialState);

    return (
        <div className="from-primary-50 to-secondary-50 flex min-h-screen flex-col bg-gradient-to-br via-white">
            {/* Header */}
            <header className="flex items-center gap-3 px-8 py-6">
                <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-xl text-white">
                    <BookOpen size={18} />
                </div>
                <span className="text-default-900 text-lg font-bold">EduNext Quiz</span>
            </header>

            {/* Card */}
            <main className="flex flex-1 items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="border-default-100 rounded-2xl border bg-white p-10 shadow-xl">
                        {/* Icon */}
                        <div className="mb-8 flex flex-col items-center gap-3">
                            <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-2xl">
                                <GraduationCap size={32} className="text-primary" />
                            </div>
                            <div className="text-center">
                                <h1 className="text-default-900 text-2xl font-bold">
                                    Ingresar al examen
                                </h1>
                                <p className="text-default-500 mt-1 text-sm">
                                    Ingresá tu RUT para acceder al examen activo de tu grupo
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form action={action} className="flex flex-col gap-5">
                            <RutInput
                                name="rut"
                                label="Tu RUT"
                                placeholder="12.345.678-9"
                                isDisabled={isPending}
                            />

                            {state?.error && (
                                <div className="border-danger-200 bg-danger-50 flex items-start gap-3 rounded-xl border px-4 py-3">
                                    <span className="bg-danger mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                                        !
                                    </span>
                                    <p className="text-danger-700 text-sm">{state.error}</p>
                                </div>
                            )}

                            {state?.resultId && (
                                <div className="border-success-200 bg-success-50 rounded-xl border px-4 py-3 text-center">
                                    <p className="text-success-700 mb-2 text-sm">
                                        Ya completaste este examen.
                                    </p>
                                    <Link
                                        href={`/examen/resultado/${state.resultId}`}
                                        className="text-primary text-sm font-semibold"
                                    >
                                        Ver tu resultado →
                                    </Link>
                                </div>
                            )}

                            <Button
                                type="submit"
                                color="primary"
                                size="lg"
                                radius="full"
                                fullWidth
                                isLoading={isPending}
                                className="mt-2 font-semibold"
                            >
                                {isPending ? 'Verificando...' : 'Comenzar examen'}
                            </Button>
                        </form>
                    </div>

                    {/* Back */}
                    <p className="text-default-400 mt-6 text-center text-sm">
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
