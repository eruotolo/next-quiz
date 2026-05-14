'use client';

import { Button } from '@/shared/components/ui/button';
import { USER_ROLE } from '@/shared/lib/roles';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { LogoMark } from '@/shared/components/branding/logo';
import { getSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
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
            const result = await signIn('credentials', { email, password, redirect: false });
            if (result?.error) {
                setError('Email o contraseña incorrectos.');
                return;
            }
            const session = await getSession();
            if (!session?.user) {
                setError('No se pudo obtener la sesión. Intentá de nuevo.');
                return;
            }
            if (session.user.userRoleName === USER_ROLE.SUPER_ADMIN) {
                router.replace('/config');
            } else if (session.user.institutionSlug) {
                router.replace(`/${session.user.institutionSlug}`);
            } else {
                setError('Tu usuario no tiene institución asignada. Contactá al administrador.');
            }
        } catch {
            setError('Ocurrió un error inesperado. Intentá de nuevo.');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[linear-gradient(135deg,#0f172a_0%,#001f3f_50%,#0f172a_100%)]">
            {/* Left — branding */}
            <div className="hidden flex-col justify-between px-14 py-12 lg:flex lg:w-[51%]">
                <div className="flex items-center gap-3">
                    <LogoMark size={40} />
                    <span className="text-[19px] font-bold text-white">EduNext Quiz</span>
                </div>

                <div>
                    <h2 className="mb-4 text-[36px] leading-[1.15] font-extrabold tracking-[-0.72px] text-white">
                        Plataforma de exámenes
                        <br />
                        para docentes modernos.
                    </h2>
                    <p className="text-[17px] text-[#99c7fb]">
                        Creá exámenes, gestioná grupos y revisá resultados en tiempo real.
                    </p>
                </div>

                <div className="flex gap-5 text-xs text-white/50">
                    <span>Plataforma educativa</span>
                    <span>·</span>
                    <span>Panel administrativo</span>
                </div>
            </div>

            {/* Right — login form */}
            <div className="flex flex-1 items-center justify-center bg-white p-10 lg:rounded-l-[24px]">
                <div className="w-full max-w-[340px]">
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <LogoMark size={36} />
                        <span className="text-lg font-bold text-[#18181b]">EduNext Quiz</span>
                    </div>

                    <div className="mb-6">
                        <h1 className="text-[22px] font-extrabold tracking-[-0.08px] text-[#18181b]">
                            Acceso administrativo
                        </h1>
                        <p className="mt-1.5 text-[13px] text-[#71717a]">
                            Ingresá con tus credenciales de administrador
                        </p>
                    </div>

                    <form
                        onSubmit={(e) => {
                            void handleSubmit(e);
                        }}
                        className="flex flex-col gap-3"
                    >
                        <label className="flex h-[49px] cursor-text items-center gap-3 rounded-[14px] border-2 border-[#e4e4e7] bg-white px-3 transition-colors duration-200 focus-within:border-[#18181b] hover:border-[#a1a1aa] focus-within:hover:border-[#18181b]">
                            <Mail size={16} className="shrink-0 text-[#a1a1aa]" />
                            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                                <span className="text-[11px] leading-none font-medium text-[#71717a]">
                                    Email <span className="text-destructive text-[10px]">*</span>
                                </span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@edunext.local"
                                    disabled={isPending}
                                    required
                                    className="bg-transparent text-[15px] leading-none text-[#18181b] outline-none placeholder:text-[#c4c4c8] disabled:opacity-60"
                                />
                            </div>
                        </label>

                        <label className="flex h-[49px] cursor-text items-center gap-3 rounded-[14px] border-2 border-[#e4e4e7] bg-white px-3 transition-colors duration-200 focus-within:border-[#18181b] hover:border-[#a1a1aa] focus-within:hover:border-[#18181b]">
                            <Lock size={16} className="shrink-0 text-[#a1a1aa]" />
                            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                                <span className="text-[11px] leading-none font-medium text-[#71717a]">
                                    Contraseña{' '}
                                    <span className="text-destructive text-[10px]">*</span>
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    disabled={isPending}
                                    required
                                    className="bg-transparent text-[15px] leading-none text-[#18181b] outline-none placeholder:text-[#c4c4c8] disabled:opacity-60"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="shrink-0 text-[#a1a1aa] transition-colors outline-none hover:text-[#71717a]"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </label>

                        {error && (
                            <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-xl px-4 py-3 text-sm">
                                <span className="bg-destructive flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                                    !
                                </span>
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="mt-1 h-[48px] w-full rounded-full text-[15px] font-semibold"
                        >
                            {isPending && <Loader2 className="animate-spin" />}
                            Ingresar al panel
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-[13px] text-[#a1a1aa]">
                        ¿Sos alumno?{' '}
                        <Link href="/examen/login" className="text-primary text-[13px] font-medium">
                            Accedé aquí
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
