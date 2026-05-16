'use client';

import { formatDuration, type PaesSubjectMeta } from '@/features/paes/lib/catalog';
import { cn } from '@/shared/lib/utils';
import { BookOpen, Calculator, FlaskConical, Globe, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const SUBJECT_ICONS: Record<string, React.ElementType> = {
    lectora: BookOpen,
    m1: Calculator,
    m2: Calculator,
    historia: Globe,
    ciencias: FlaskConical,
};

interface PaesLandingProps {
    subjects: PaesSubjectMeta[];
}

export function PaesLanding({ subjects }: PaesLandingProps): React.JSX.Element {
    return (
        <div className="py-16">
            <div className="mx-auto max-w-5xl px-4">
                {/* Intro */}
                <div className="mb-12 text-center">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
                        Practica sin límites · Gratis
                    </p>
                    <h1 className="mx-auto max-w-xl font-display text-[36px] font-semibold leading-tight tracking-[-0.025em] text-ink">
                        Simulador PAES.
                    </h1>
                    <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-mute">
                        Ensayos completos cronometrados con el tiempo real de la PAES. Sin registro,
                        sin límite de intentos. Las 5 pruebas disponibles.
                    </p>
                </div>

                {/* Subject grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {subjects.map((s) => {
                        const Icon = SUBJECT_ICONS[s.subject] ?? BookOpen;
                        return (
                            <Link
                                key={s.subject}
                                href={`/paes/${s.subject}`}
                                className={cn(
                                    'group flex flex-col gap-4 rounded-[18px] border p-6 transition-all duration-200',
                                    'hover:-translate-y-0.5 hover:shadow-md',
                                    s.color,
                                )}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex size-10 items-center justify-center rounded-[10px] bg-white/60 border border-border/50">
                                        <Icon size={20} className="text-ink" />
                                    </div>
                                    <span className="rounded-full bg-success/10 px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-success">
                                        Disponible
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h2 className="mb-1.5 font-display text-[17px] font-semibold leading-snug text-ink">
                                        {s.label}
                                    </h2>
                                    <p className="text-[13px] leading-relaxed text-mute">
                                        {s.description}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between border-t border-black/8 pt-4">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-[11px] font-semibold text-ink">
                                                {s.practiceQuestionCount}
                                            </span>
                                            <span className="font-mono text-[9px] uppercase tracking-wider text-mute">
                                                preguntas
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-mono text-[11px] font-semibold text-ink">
                                                {formatDuration(s.timeLimitMinutes)}
                                            </span>
                                            <span className="font-mono text-[9px] uppercase tracking-wider text-mute">
                                                tiempo
                                            </span>
                                        </div>
                                    </div>
                                    <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-ink opacity-60 group-hover:opacity-100 transition-opacity">
                                        Empezar
                                        <ChevronRight size={12} />
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Info footer */}
                <div className="mt-10 rounded-[16px] border border-border bg-white p-6 text-center">
                    <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-mute">
                        Acerca de este simulador
                    </p>
                    <p className="mx-auto max-w-lg text-[13px] leading-relaxed text-mute">
                        Banco de práctica alineado al temario oficial del DEMRE. El puntaje estimado
                        es referencial y no constituye un puntaje oficial de la PAES. Para información oficial,
                        visita{' '}
                        <a
                            href="https://demre.cl"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline-offset-2 hover:underline"
                        >
                            demre.cl
                        </a>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}
