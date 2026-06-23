'use client';

import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { HELP_SECTIONS, type HelpSection } from '@/features/help/lib/help-content';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface HelpGuideProps {
    isProfesor: boolean;
}

function accessBadge(section: HelpSection): { label: string; tone: string } | null {
    if (section.professorAccess === 'scoped') {
        return { label: 'Tus grupos', tone: 'bg-primary-wash text-primary' };
    }
    if (section.professorAccess === 'readonly') {
        return { label: 'Solo lectura', tone: 'bg-paper-warm text-ink-dim' };
    }
    return null;
}

const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export function HelpGuide({ isProfesor }: HelpGuideProps): React.JSX.Element {
    // El profesor no ve las secciones que no le corresponden (p. ej. Ajustes).
    const sections = HELP_SECTIONS.filter((s) => !isProfesor || s.professorAccess !== 'none');

    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState(1);

    const total = sections.length;
    const goTo = useCallback(
        (next: number) => {
            if (next < 0 || next >= total || next === index) return;
            setDirection(next > index ? 1 : -1);
            setIndex(next);
        },
        [index, total],
    );

    useEffect(() => {
        function onKey(e: KeyboardEvent): void {
            if (e.key === 'ArrowRight') goTo(index + 1);
            if (e.key === 'ArrowLeft') goTo(index - 1);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [goTo, index]);

    const section = sections[index];
    if (!section) return <div className="bg-paper min-h-screen" />;

    const badge = isProfesor ? accessBadge(section) : null;
    const showSteps = !isProfesor || section.professorAccess === 'scoped';
    const screenshot = isProfesor
        ? (section.screenshots.professor ?? section.screenshots.admin)
        : section.screenshots.admin;

    return (
        <>
            <AdminTopBar
                title="Centro de ayuda"
                breadcrumb={['Institución', 'Ayuda']}
                icon={<HelpCircle size={26} />}
                subtitle={
                    isProfesor
                        ? 'Guía de uso del panel para profesores. Navegá las secciones para ver para qué sirve cada una y cómo se usa.'
                        : 'Guía de uso del panel para administradores. Navegá las secciones para ver para qué sirve cada una y cómo se usa.'
                }
                actions={
                    <div className="flex items-center gap-2">
                        <span className="text-mute font-mono text-[11px] tabular-nums">
                            {index + 1} / {total}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => goTo(index - 1)}
                            disabled={index === 0}
                            aria-label="Sección anterior"
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => goTo(index + 1)}
                            disabled={index === total - 1}
                            aria-label="Sección siguiente"
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                }
            />

            <main className="flex-1 p-8">
                {/* Tabs de navegación */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {sections.map((s, i) => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => goTo(i)}
                            className={cn(
                                'flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors',
                                i === index
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-border text-ink-dim hover:bg-paper-warm bg-white',
                            )}
                        >
                            <s.icon size={14} className="shrink-0" />
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Sección activa (slider horizontal) */}
                <div className="relative overflow-hidden">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.section
                            key={section.id}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="border-border rounded-[16px] border bg-white p-6 lg:p-8"
                        >
                            <div className="grid gap-8 lg:grid-cols-2">
                            {/* Texto */}
                            <div className="min-w-0">
                                <div className="mb-3 flex items-center gap-3">
                                    <span className="bg-primary-wash text-primary flex size-9 shrink-0 items-center justify-center rounded-[10px]">
                                        <section.icon size={18} />
                                    </span>
                                    <h2 className="font-display text-ink flex-1 text-[24px] leading-none font-semibold tracking-[-0.02em]">
                                        {section.label}
                                    </h2>
                                    {badge && (
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.06em] uppercase',
                                                badge.tone,
                                            )}
                                        >
                                            {badge.label}
                                        </span>
                                    )}
                                </div>

                                <p className="text-ink-dim text-[14px] leading-relaxed">
                                    {section.purpose}
                                </p>

                                {showSteps && (
                                    <div className="mt-5">
                                        <p className="text-mute mb-3 font-mono text-[10px] tracking-[0.1em] uppercase">
                                            Cómo se usa
                                        </p>
                                        <ol className="flex flex-col gap-2.5">
                                            {section.steps.map((step, i) => (
                                                <li key={step} className="flex items-start gap-3">
                                                    <span className="bg-ink mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold text-white">
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-ink-dim text-[13px] leading-relaxed">
                                                        {step}
                                                    </span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}

                                {isProfesor && section.professorNote && (
                                    <p className="bg-primary-wash/40 text-ink-dim mt-5 rounded-[10px] px-4 py-3 text-[13px] leading-relaxed">
                                        {section.professorNote}
                                    </p>
                                )}
                                {!isProfesor && section.adminNote && (
                                    <p className="bg-paper-warm text-ink-dim mt-5 rounded-[10px] px-4 py-3 text-[13px] leading-relaxed">
                                        {section.adminNote}
                                    </p>
                                )}
                            </div>

                            {/* Captura */}
                            {screenshot && (
                                <div className="border-border self-start overflow-hidden rounded-[12px] border">
                                    {/* Captura del panel (datos de ejemplo). */}
                                    {/* biome-ignore lint/performance/noImgElement: captura estática de alto variable, lazy y fuera del LCP; next/image exige dimensiones fijas */}
                                    <img
                                        src={screenshot}
                                        alt={`Captura de la sección ${section.label}`}
                                        loading="lazy"
                                        className="w-full"
                                    />
                                </div>
                            )}
                            </div>

                            {/* Formularios de la sección (solo a quien la gestiona) */}
                            {showSteps && section.forms && section.forms.length > 0 && (
                                <div className="border-border mt-8 border-t pt-6">
                                    <p className="text-mute mb-4 font-mono text-[10px] tracking-[0.1em] uppercase">
                                        Formularios
                                    </p>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        {section.forms.map((form) => (
                                            <figure key={form.src} className="min-w-0">
                                                <div className="border-border overflow-hidden rounded-[12px] border">
                                                    {/* biome-ignore lint/performance/noImgElement: captura estática de alto variable, lazy y fuera del LCP; next/image exige dimensiones fijas */}
                                                    <img
                                                        src={form.src}
                                                        alt={form.caption}
                                                        loading="lazy"
                                                        className="w-full"
                                                    />
                                                </div>
                                                <figcaption className="text-mute mt-2 text-[12px] leading-snug">
                                                    {form.caption}
                                                </figcaption>
                                            </figure>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.section>
                    </AnimatePresence>
                </div>
            </main>
        </>
    );
}
