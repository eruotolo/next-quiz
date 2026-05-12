'use client';

import { Button, Input, Link } from '@heroui/react';
import { BookOpen, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setError(null);
        setIsPending(true);
        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });
            if (result?.error) {
                setError('Email o contraseña incorrectos.');
            } else {
                router.replace('/admin');
            }
        } catch {
            setError('Ocurrió un error inesperado. Intentá de nuevo.');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="via-primary-900 flex min-h-screen bg-gradient-to-br from-slate-900 to-slate-900">
            {/* Left — branding */}
            <div className="hidden flex-col justify-between p-16 lg:flex lg:w-1/2">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        <BookOpen size={20} className="text-white" />
                    </div>
                    <span className="text-xl font-bold text-white">EduNext Quiz</span>
                </div>

                <div>
                    <h2 className="mb-4 text-4xl leading-tight font-bold text-white">
                        Plataforma de exámenes
                        <br />
                        para docentes modernos.
                    </h2>
                    <p className="text-primary-200 text-lg">
                        Creá exámenes, gestioná grupos y revisá resultados en tiempo real.
                    </p>
                </div>

                <div className="flex gap-6 text-sm text-white/50">
                    <span>Plataforma educativa</span>
                    <span>·</span>
                    <span>Panel administrativo</span>
                </div>
            </div>

            {/* Right — login form */}
            <div className="flex flex-1 items-center justify-center bg-white p-8 lg:rounded-l-3xl">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-xl">
                            <BookOpen size={18} className="text-white" />
                        </div>
                        <span className="text-default-900 text-lg font-bold">EduNext Quiz</span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-default-900 text-2xl font-bold">
                            Acceso administrativo
                        </h1>
                        <p className="text-default-500 mt-1 text-sm">
                            Ingresá con tus credenciales de administrador
                        </p>
                    </div>

                    <form
                        onSubmit={(e) => {
                            void handleSubmit(e);
                        }}
                        className="flex flex-col gap-4"
                    >
                        <Input
                            type="email"
                            label="Email"
                            placeholder="admin@institución.edu"
                            value={email}
                            onValueChange={setEmail}
                            startContent={<Mail size={16} className="text-default-400" />}
                            variant="bordered"
                            radius="lg"
                            isDisabled={isPending}
                            isRequired
                            classNames={{ input: 'text-base' }}
                        />

                        <Input
                            type={showPassword ? 'text' : 'password'}
                            label="Contraseña"
                            placeholder="••••••••"
                            value={password}
                            onValueChange={setPassword}
                            startContent={<Lock size={16} className="text-default-400" />}
                            endContent={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="text-default-400 hover:text-default-600"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            }
                            variant="bordered"
                            radius="lg"
                            isDisabled={isPending}
                            isRequired
                            classNames={{ input: 'text-base' }}
                        />

                        {error && (
                            <div className="border-danger-200 bg-danger-50 text-danger-700 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm">
                                <span className="bg-danger flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                                    !
                                </span>
                                {error}
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
                            {isPending ? 'Ingresando...' : 'Ingresar al panel'}
                        </Button>
                    </form>

                    <p className="text-default-400 mt-8 text-center text-sm">
                        ¿Sos alumno?{' '}
                        <Link href="/examen/login" className="text-primary font-medium">
                            Accedé aquí
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
