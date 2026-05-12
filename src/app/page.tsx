'use client';

import { Button } from '@heroui/react';
import { BookOpen, ClipboardList, GraduationCap, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
    return (
        <main className="via-primary-950 flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-900 p-6">
            {/* Logo */}
            <div className="mb-8 flex flex-col items-center gap-3">
                <div className="bg-primary shadow-primary/30 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg">
                    <ClipboardList size={32} className="text-white" />
                </div>
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">EduNext Quiz</h1>
                    <p className="mt-1 text-sm text-slate-400">Sistema de exámenes en línea</p>
                </div>
            </div>

            {/* Cards */}
            <div className="grid w-full max-w-md gap-4">
                {/* Student card */}
                <Link
                    href="/examen/login"
                    className="group flex items-center gap-5 rounded-2xl bg-white/10 px-6 py-5 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-white/15 hover:ring-white/20"
                >
                    <div className="bg-primary/20 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                        <GraduationCap size={24} className="text-primary-300" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-white">Soy alumno</p>
                        <p className="text-sm text-slate-400">
                            Ingresá con tu RUT para rendir tu examen
                        </p>
                    </div>
                    <div className="ml-auto text-slate-500 transition-transform group-hover:translate-x-0.5">
                        →
                    </div>
                </Link>

                {/* Admin card */}
                <Link
                    href="/admin/login"
                    className="group flex items-center gap-5 rounded-2xl bg-white/10 px-6 py-5 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-white/15 hover:ring-white/20"
                >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/20">
                        <LayoutDashboard size={24} className="text-violet-300" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-white">Soy administrador</p>
                        <p className="text-sm text-slate-400">
                            Accedé al panel para gestionar exámenes
                        </p>
                    </div>
                    <div className="ml-auto text-slate-500 transition-transform group-hover:translate-x-0.5">
                        →
                    </div>
                </Link>

                {/* Demo link */}
                <div className="text-center">
                    <Button
                        as={Link}
                        href="/demo/exam"
                        variant="light"
                        size="sm"
                        startContent={<BookOpen size={14} />}
                        className="text-slate-500 hover:text-slate-300"
                    >
                        Ver demo de examen
                    </Button>
                </div>
            </div>

            <p className="mt-12 text-xs text-slate-600">
                © {new Date().getFullYear()} Crow Advance. Todos los derechos reservados.
            </p>
        </main>
    );
}
