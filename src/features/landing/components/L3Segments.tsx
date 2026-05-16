'use client';

import { Tag } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import type React from 'react';

const SEGMENTS = [
    {
        tag: 'COLEGIOS · ESCOLARES',
        title: 'Para tu liceo, técnico o particular subvencionado.',
        body: 'Pruebas semestrales, pautas de la UTP, login por RUT del estudiante. La pizarra digital y nada más.',
        stats: [['1°-IV°', 'medio'], ['M-V', 'horario aula']],
        color: 'var(--primary)',
        pattern: 'stripe',
    },
    {
        tag: 'PREUNIVERSITARIOS',
        title: 'Ensayos PAES, tantos como hagan falta.',
        body: 'Banco de preguntas tipo PAES por eje, simulacros programables, ranking por sede. Pensado para volumen alto.',
        stats: [['+200', 'ensayos/sem'], ['Top 10%', 'visible']],
        color: 'var(--ink)',
        pattern: 'grid',
    },
    {
        tag: 'EDUCACIÓN SUPERIOR',
        title: 'Para universidades, IPs y CFTs.',
        body: 'Cátedras múltiples, examinadores externos, integración con sistemas de matrícula. Soporta evaluación por rúbrica.',
        stats: [['Multi-sede', '✓'], ['SSO', 'roadmap Q2']],
        color: 'var(--lime)',
        pattern: 'dots',
    },
];

function PatternArt({ pattern, color, idx }: { pattern: string; color: string; idx: number }): React.JSX.Element {
    return (
        <div 
            className="absolute inset-0 opacity-[0.15]"
            style={{
                backgroundImage: idx === 0
                  ? "repeating-linear-gradient(45deg, var(--lime) 0 12px, transparent 12px 28px)"
                  : idx === 1
                  ? "linear-gradient(var(--lime) 1px, transparent 1px), linear-gradient(90deg, var(--lime) 1px, transparent 1px)"
                  : "radial-gradient(circle, var(--ink) 1.5px, transparent 1.5px)",
                backgroundSize: idx === 1 ? '24px 24px' : '20px 20px',
            }}
        />
    );
}

export function L3Segments(): React.JSX.Element {
    return (
        <section className="bg-white py-24 md:py-32" id="instituciones">
            <div className="mx-auto max-w-[1400px] px-6 md:px-14">
                <div className="mb-16">
                    <Tag tone="primary" size="sm" className="font-bold">PARA QUIÉNES</Tag>
                    <h2 className="mt-5 font-display text-[48px] md:text-[56px] font-medium tracking-[-0.03em] leading-[1.1] text-ink max-w-[700px]">
                        Tres mundos académicos. <br />
                        <em className="text-primary not-italic italic">Un solo lenguaje</em>.
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {SEGMENTS.map((s, i) => (
                        <article 
                            key={s.title} 
                            className="bg-white border border-border rounded-[22px] overflow-hidden flex flex-col shadow-sm transition-all hover:shadow-md"
                        >
                            {/* Artwork Area */}
                            <div className="h-44 relative overflow-hidden" style={{ backgroundColor: s.color }}>
                                <PatternArt pattern={s.pattern} color={s.color} idx={i} />
                                <div className="absolute left-6 top-6">
                                    <Tag tone={i === 2 ? 'ink' : 'lime'} size="sm" className="font-bold border-none shadow-sm">{s.tag}</Tag>
                                </div>
                            </div>

                            <div className="p-7 flex-1 flex flex-col">
                                <h3 className="font-display text-[24px] font-medium tracking-tight text-ink leading-[1.15] mb-4">
                                    {s.title}
                                </h3>
                                <p className="text-[14.5px] leading-relaxed text-ink-dim mb-8 flex-1">
                                    {s.body}
                                </p>
                                
                                <div className="mt-auto pt-6 border-t border-border flex gap-8">
                                    {s.stats.map(([n, l]) => (
                                        <div key={l}>
                                            <p className="font-display text-[18px] font-bold text-ink leading-none">{n}</p>
                                            <p className="text-[10.5px] font-bold text-mute uppercase tracking-widest mt-1.5">{l}</p>
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
