'use client';

import { Tag } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { Check, MoreHorizontal, GraduationCap, Download, ArrowRight } from 'lucide-react';
import type React from 'react';

// ── Mock Components ────────────────────────────────────────────────────────

function MockBank(): React.JSX.Element {
    return (
        <div className="border-border rounded-[18px] border bg-white p-[18px] shadow-[0_24px_50px_rgba(11,11,17,0.1)]">
            <div className="mb-3.5 flex items-center justify-between">
                <Tag tone="default" size="sm" className="text-[10px] font-bold">
                    BANCO DE PREGUNTAS · 412
                </Tag>
                <span className="text-mute font-mono text-[11px] tracking-widest uppercase">
                    HISTORIA · 3°A
                </span>
            </div>
            <div className="divide-border divide-y">
                {[
                    {
                        t: 'Reforma Agraria 1962 · principal consecuencia',
                        tags: ['Unidad 4', 'fácil', 'usada 3×'],
                        hot: true,
                    },
                    {
                        t: 'Régimen militar y DD.HH. — período 1973-1990',
                        tags: ['Unidad 6', 'media', 'usada 7×'],
                        hot: false,
                    },
                    {
                        t: 'Concertación · primeros gobiernos democráticos',
                        tags: ['Unidad 7', 'media'],
                        hot: false,
                    },
                ].map((q) => (
                    <div key={q.t} className="flex items-center gap-3 py-3.5">
                        <MoreHorizontal className="text-mute/40 size-4 shrink-0 rotate-90" />
                        <div className="min-w-0 flex-1">
                            <div className="text-ink mb-1.5 truncate text-[13px] font-bold">
                                {q.t}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {q.tags.map((t) => (
                                    <Tag
                                        key={t}
                                        size="sm"
                                        tone="outline"
                                        className="border-border h-5 px-1.5 font-mono text-[9px]"
                                    >
                                        {t}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                        {q.hot && (
                            <Tag size="sm" tone="lime" className="h-5 px-1.5 text-[9px] font-bold">
                                + agregada
                            </Tag>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function MockResults(): React.JSX.Element {
    const data = [45, 62, 85, 72, 91, 68, 58, 79, 88, 95, 62, 74, 81, 90, 77, 55];
    return (
        <div className="border-border rounded-[18px] border bg-white p-5 shadow-[0_24px_50px_rgba(11,11,17,0.1)]">
            <div className="mb-4.5 flex justify-between">
                <div>
                    <div className="text-mute font-mono text-[10px] font-bold tracking-[0.12em] uppercase">
                        DISTRIBUCIÓN DE NOTAS · UNIDAD 4
                    </div>
                    <div className="font-display text-ink mt-1 text-[32px] font-bold tracking-tight">
                        5,8{' '}
                        <span className="text-mute ml-1 font-mono text-[14px] font-bold">
                            media · σ 1.1
                        </span>
                    </div>
                </div>
                <div className="border-border text-mute flex size-8 items-center justify-center rounded-full border">
                    <Download size={14} />
                </div>
            </div>
            <div className="height-[160px] flex items-end gap-1 px-1 py-4">
                {data.map((d, i) => (
                    <div
                        key={`bar-${i}`}
                        className="flex-1 rounded-t-[4px] transition-all hover:scale-x-110"
                        style={{
                            height: `${d}%`,
                            backgroundColor:
                                d >= 80
                                    ? 'var(--success)'
                                    : d >= 60
                                      ? 'var(--primary)'
                                      : 'var(--warning)',
                        }}
                    />
                ))}
            </div>
            <div className="text-mute mt-2 flex justify-between font-mono text-[10px] font-bold tracking-widest uppercase">
                <span>1,0</span>
                <span>4,0</span>
                <span>5,5</span>
                <span>7,0</span>
            </div>
        </div>
    );
}

function MockExamCard(): React.JSX.Element {
    return (
        <div className="border-border rounded-[18px] border bg-white p-6 shadow-[0_24px_50px_rgba(11,11,17,0.1)]">
            <div className="mb-4 flex items-center justify-between">
                <Tag tone="primary" size="sm" className="text-[10px] font-bold">
                    PREGUNTA 04 DE 12
                </Tag>
                <Tag
                    tone="default"
                    size="sm"
                    className="bg-ink h-5 font-mono text-[10px] text-white"
                >
                    3 PTS · 45s
                </Tag>
            </div>
            <h4 className="font-display text-ink mb-5 text-[22px] leading-[1.2] font-medium tracking-tight">
                ¿Cuál fue la principal consecuencia de la Reforma Agraria iniciada en 1962?
            </h4>
            <div className="flex flex-col gap-2">
                {[
                    ['A', 'Redistribución de tierras y reorganización del agro', true],
                    ['B', 'Aumento de la inversión minera estatal', false],
                    ['C', 'Creación del Banco del Estado', false],
                ].map(([k, t, sel]) => (
                    <div
                        key={k as string}
                        className={cn(
                            'flex items-center gap-3 rounded-[10px] border p-3 transition-all',
                            sel
                                ? 'border-primary bg-primary-wash'
                                : 'border-border hover:bg-paper-warm',
                        )}
                    >
                        <span
                            className={cn(
                                'flex size-6 items-center justify-center rounded-[6px] font-mono text-[10px] font-bold',
                                sel ? 'bg-primary text-white' : 'border-border text-mute border',
                            )}
                        >
                            {k as string}
                        </span>
                        <span
                            className={cn(
                                'text-[13.5px] font-medium',
                                sel ? 'text-ink' : 'text-ink-dim',
                            )}
                        >
                            {t as string}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Walkthrough Row ────────────────────────────────────────────────────────

interface WalkRowProps {
    tag: string;
    title: string;
    body: string;
    points: string[];
    mockup: React.ReactNode;
    flip?: boolean;
}

function WalkRow({ tag, title, body, points, mockup, flip }: WalkRowProps): React.JSX.Element {
    return (
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
            <div className={cn('order-2 lg:order-none', flip ? 'lg:order-2' : '')}>{mockup}</div>
            <div className={cn('order-1 space-y-5 lg:order-none', flip ? 'lg:order-1' : '')}>
                <Tag tone="primary" size="sm" className="font-bold">
                    {tag}
                </Tag>
                <h3 className="font-display text-ink text-[44px] leading-[1.05] font-medium tracking-tight">
                    {title}
                </h3>
                <p className="text-ink-dim max-w-[460px] text-[17px] leading-[1.55]">{body}</p>
                <ul className="space-y-3 pt-2">
                    {points.map((p) => (
                        <li
                            key={p}
                            className="text-ink flex items-start gap-3 text-[14.5px] font-medium"
                        >
                            <Check className="text-primary mt-0.5 size-4 shrink-0" />
                            <span>{p}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export function L3Walkthrough(): React.JSX.Element {
    return (
        <section className="bg-white py-24 md:py-32" id="producto">
            <div className="mx-auto max-w-[1400px] px-6 md:px-14">
                <div className="mb-20 text-center md:mb-28">
                    <Tag tone="primary" size="sm" className="font-bold">
                        POR DENTRO
                    </Tag>
                    <h2 className="font-display text-ink mt-5 text-[48px] leading-none font-medium tracking-[-0.03em] md:text-[64px]">
                        Tres flujos.{' '}
                        <em className="text-primary font-display italic not-italic">
                            Tres pantallas
                        </em>
                        .
                    </h2>
                </div>

                <div className="space-y-32 md:space-y-48">
                    <WalkRow
                        tag="PARA EL DOCENTE"
                        title="Un banco de preguntas que crece contigo."
                        body="Cada unidad alimenta un banco reutilizable. Filtrás por curso, dificultad, unidad o uso histórico. Crear el próximo examen es elegir, no escribir de nuevo."
                        points={[
                            'Importás desde Excel o Forms',
                            'Tags y dificultad por pregunta',
                            'Histórico de uso por examen',
                        ]}
                        mockup={<MockBank />}
                    />
                    <WalkRow
                        flip
                        tag="PARA EL ESTUDIANTE"
                        title="Un examen que no se siente burocrático."
                        body="Entrada por RUT o Correo Electrónico, una pregunta a la vez, autoguardado tras cada respuesta. Sin Forms genéricos, sin PDFs interminables, sin ‘envíe nuevamente’."
                        points={[
                            'Login por RUT o Email sin contraseña',
                            'Autoguardado por respuesta',
                            'Modo daltónico y alto contraste',
                        ]}
                        mockup={<MockExamCard />}
                    />
                    <WalkRow
                        tag="PARA LA UTP"
                        title="Resultados que tú puedes explicar al consejo."
                        body="Notas calculadas con tu escala, dispersión y comparativa por unidad. Exportas a Excel cuando te lo piden, pero ya no es la única forma de ver."
                        points={[
                            'Escala chilena 1.0–7.0 configurable',
                            'Distribución y dispersión por curso',
                            'Exportable a XLSX y PDF',
                        ]}
                        mockup={<MockResults />}
                    />
                </div>
            </div>
        </section>
    );
}
