'use client';

import { Tag } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { Check, X } from 'lucide-react';
import type React from 'react';

const COMPARISON_ROWS = [
    ['Login por RUT con validación', false, false, true],
    ['Multi-institución con slug propio', false, true, true],
    ['Resultados pregunta a pregunta en vivo', false, false, true],
    ['Notas calculadas con escala chilena', false, true, true],
    ['Anti-copia (orden aleatorio, bloqueo)', false, true, true],
    ['Banco reutilizable por curso/unidad', false, true, true],
    ['Importación desde Excel', true, true, true],
    ['Soporte humano en español', false, false, true],
    ['Costo por estudiante', '$', '$$', 'No'],
];

export function L3Comparison(): React.JSX.Element {
    return (
        <section className="bg-paper-warm py-24 md:py-32" id="comparativa">
            <div className="mx-auto max-w-[1400px] px-6 md:px-14">
                <Tag tone="primary" size="sm" className="font-bold">COMPARATIVA</Tag>
                <h2 className="mt-5 font-display text-[42px] md:text-[56px] font-medium tracking-[-0.03em] leading-[1.05] text-ink max-w-[840px] mb-16">
                    Forms es una hoja en blanco. Moodle es un buque carguero.
                    <br />
                    <em className="text-primary not-italic italic">Aulika es una herramienta de aula.</em>
                </h2>

                <div className="overflow-hidden rounded-[22px] border border-border bg-white shadow-xl">
                    <div className="grid grid-cols-[2fr_1fr_1fr_1.2fr] bg-paper border-b border-border px-8 py-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-mute">
                        <span>Característica</span>
                        <span className="text-center">Google Forms</span>
                        <span className="text-center">Moodle</span>
                        <span className="text-center text-primary">Aulika</span>
                    </div>

                    <div className="divide-y divide-border">
                        {COMPARISON_ROWS.map(([label, a, b, c], i) => (
                            <div key={label as string} className="grid grid-cols-[2fr_1fr_1fr_1.2fr] px-8 py-4 items-center group transition-colors hover:bg-paper-warm/30">
                                <span className="text-[14.5px] font-bold text-ink">{label as string}</span>
                                {[a, b, c].map((val, j) => {
                                    const isAulika = j === 2;
                                    return (
                                        <div key={j} className="flex justify-center items-center">
                                            {typeof val === 'boolean' ? (
                                                val ? (
                                                    <div className={cn(
                                                        "size-6 rounded-full flex items-center justify-center",
                                                        isAulika ? "bg-primary text-white" : "bg-success/20 text-success"
                                                    )}>
                                                        <Check size={14} strokeWidth={3} />
                                                    </div>
                                                ) : (
                                                    <X size={16} className="text-mute opacity-30" />
                                                )
                                            ) : (
                                                <span className={cn(
                                                    "font-mono text-[12px] font-bold",
                                                    isAulika ? "text-primary bg-primary-wash px-2 py-0.5 rounded-full" : "text-mute"
                                                )}>
                                                    {val as string}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
