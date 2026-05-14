import { LogoMark } from '@/shared/components/branding/logo';
import Link from 'next/link';

export default function MarketingPage() {
    return (
        <div className="flex min-h-screen flex-col bg-[linear-gradient(135deg,#0f172a_0%,#001731_50%,#0f172a_100%)]">
            {/* Top bar */}
            <header className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2.5">
                    <LogoMark size={32} />
                    <span className="font-bold text-white">EduNext Quiz</span>
                </div>
                <nav className="flex items-center gap-2">
                    <Link
                        href="/examen/login"
                        className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/10"
                    >
                        Acceso Alumnos
                    </Link>
                    <Link
                        href="/login"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                    >
                        Acceso Administrador
                    </Link>
                </nav>
            </header>

            {/* Coming soon */}
            <main className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                    Muy pronto
                </p>
                <h1 className="text-5xl font-extrabold tracking-tight text-white">
                    EduNext Quiz
                </h1>
                <p className="max-w-sm text-slate-400">
                    La plataforma de exámenes en línea para instituciones educativas. Estamos
                    preparando algo especial.
                </p>
            </main>

            <footer className="py-6 text-center text-[11px] text-slate-600">
                © {new Date().getFullYear()} EduNext · Crow Advance
            </footer>
        </div>
    );
}
