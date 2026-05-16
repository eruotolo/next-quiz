'use client';

import { Tag } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { Check, MoreHorizontal, GraduationCap, Download, ArrowRight } from 'lucide-react';
import type React from 'react';

// ── Mock Components ────────────────────────────────────────────────────────

function MockBank(): React.JSX.Element {
    return (
        <div className="bg-white border border-border rounded-[18px] p-[18px] shadow-[0_24px_50px_rgba(11,11,17,0.1)]">
            <div className="flex justify-between items-center mb-3.5">
                <Tag tone="default" size="sm" className="font-bold text-[10px]">BANCO DE PREGUNTAS · 412</Tag>
                <span className="font-mono text-[11px] text-mute uppercase tracking-widest">HISTORIA · 3°A</span>
            </div>
            <div className="divide-y divide-border">
                {[
                    { t: 'Reforma Agraria 1962 · principal consecuencia', tags: ['Unidad 4', 'fácil', 'usada 3×'], hot: true },
                    { t: 'Régimen militar y DD.HH. — período 1973-1990', tags: ['Unidad 6', 'media', 'usada 7×'], hot: false },
                    { t: 'Concertación · primeros gobiernos democráticos', tags: ['Unidad 7', 'media'], hot: false },
                ].map((q, i) => (
                    <div key={i} className="py-3.5 flex items-center gap-3">
                        <MoreHorizontal className="text-mute/40 size-4 rotate-90 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-bold text-ink mb-1.5 truncate">{q.t}</div>
                            <div className="flex gap-1.5 flex-wrap">
                                {q.tags.map((t) => (
                                    <Tag key={t} size="sm" tone="outline" className="text-[9px] h-5 px-1.5 border-border font-mono">{t}</Tag>
                                ))}
                            </div>
                        </div>
                        {q.hot && <Tag size="sm" tone="lime" className="text-[9px] font-bold h-5 px-1.5">+ agregada</Tag>}
                    </div>
                ))}
            </div>
        </div>
    );
}

function MockResults(): React.JSX.Element {
    const data = [45, 62, 85, 72, 91, 68, 58, 79, 88, 95, 62, 74, 81, 90, 77, 55];
    return (
        <div className="bg-white border border-border rounded-[18px] p-5 shadow-[0_24px_50px_rgba(11,11,17,0.1)]">
            <div className="flex justify-between mb-4.5">
                <div>
                    <div className="font-mono text-[10px] font-bold text-mute uppercase tracking-[0.12em]">
                        DISTRIBUCIÓN DE NOTAS · UNIDAD 4
                    </div>
                    <div className="font-display text-[32px] font-bold tracking-tight text-ink mt-1">
                        5,8 <span className="text-[14px] font-mono font-bold text-mute ml-1">media · σ 1.1</span>
                    </div>
                </div>
                <div className="size-8 rounded-full border border-border flex items-center justify-center text-mute">
                    <Download size={14} />
                </div>
            </div>
            <div className="flex items-end gap-1 height-[160px] px-1 py-4">
                {data.map((d, i) => (
                    <div 
                        key={i} 
                        className="flex-1 rounded-t-[4px] transition-all hover:scale-x-110" 
                        style={{ 
                            height: `${d}%`, 
                            backgroundColor: d >= 80 ? 'var(--success)' : d >= 60 ? 'var(--primary)' : 'var(--warning)' 
                        }} 
                    />
                ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] font-bold text-mute uppercase tracking-widest">
                <span>1,0</span><span>4,0</span><span>5,5</span><span>7,0</span>
            </div>
        </div>
    );
}

function MockExamCard(): React.JSX.Element {
    return (
        <div className="bg-white border border-border rounded-[18px] p-6 shadow-[0_24px_50px_rgba(11,11,17,0.1)]">
            <div className="flex justify-between items-center mb-4">
                <Tag tone="primary" size="sm" className="font-bold text-[10px]">PREGUNTA 04 DE 12</Tag>
                <Tag tone="default" size="sm" className="bg-ink text-white font-mono text-[10px] h-5">3 PTS · 45s</Tag>
            </div>
            <h4 className="font-display text-[22px] font-medium tracking-tight text-ink leading-[1.2] mb-5">
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
                            "flex items-center gap-3 p-3 rounded-[10px] border transition-all",
                            sel 
                                ? "border-primary bg-primary-wash" 
                                : "border-border hover:bg-paper-warm"
                        )}
                    >
                        <span className={cn(
                            "size-6 rounded-[6px] flex items-center justify-center font-mono text-[10px] font-bold",
                            sel ? "bg-primary text-white" : "border border-border text-mute"
                        )}>
                            {k as string}
                        </span>
                        <span className={cn("text-[13.5px] font-medium", sel ? "text-ink" : "text-ink-dim")}>{t as string}</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className={cn("order-2 lg:order-none", flip ? "lg:order-2" : "")}>
                {mockup}
            </div>
            <div className={cn("order-1 lg:order-none space-y-5", flip ? "lg:order-1" : "")}>
                <Tag tone="primary" size="sm" className="font-bold">{tag}</Tag>
                <h3 className="font-display text-[44px] font-medium tracking-tight leading-[1.05] text-ink">
                    {title}
                </h3>
                <p className="text-[17px] leading-[1.55] text-ink-dim max-w-[460px]">
                    {body}
                </p>
                <ul className="space-y-3 pt-2">
                    {points.map((p) => (
                        <li key={p} className="flex items-start gap-3 text-[14.5px] font-medium text-ink">
                            <Check className="size-4 text-primary shrink-0 mt-0.5" />
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
                <div className="text-center mb-20 md:mb-28">
                    <Tag tone="primary" size="sm" className="font-bold">POR DENTRO</Tag>
                    <h2 className="mt-5 font-display text-[48px] md:text-[64px] font-medium tracking-[-0.03em] leading-none text-ink">
                        Tres flujos. <em className="text-primary not-italic font-display italic">Tres pantallas</em>.
                    </h2>
                </div>

                <div className="space-y-32 md:space-y-48">
                    <WalkRow
                        tag="PARA EL DOCENTE"
                        title="Un banco de preguntas que crece contigo."
                        body="Cada unidad alimenta un banco reutilizable. Filtrás por curso, dificultad, unidad o uso histórico. Crear el próximo examen es elegir, no escribir de nuevo."
                        points={['Importás desde Excel o Forms', 'Tags y dificultad por pregunta', 'Histórico de uso por examen']}
                        mockup={<MockBank />}
                    />
                    <WalkRow
                        flip
                        tag="PARA EL ESTUDIANTE"
                        title="Un examen que no se siente burocrático."
                        body="Entrada por RUT o Correo Electrónico, una pregunta a la vez, autoguardado tras cada respuesta. Sin Forms genéricos, sin PDFs interminables, sin ‘envíe nuevamente’."
                        points={['Login por RUT o Email sin contraseña', 'Autoguardado por respuesta', 'Modo daltónico y alto contraste']}
                        mockup={<MockExamCard />}
                    />
                    <WalkRow
                        tag="PARA LA UTP"
                        title="Resultados que vos podés explicar al consejo."
                        body="Notas calculadas con tu escala, dispersión y comparativa por unidad. Exportás a Excel cuando te lo piden, pero ya no es la única forma de ver."
                        points={['Escala chilena 1.0–7.0 configurable', 'Distribución y dispersión por curso', 'Exportable a XLSX y PDF']}
                        mockup={<MockResults />}
                    />
                </div>
            </div>
        </section>
    );
}
