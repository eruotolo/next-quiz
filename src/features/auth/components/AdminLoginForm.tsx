'use client';

import type * as React from 'react';
import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { USER_ROLE } from '@/shared/lib/roles';
import { Button } from '@/shared/components/ui/button';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import Link from 'next/link';

function GoogleIcon(): React.JSX.Element {
    return (
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24">
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    );
}

export function AdminLoginForm(): React.JSX.Element {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [isGooglePending, setIsGooglePending] = useState(false);

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

    const handleGoogle = async (): Promise<void> => {
        setIsGooglePending(true);
        await signIn('google', { callbackUrl: '/login' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-mute">
                    Acceso docente
                </span>
                <h1 className="mt-2 font-display text-[38px] font-semibold leading-none tracking-[-0.03em] text-ink">
                    Iniciar sesión
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">
                    Ingresá con tus credenciales para acceder al panel.
                </p>
            </div>

            {/* Credentials form */}
            <form
                onSubmit={(e) => {
                    void handleSubmit(e);
                }}
                className="space-y-3"
            >
                {/* Email */}
                <label className="flex h-[46px] cursor-text items-center gap-3 rounded-[8px] border border-border bg-white px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 hover:border-ink/20">
                    <Mail size={14} className="shrink-0 text-mute" />
                    <div className="flex min-w-0 flex-1 flex-col">
                        <span className="font-mono text-[9px] uppercase leading-none tracking-[0.08em] text-mute">
                            Email
                        </span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="docente@colegio.cl"
                            disabled={isPending}
                            required
                            className="bg-transparent text-[14px] text-ink outline-none placeholder:text-mute/50 disabled:opacity-60"
                        />
                    </div>
                </label>

                {/* Password */}
                <label className="flex h-[46px] cursor-text items-center gap-3 rounded-[8px] border border-border bg-white px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 hover:border-ink/20">
                    <Lock size={14} className="shrink-0 text-mute" />
                    <div className="flex min-w-0 flex-1 flex-col">
                        <span className="font-mono text-[9px] uppercase leading-none tracking-[0.08em] text-mute">
                            Contraseña
                        </span>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={isPending}
                            required
                            className="bg-transparent text-[14px] text-ink outline-none placeholder:text-mute/50 disabled:opacity-60"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="shrink-0 text-mute outline-none transition-colors hover:text-ink"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                </label>

                {/* Forgot */}
                <div className="flex justify-end">
                    <span className="text-[12px] font-medium text-mute">
                        ¿Olvidaste tu contraseña? Contactá al administrador.
                    </span>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 rounded-[8px] bg-danger-wash px-4 py-3 text-[13px] text-destructive">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-white">
                            !
                        </span>
                        {error}
                    </div>
                )}

                {/* Submit */}
                <Button variant="ink" size="lg" type="submit" disabled={isPending} className="w-full mt-1">
                    {isPending ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <>
                            Entrar al panel
                            <ArrowRight className="size-4" />
                        </>
                    )}
                </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-mute">O</span>
                <div className="h-px flex-1 bg-border" />
            </div>

            {/* Google SSO */}
            <Button
                variant="ghost"
                size="lg"
                type="button"
                disabled={isGooglePending}
                onClick={() => {
                    void handleGoogle();
                }}
                className="w-full"
            >
                {isGooglePending ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
                Acceso con Google Workspace
            </Button>

            {/* Student link */}
            <div className="rounded-[8px] bg-paper-warm px-4 py-3 text-center">
                <p className="text-[12px] text-ink-dim">
                    ¿Sos alumno?{' '}
                    <Link href="/examen/login" className="font-medium text-primary">
                        Accedé aquí →
                    </Link>
                </p>
            </div>
        </div>
    );
}
