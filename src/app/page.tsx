'use client';

import {
    ArrowRight,
    BookOpen,
    GraduationCap,
    LayoutDashboard,
} from 'lucide-react';
import { LogoMark } from '@/components/ui/logo';
import Link from 'next/link';

export default function HomePage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[linear-gradient(135deg,#0f172a_0%,#001731_50%,#0f172a_100%)] p-6">
            {/* Logo */}
            <div className="mb-10 flex flex-col items-center gap-3">
                <LogoMark size={64} className="shadow-[0_8px_24px_rgba(0,111,238,0.35)]" />
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        EduNext Quiz
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">Sistema de exámenes en línea</p>
                </div>
            </div>

            {/* Cards */}
            <div className="flex w-full max-w-[420px] flex-col gap-3.5">
                {/* Student card */}
                <Link
                    href="/examen/login"
                    className="group flex items-center gap-[18px] rounded-[18px] border border-white/10 bg-white/5 px-[22px] py-[18px] backdrop-blur-[6px] transition-all hover:border-white/20 hover:bg-white/10"
                >
                    <div className="bg-primary/20 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                        <GraduationCap size={24} className="text-blue-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">Soy alumno</p>
                        <p className="mt-0.5 text-[13px] text-slate-400">
                            Ingresá con tu RUT para rendir tu examen
                        </p>
                    </div>
                    <div className="text-slate-500 transition-transform group-hover:translate-x-1">
                        <ArrowRight size={18} />
                    </div>
                </Link>

                {/* Admin card */}
                <Link
                    href="/admin/login"
                    className="group flex items-center gap-[18px] rounded-[18px] border border-white/10 bg-white/5 px-[22px] py-[18px] backdrop-blur-[6px] transition-all hover:border-white/20 hover:bg-white/10"
                >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/20">
                        <LayoutDashboard size={24} className="text-violet-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">Soy administrador</p>
                        <p className="mt-0.5 text-[13px] text-slate-400">
                            Accedé al panel para gestionar exámenes
                        </p>
                    </div>
                    <div className="text-slate-500 transition-transform group-hover:translate-x-1">
                        <ArrowRight size={18} />
                    </div>
                </Link>

                {/* Demo link */}
                <div className="mt-1 text-center">
                    <Link
                        href="/demo/exam"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs text-slate-500 transition-colors hover:text-slate-300"
                    >
                        <BookOpen size={13} /> Ver demo de examen
                    </Link>
                </div>
            </div>

            <p className="mt-12 text-[11px] text-slate-600">
                <a href="https://crowadvance.com">Crow Advance</a> Copyright © {new Date().getFullYear()} EduNext · Plataforma educativa
            </p>
        </main>
    );
}
