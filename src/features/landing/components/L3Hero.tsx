import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import { Tag } from '@/shared/components/ui/badge';
import { Activity, ArrowRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

// Browser mockup that previews the admin panel
function BigMock() {
    return (
        <div className="relative mx-auto w-full">
            {/* Browser chrome */}
            <div className="border-border overflow-hidden rounded-[28px] border bg-white shadow-[0_50px_100px_rgba(11,11,17,0.15),0_8px_16px_rgba(11,11,17,0.05)]">
                {/* Browser top bar */}
                <div className="border-border bg-paper flex items-center gap-2.5 border-b px-5 py-3.5">
                    <div className="flex gap-2">
                        <div className="size-2.5 rounded-full bg-[#FF5F57]" />
                        <div className="size-2.5 rounded-full bg-[#FEBC2E]" />
                        <div className="size-2.5 rounded-full bg-[#28C840]" />
                    </div>
                    <div className="text-mute ml-4 font-mono text-[11px]">
                        aulika.cl/colegio-antartica/liveresults
                    </div>
                    <div className="text-coral ml-auto flex items-center gap-2 font-mono text-[11px] font-bold">
                        <span className="relative flex h-2 w-2">
                            <span className="bg-coral absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                            <span className="bg-coral relative inline-flex h-2 w-2 rounded-full shadow-[0_0_0_3px_rgba(255,90,77,0.2)]" />
                        </span>
                        EN VIVO · 28 conectados
                    </div>
                </div>

                {/* App preview */}
                <div className="bg-paper flex h-[540px]">
                    {/* Mini sidebar */}
                    <aside className="border-border flex w-[220px] shrink-0 flex-col gap-4 border-r bg-white p-4">
                        <div className="flex items-center gap-2 px-1">
                            <div className="bg-primary flex size-7 items-center justify-center rounded-[6px] text-[10px] font-bold text-white">
                                A
                            </div>
                            <div className="text-ink text-[12px] font-bold">Colegio Antártica</div>
                        </div>
                        <nav className="flex flex-col gap-0.5">
                            {['Inicio', 'Estudiantes', 'Grupos', 'Exámenes', 'Resultados'].map(
                                (item) => (
                                    <div
                                        key={item}
                                        className="text-ink-dim hover:bg-paper-warm rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors"
                                    >
                                        {item}
                                    </div>
                                ),
                            )}
                            <div className="bg-primary-wash text-primary mt-1 flex items-center gap-2 rounded-[6px] px-3 py-2 text-[12px] font-bold">
                                En vivo
                                <span className="bg-coral ml-auto size-1.5 rounded-full" />
                            </div>
                        </nav>
                    </aside>

                    {/* Main content */}
                    <main className="flex flex-1 flex-col p-7">
                        <div className="mb-6">
                            <p className="text-mute font-mono text-[10px] font-bold tracking-[0.12em] uppercase">
                                HISTORIA / 3°A / EXAMEN UNIDAD 4
                            </p>
                            <h3 className="font-display text-ink mt-1 text-[26px] font-medium tracking-tight">
                                Tablero en vivo
                            </h3>
                        </div>

                        {/* Stat tiles */}
                        <div className="mb-6 grid grid-cols-4 gap-2">
                            {[
                                { n: '28/30', l: 'conectados' },
                                { n: '82%', l: 'precisión' },
                                { n: '8m 22s', l: 't. medio' },
                                { n: 'P5', l: 'líder error' },
                            ].map((tile) => (
                                <div
                                    key={tile.l}
                                    className="border-border rounded-[10px] border bg-white p-3.5 shadow-sm"
                                >
                                    <p className="font-display text-ink text-[22px] leading-none font-bold">
                                        {tile.n}
                                    </p>
                                    <p className="text-mute mt-1.5 text-[11px] font-medium">
                                        {tile.l}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Control Matrix */}
                        <div className="border-border flex flex-1 flex-col overflow-hidden rounded-[14px] border bg-white shadow-sm">
                            <div className="bg-paper border-border flex items-center gap-4 border-b px-4 py-2">
                                <div className="bg-border/40 h-2 w-32 rounded-full" />
                                <div className="flex flex-1 gap-1">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div
                                            key={`header-col-${i}`}
                                            className="bg-border/20 h-3 flex-1 rounded-sm"
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 space-y-3 p-4">
                                {[
                                    { name: 'Sofía Rivas', progress: 100, status: 'success' },
                                    { name: 'Tomás Velasco', progress: 85, status: 'primary' },
                                    { name: 'Camila Núñez', progress: 60, status: 'primary' },
                                    { name: 'Joaquín Lara', progress: 92, status: 'success' },
                                    { name: 'Antonia Soto', progress: 40, status: 'primary' },
                                ].map((row, i) => (
                                    <div key={row.name} className="flex items-center gap-4">
                                        <div className="text-ink w-32 truncate text-[12px] font-bold">
                                            {row.name}
                                        </div>
                                        <div className="flex flex-1 gap-1">
                                            {Array.from({ length: 12 }).map((_, j) => {
                                                const isActive = (j / 12) * 100 < row.progress;
                                                const isCorrect = isActive && (i + j) % 5 !== 0;
                                                return (
                                                    <div
                                                        key={j}
                                                        className={cn(
                                                            'h-5 flex-1 rounded-sm transition-all',
                                                            !isActive
                                                                ? 'bg-paper-warm'
                                                                : isCorrect
                                                                  ? 'bg-success/20 border-success/30 border'
                                                                  : 'bg-destructive/20 border-destructive/30 border',
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
            <div className="border-border animate-bounce-slow absolute top-24 -right-8 rounded-[16px] border bg-white px-5 py-4 shadow-2xl">
                <p className="text-mute font-mono text-[11px] font-bold tracking-wider uppercase">
                    Resultado
                </p>
                <p className="font-display text-success mt-1 text-[32px] leading-none font-bold">
                    6.8
                </p>
                <div className="mt-3 flex items-center gap-2">
                    <div className="bg-paper-warm border-border size-5 rounded-full border" />
                    <p className="text-ink text-[11px] font-bold">Sofía Torres</p>
                </div>
            </div>

            <div className="border-border absolute bottom-20 -left-10 rounded-[16px] border bg-white px-5 py-4 shadow-2xl">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-primary" />
                    <p className="text-ink font-mono text-[11px] font-bold">Monitor Activo</p>
                </div>
                <p className="text-ink-dim mt-2 text-[13px] leading-tight">
                    Detección de copia:
                    <br />
                    <span className="text-success font-bold">0 incidentes</span>
                </p>
            </div>
        </div>
    );
}

export function L3Hero() {
    return (
        <section className="relative overflow-hidden bg-white pt-20 pb-12" id="producto">
            {/* Pro grid background with radial mask */}
            <div
                className="pointer-events-none absolute inset-0 [background-image:var(--hero-grid)] bg-[length:56px_56px] [mask-image:var(--hero-mask)] opacity-[0.05]"
                style={
                    {
                        '--hero-grid':
                            'linear-gradient(#0b0b11 1px, transparent 1px), linear-gradient(90deg, #0b0b11 1px, transparent 1px)',
                        '--hero-mask': 'radial-gradient(circle at center top, black 25%, transparent 75%)',
                    } as React.CSSProperties
                }
            />

            <div className="relative mx-auto max-w-[1400px] px-6 md:px-14">
                {/* Tag */}
                <div className="mb-8 flex justify-center">
                    <Tag tone="primary" size="sm" className="gap-2 px-3 py-1 font-bold">
                        <span className="bg-primary size-1.5 animate-pulse rounded-full" />
                        PLATAFORMA CHILENA · v0.9 — admisión abierta
                    </Tag>
                </div>

                {/* H1 — Massive Impact */}
                <h1 className="font-display text-ink mx-auto mb-8 max-w-[1100px] text-center text-[64px] leading-[0.9] font-medium tracking-[-0.05em] md:text-[100px] lg:text-[144px]">
                    El examen de aula <br className="hidden lg:block" />
                    <span className="text-primary relative inline-block">
                        deja de ser un trámite.
                        <svg
                            className="absolute -bottom-4 left-0 h-4 w-full"
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
                <p className="text-ink-dim mx-auto mb-10 max-w-[620px] text-center text-[19px] leading-[1.55]">
                    Aulika es el sistema de evaluación en línea para colegios y universidades
                    chilenas. Login por RUT, corrección instantánea, banco de preguntas reutilizable
                    y tablero en vivo para el docente.
                </p>

                {/* CTAs */}
                <div className="mb-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <Button
                        variant="ink"
                        size="lg"
                        asChild
                        className="h-14 px-8 text-[16px] font-bold"
                    >
                        <Link href="/demo">
                            Ver demo gratuita
                            <ArrowRight className="ml-2 size-5" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="lg"
                        asChild
                        className="h-14 px-8 text-[16px] font-bold"
                    >
                        <Link href="/demo/exam">Ver examen demo →</Link>
                    </Button>
                </div>

                {/* Checks row — Mono Pro */}
                <div className="text-mute mb-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-[11px] font-bold tracking-[0.06em] uppercase">
                    <span>✓ activación &lt; 24 hrs</span>
                    <span>✓ sin tarjeta</span>
                    <span>✓ 30 días gratis</span>
                    <span>✓ migración asistida</span>
                </div>

                {/* Big Mock */}
                <div className="mx-auto mt-12 max-w-[1140px]">
                    <BigMock />
                </div>
            </div>
        </section>
    );
}
