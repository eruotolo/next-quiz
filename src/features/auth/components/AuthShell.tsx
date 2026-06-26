import type { CSSProperties, ReactNode } from 'react';
import { LogoMark, LogoWordmark } from '@/shared/components/branding/logo';
import Link from 'next/link';

interface AuthShellProps {
    children: ReactNode;
    side?: ReactNode;
}

export function AuthShell({ children, side }: AuthShellProps) {
    return (
        <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
            {/* Left — ink panel with radial gradients */}
            <aside
                className="relative hidden flex-col justify-between p-12 [background:var(--auth-bg)] lg:flex"
                style={
                    {
                        '--auth-bg':
                            'radial-gradient(ellipse at 22% 22%, rgba(31,46,255,0.38) 0%, transparent 55%), radial-gradient(ellipse at 78% 78%, rgba(214,255,31,0.14) 0%, transparent 50%), #0b0b11',
                    } as CSSProperties
                }
            >
                {/* Logo */}
                <Link
                    href="/"
                    className="flex items-center gap-3 transition-opacity hover:opacity-80"
                >
                    <LogoMark size={34} variant="tinta" />
                    <LogoWordmark size={22} color="#ffffff" />
                </Link>

                {/* Optional side content */}
                {side ? (
                    <div className="flex flex-1 items-center py-12">{side}</div>
                ) : (
                    <div className="flex flex-1 flex-col justify-center space-y-4 py-12">
                        <p className="font-mono text-[11px] tracking-[0.12em] text-white/30 uppercase">
                            Plataforma educativa
                        </p>
                        <h2 className="font-display text-[44px] leading-tight font-semibold tracking-[-0.035em] text-white">
                            Crea, aplica y corrige exámenes en minutos.
                        </h2>
                        <p className="text-[15px] leading-relaxed text-white/50">
                            Para colegios, preuniversitarios e instituciones de educación superior
                            chilenas.
                        </p>
                    </div>
                )}

                {/* Footer */}
                <p className="font-mono text-[10px] tracking-[0.1em] text-white/25 uppercase">
                    © 2026 Aulika · Todos los derechos reservados
                </p>
            </aside>

            {/* Right — paper form area */}
            <main className="bg-paper flex flex-col items-center justify-center px-8 py-12">
                {/* Mobile logo */}
                <Link
                    href="/"
                    className="mb-8 flex items-center gap-2.5 transition-opacity hover:opacity-80 lg:hidden"
                >
                    <LogoMark size={30} />
                    <LogoWordmark size={20} color="#0b0b11" />
                </Link>

                <div className="w-full max-w-[400px]">{children}</div>
            </main>
        </div>
    );
}
