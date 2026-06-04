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
                <Tag tone="primary" size="sm" className="font-bold">
                    COMPARATIVA
                </Tag>
                <h2 className="font-display text-ink mt-5 mb-16 max-w-[840px] text-[42px] leading-[1.05] font-medium tracking-[-0.03em] md:text-[56px]">
                    Forms es una hoja en blanco. Moodle es un buque carguero.
                    <br />
                    <em className="text-primary italic not-italic">
                        Aulika es una herramienta de aula.
                    </em>
                </h2>

                <div className="border-border overflow-hidden rounded-[22px] border bg-white shadow-xl">
                    <div className="bg-paper border-border text-mute grid grid-cols-[2fr_1fr_1fr_1.2fr] border-b px-8 py-5 font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
                        <span>Característica</span>
                        <span className="text-center">Google Forms</span>
                        <span className="text-center">Moodle</span>
                        <span className="text-primary text-center">Aulika</span>
                    </div>

                    <div className="divide-border divide-y">
                        {COMPARISON_ROWS.map(([label, a, b, c], i) => (
                            <div
                                key={label as string}
                                className="group hover:bg-paper-warm/30 grid grid-cols-[2fr_1fr_1fr_1.2fr] items-center px-8 py-4 transition-colors"
                            >
                                <span className="text-ink text-[14.5px] font-bold">
                                    {label as string}
                                </span>
                                {[a, b, c].map((val, j) => {
                                    const isAulika = j === 2;
                                    return (
                                        <div key={j} className="flex items-center justify-center">
                                            {typeof val === 'boolean' ? (
                                                val ? (
                                                    <div
                                                        className={cn(
                                                            'flex size-6 items-center justify-center rounded-full',
                                                            isAulika
                                                                ? 'bg-primary text-white'
                                                                : 'bg-success/20 text-success',
                                                        )}
                                                    >
                                                        <Check size={14} strokeWidth={3} />
                                                    </div>
                                                ) : (
                                                    <X size={16} className="text-mute opacity-30" />
                                                )
                                            ) : (
                                                <span
                                                    className={cn(
                                                        'font-mono text-[12px] font-bold',
                                                        isAulika
                                                            ? 'text-primary bg-primary-wash rounded-full px-2 py-0.5'
                                                            : 'text-mute',
                                                    )}
                                                >
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
