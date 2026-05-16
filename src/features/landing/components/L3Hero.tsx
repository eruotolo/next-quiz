import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import { Tag } from '@/shared/components/ui/badge';
import { Activity, ArrowRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

// Browser mockup that previews the admin panel
function BigMock(): React.JSX.Element {
    return (
        <div className="relative mx-auto w-full">
            {/* Browser chrome */}
            <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-[0_50px_100px_rgba(11,11,17,0.15),0_8px_16px_rgba(11,11,17,0.05)]">
                {/* Browser top bar */}
                <div className="flex items-center gap-2.5 border-b border-border bg-paper px-5 py-3.5">
                    <div className="flex gap-2">
                        <div className="size-2.5 rounded-full bg-[#FF5F57]" />
                        <div className="size-2.5 rounded-full bg-[#FEBC2E]" />
                        <div className="size-2.5 rounded-full bg-[#28C840]" />
                    </div>
                    <div className="ml-4 font-mono text-[11px] text-mute">
                        aulika.cl/colegio-antartica/liveresults
                    </div>
                    <div className="ml-auto flex items-center gap-2 font-mono text-[11px] font-bold text-coral">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-coral shadow-[0_0_0_3px_rgba(255,90,77,0.2)]" />
                        </span>
                        EN VIVO · 28 conectados
                    </div>
                </div>

                {/* App preview */}
                <div className="flex h-[540px] bg-paper">
                    {/* Mini sidebar */}
                    <aside className="flex w-[220px] shrink-0 flex-col border-r border-border bg-white p-4 gap-4">
                        <div className="flex items-center gap-2 px-1">
                            <div className="size-7 rounded-[6px] bg-primary flex items-center justify-center text-[10px] text-white font-bold">A</div>
                            <div className="text-[12px] font-bold text-ink">Colegio Antártica</div>
                        </div>
                        <nav className="flex flex-col gap-0.5">
                            {['Inicio', 'Estudiantes', 'Grupos', 'Exámenes', 'Resultados'].map((item) => (
                                <div key={item} className="px-3 py-1.5 text-[12px] font-medium text-ink-dim hover:bg-paper-warm rounded-md transition-colors">
                                    {item}
                                </div>
                            ))}
                            <div className="mt-1 flex items-center gap-2 rounded-[6px] bg-primary-wash px-3 py-2 text-[12px] font-bold text-primary">
                                En vivo
                                <span className="ml-auto size-1.5 rounded-full bg-coral" />
                            </div>
                        </nav>
                    </aside>

                    {/* Main content */}
                    <main className="flex-1 p-7 flex flex-col">
                        <div className="mb-6">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-mute">HISTORIA / 3°A / EXAMEN UNIDAD 4</p>
                            <h3 className="mt-1 font-display text-[26px] font-medium tracking-tight text-ink">Tablero en vivo</h3>
                        </div>

                        {/* Stat tiles */}
                        <div className="mb-6 grid grid-cols-4 gap-2">
                            {[
                                { n: '28/30', l: 'conectados' },
                                { n: '82%', l: 'precisión' },
                                { n: '8m 22s', l: 't. medio' },
                                { n: 'P5', l: 'líder error' },
                            ].map((tile) => (
                                <div key={tile.l} className="rounded-[10px] border border-border bg-white p-3.5 shadow-sm">
                                    <p className="font-display text-[22px] font-bold text-ink leading-none">{tile.n}</p>
                                    <p className="mt-1.5 text-[11px] text-mute font-medium">{tile.l}</p>
                                </div>
                            ))}
                        </div>

                        {/* Control Matrix */}
                        <div className="flex-1 rounded-[14px] border border-border bg-white shadow-sm overflow-hidden flex flex-col">
                            <div className="bg-paper border-b border-border px-4 py-2 flex items-center gap-4">
                                <div className="w-32 h-2 rounded-full bg-border/40" />
                                <div className="flex-1 flex gap-1">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div key={i} className="flex-1 h-3 rounded-sm bg-border/20" />
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 p-4 space-y-3">
                                {[
                                    { name: 'Sofía Rivas', progress: 100, status: 'success' },
                                    { name: 'Tomás Velasco', progress: 85, status: 'primary' },
                                    { name: 'Camila Núñez', progress: 60, status: 'primary' },
                                    { name: 'Joaquín Lara', progress: 92, status: 'success' },
                                    { name: 'Antonia Soto', progress: 40, status: 'primary' },
                                ].map((row, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-32 text-[12px] font-bold text-ink truncate">{row.name}</div>
                                        <div className="flex-1 flex gap-1">
                                            {Array.from({ length: 12 }).map((_, j) => {
                                                const isActive = (j / 12) * 100 < row.progress;
                                                const isCorrect = isActive && (i + j) % 5 !== 0;
                                                return (
                                                    <div 
                                                        key={j} 
                                                        className={cn(
                                                            "flex-1 h-5 rounded-sm transition-all",
                                                            !isActive ? "bg-paper-warm" : isCorrect ? "bg-success/20 border border-success/30" : "bg-destructive/20 border border-destructive/30"
                                                        )} 
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Floating elements — Energy */}
            <div className="absolute -right-8 top-24 rounded-[16px] border border-border bg-white px-5 py-4 shadow-2xl animate-bounce-slow">
                <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-mute">Resultado</p>
                <p className="font-display text-[32px] font-bold text-success leading-none mt-1">6.8</p>
                <div className="mt-3 flex items-center gap-2">
                    <div className="size-5 rounded-full bg-paper-warm border border-border" />
                    <p className="text-[11px] font-bold text-ink">Sofía Torres</p>
                </div>
            </div>

            <div className="absolute -left-10 bottom-20 rounded-[16px] border border-border bg-white px-5 py-4 shadow-2xl">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-primary" />
                    <p className="font-mono text-[11px] font-bold text-ink">Monitor Activo</p>
                </div>
                <p className="mt-2 text-[13px] text-ink-dim leading-tight">Detección de copia:<br /><span className="text-success font-bold">0 incidentes</span></p>
            </div>
        </div>
    );
}

export function L3Hero(): React.JSX.Element {
    return (
        <section className="relative overflow-hidden bg-white pt-20 pb-12" id="producto">
            {/* Pro grid background with radial mask */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage: 'linear-gradient(#0b0b11 1px, transparent 1px), linear-gradient(90deg, #0b0b11 1px, transparent 1px)',
                    backgroundSize: '56px 56px',
                    maskImage: 'radial-gradient(circle at center top, black 25%, transparent 75%)',
                }}
            />

            <div className="relative mx-auto max-w-[1400px] px-6 md:px-14">
                {/* Tag */}
                <div className="mb-8 flex justify-center">
                    <Tag tone="primary" size="sm" className="gap-2 px-3 py-1 font-bold">
                        <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                        PLATAFORMA CHILENA · v0.9 — admisión abierta
                    </Tag>
                </div>

                {/* H1 — Massive Impact */}
                <h1 className="mx-auto mb-8 max-w-[1100px] text-center font-display text-[64px] font-medium leading-[0.9] tracking-[-0.05em] text-ink md:text-[100px] lg:text-[144px]">
                    El examen de aula{' '}
                    <br className="hidden lg:block" />
                    <span className="relative inline-block text-primary">
                        deja de ser un trámite.
                        <svg
                            className="absolute -bottom-4 left-0 w-full h-4"
                            viewBox="0 0 800 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                        >
                            <path
                                d="M4 10 Q 200 1 400 8 T 796 7"
                                stroke="#d6ff1f"
                                strokeWidth="10"
                                strokeLinecap="round"
                                fill="none"
                            />
                        </svg>
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="mx-auto mb-10 max-w-[620px] text-center text-[19px] leading-[1.55] text-ink-dim">
                    Aulika es el sistema de evaluación en línea para colegios y universidades chilenas. Login por RUT, corrección instantánea, banco de preguntas reutilizable y tablero en vivo para el docente.
                </p>

                {/* CTAs */}
                <div className="mb-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <Button variant="ink" size="lg" asChild className="h-14 px-8 text-[16px] font-bold">
                        <Link href="/login">
                            Solicitar demo gratuita
                            <ArrowRight className="ml-2 size-5" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="lg" asChild className="h-14 px-8 text-[16px] font-bold">
                        <Link href="/demo/exam">Ver examen demo →</Link>
                    </Button>
                </div>

                {/* Checks row — Mono Pro */}
                <div className="mb-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-mute">
                    <span>✓ activación &lt; 24 hrs</span>
                    <span>✓ sin tarjeta</span>
                    <span>✓ 30 días gratis</span>
                    <span>✓ migración asistida</span>
                </div>

                {/* Big Mock */}
                <div className="mt-12 max-w-[1140px] mx-auto">
                    <BigMock />
                </div>
            </div>
        </section>
    );
}
