'use client';

import { Tag } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import type React from 'react';

const SEGMENTS = [
    {
        tag: 'COLEGIOS · ESCOLARES',
        title: 'Para tu liceo, técnico o particular subvencionado.',
        body: 'Pruebas semestrales, pautas de la UTP, login por RUT del estudiante. La pizarra digital y nada más.',
        stats: [
            ['1°-IV°', 'medio'],
            ['M-V', 'horario aula'],
        ],
        color: 'var(--primary)',
        pattern: 'stripe',
    },
    {
        tag: 'PREUNIVERSITARIOS',
        title: 'Ensayos PAES, tantos como hagan falta.',
        body: 'Banco de preguntas tipo PAES por eje, simulacros programables, ranking por sede. Pensado para volumen alto.',
        stats: [
            ['+200', 'ensayos/sem'],
            ['Top 10%', 'visible'],
        ],
        color: 'var(--ink)',
        pattern: 'grid',
    },
    {
        tag: 'EDUCACIÓN SUPERIOR',
        title: 'Para universidades, IPs y CFTs.',
        body: 'Cátedras múltiples, examinadores externos, integración con sistemas de matrícula. Soporta evaluación por rúbrica.',
        stats: [
            ['Multi-sede', '✓'],
            ['SSO', 'roadmap Q2'],
        ],
        color: 'var(--lime)',
        pattern: 'dots',
    },
];

function PatternArt({
    pattern,
    color,
    idx,
}: {
    pattern: string;
    color: string;
    idx: number;
}): React.JSX.Element {
    return (
        <div
            className="absolute inset-0 [background-image:var(--pat-img)] [background-size:var(--pat-sz)] opacity-[0.15]"
            style={
                {
                    '--pat-img':
                        idx === 0
                            ? 'repeating-linear-gradient(45deg, var(--lime) 0 12px, transparent 12px 28px)'
                            : idx === 1
                              ? 'linear-gradient(var(--lime) 1px, transparent 1px), linear-gradient(90deg, var(--lime) 1px, transparent 1px)'
                              : 'radial-gradient(circle, var(--ink) 1.5px, transparent 1.5px)',
                    '--pat-sz': idx === 1 ? '24px 24px' : '20px 20px',
                } as React.CSSProperties
            }
        />
    );
}

export function L3Segments(): React.JSX.Element {
    return (
        <section className="bg-white py-24 md:py-32" id="instituciones">
            <div className="mx-auto max-w-[1400px] px-6 md:px-14">
                <div className="mb-16">
                    <Tag tone="primary" size="sm" className="font-bold">
                        PARA QUIÉNES
                    </Tag>
                    <h2 className="font-display text-ink mt-5 max-w-[700px] text-[48px] leading-[1.1] font-medium tracking-[-0.03em] md:text-[56px]">
                        Tres mundos académicos. <br />
                        <em className="text-primary italic not-italic">Un solo lenguaje</em>.
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {SEGMENTS.map((s, i) => (
                        <article
                            key={s.title}
                            className="border-border flex flex-col overflow-hidden rounded-[22px] border bg-white shadow-sm transition-all hover:shadow-md"
                        >
                            {/* Artwork Area */}
                            <div
                                className="relative h-44 overflow-hidden [background-color:var(--seg-bg)]"
                                style={{ '--seg-bg': s.color } as React.CSSProperties}
                            >
                                <PatternArt pattern={s.pattern} color={s.color} idx={i} />
                                <div className="absolute top-6 left-6">
                                    <Tag
                                        tone={i === 2 ? 'ink' : 'lime'}
                                        size="sm"
                                        className="border-none font-bold shadow-sm"
                                    >
                                        {s.tag}
                                    </Tag>
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col p-7">
                                <h3 className="font-display text-ink mb-4 text-[24px] leading-[1.15] font-medium tracking-tight">
                                    {s.title}
                                </h3>
                                <p className="text-ink-dim mb-8 flex-1 text-[14.5px] leading-relaxed">
                                    {s.body}
                                </p>

                                <div className="border-border mt-auto flex gap-8 border-t pt-6">
                                    {s.stats.map(([n, l]) => (
                                        <div key={l}>
                                            <p className="font-display text-ink text-[18px] leading-none font-bold">
                                                {n}
                                            </p>
                                            <p className="text-mute mt-1.5 text-[10.5px] font-bold tracking-widest uppercase">
                                                {l}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
