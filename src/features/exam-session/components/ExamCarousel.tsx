'use client';

import {
    autoSubmit,
    finishExam,
    recordTabSwitch,
    submitAnswer,
    toggleMarkQuestion,
} from '@/features/exam-session/actions/mutations';
import type { SafeExam } from '@/features/exam-session/types/exam.types';
import { Button } from '@/shared/components/ui/button';
import { LogoMark, LogoWordmark } from '@/shared/components/branding/logo';
import { cn } from '@/shared/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Flag, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Timer } from './Timer';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

interface ExamCarouselProps {
    exam: SafeExam;
    initialSeconds: number;
}

export function ExamCarousel({ exam, initialSeconds }: ExamCarouselProps): React.JSX.Element {
    const router = useRouter();
    const submittedRef = useRef(false);
    const lastStrikeAtRef = useRef(0);
    const tabLeftAtRef = useRef(0);

    const [strikes, setStrikes] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
    const [direction, setDirection] = useState(1);
    const [answeredSet, setAnsweredSet] = useState<Set<string>>(new Set());
    const [markedSet, setMarkedSet] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();

    const totalQuestions = exam.questions.length;
    const currentQuestion = exam.questions[currentIndex];
    const isLastQuestion = currentIndex === totalQuestions - 1;
    const progressPct = ((currentIndex + 1) / totalQuestions) * 100;

    const finalizeAndRedirect = useCallback(
        async (mode: 'manual' | 'auto'): Promise<void> => {
            if (submittedRef.current) return;
            submittedRef.current = true;
            try {
                const res = mode === 'auto' ? await autoSubmit() : await finishExam();
                router.replace(`/examen/resultado/${res.resultId}`);
            } catch (err) {
                submittedRef.current = false;
                toast.error('Error al enviar', {
                    description: 'No se pudo enviar el examen. Intentá de nuevo.',
                });
                console.error(err);
            }
        },
        [router],
    );

    const handleTimeout = useCallback(() => {
        toast.warning('¡Tiempo agotado!', {
            description: 'El examen se envió automáticamente.',
        });
        void finalizeAndRedirect('auto');
    }, [finalizeAndRedirect]);

    const handleSelect = (optionId: string): void => {
        if (!currentQuestion) return;
        if (currentQuestion.questionType === 'MULTIPLE') {
            setSelectedOptionIds((prev) =>
                prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
            );
        } else {
            setSelectedOptionIds([optionId]);
        }
    };

    const handleToggleMark = (): void => {
        if (!currentQuestion) return;
        const qId = currentQuestion.id;
        setMarkedSet((prev) => {
            const next = new Set(prev);
            if (next.has(qId)) {
                next.delete(qId);
            } else {
                next.add(qId);
            }
            return next;
        });
        void toggleMarkQuestion(qId);
    };

    const saveCurrentAndNavigate = (nextIndex: number): void => {
        const questionId = currentQuestion?.id;
        const optionIds = selectedOptionIds;

        if (questionId && optionIds.length > 0) {
            startTransition(async () => {
                try {
                    await submitAnswer({ questionId, optionIds });
                    setAnsweredSet((prev) => new Set([...prev, questionId]));
                } catch {
                    // Silent: user will see pending state
                }
            });
        }

        setDirection(nextIndex > currentIndex ? 1 : -1);
        setCurrentIndex(nextIndex);
        setSelectedOptionIds([]);
    };

    const handleNext = (): void => {
        if (!currentQuestion || selectedOptionIds.length === 0) return;
        const questionId = currentQuestion.id;
        const optionIds = selectedOptionIds;

        startTransition(async () => {
            try {
                await submitAnswer({ questionId, optionIds });
                setAnsweredSet((prev) => new Set([...prev, questionId]));
                if (isLastQuestion) {
                    await finalizeAndRedirect('manual');
                    return;
                }
                setDirection(1);
                setCurrentIndex((i) => i + 1);
                setSelectedOptionIds([]);
            } catch {
                toast.error('Error al guardar', {
                    description: 'No se pudo guardar la respuesta. Reintentá.',
                });
            }
        });
    };

    const handlePrev = (): void => {
        if (currentIndex === 0) return;
        saveCurrentAndNavigate(currentIndex - 1);
    };

    const handleJump = (idx: number): void => {
        if (idx === currentIndex) return;
        saveCurrentAndNavigate(idx);
    };

    // Block navigation away
    useEffect(() => {
        const onBeforeUnload = (e: BeforeUnloadEvent): void => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);

        history.pushState(null, '', window.location.href);
        const onPopState = (): void => {
            history.pushState(null, '', window.location.href);
            toast.warning('Navegación bloqueada', {
                description: 'No podés salir mientras el examen está en curso.',
            });
        };
        window.addEventListener('popstate', onPopState);

        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            window.removeEventListener('popstate', onPopState);
        };
    }, []);

    // Tab surveillance: behavior determined by antiCheatEnabled + lockTabSwitch
    useEffect(() => {
        if (!exam.antiCheatEnabled) return;

        const STORAGE_KEY = `exam:${exam.id}:strikes`;
        const saved = Number(sessionStorage.getItem(STORAGE_KEY) ?? '0');
        if (saved > 0 && saved <= 3) setStrikes(saved);

        const mountedAt = Date.now();
        const DEBOUNCE_MS = 800;
        const INITIAL_GRACE_MS = 500;

        // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: unified handler for two surveillance modes (lockTabSwitch + 3-strike) — splitting would scatter the guard clauses across files
        const handleSwitch = (): void => {
            if (submittedRef.current) return;
            if (Date.now() - mountedAt < INITIAL_GRACE_MS) return;

            if (exam.lockTabSwitch) {
                toast.error('Salida detectada. Examen enviado automáticamente.');
                void finalizeAndRedirect('auto');
                return;
            }

            if (Date.now() - lastStrikeAtRef.current < DEBOUNCE_MS) return;
            lastStrikeAtRef.current = Date.now();

            const durationMs = tabLeftAtRef.current > 0 ? Date.now() - tabLeftAtRef.current : 0;
            if (durationMs > 0) void recordTabSwitch(durationMs);

            setStrikes((prev) => {
                const next = prev + 1;
                sessionStorage.setItem(STORAGE_KEY, String(next));
                if (next === 1) {
                    toast.warning('1/3 — Volvé al examen ya', {
                        description: 'Si salís 3 veces el examen se envía automáticamente.',
                    });
                } else if (next === 2) {
                    toast.warning('2/3 — Último aviso', {
                        description: 'El próximo strike envía el examen.',
                    });
                } else if (next >= 3) {
                    toast.error('Excediste los intentos permitidos. Examen enviado.');
                    void finalizeAndRedirect('auto');
                }
                return next;
            });
        };

        const onVisibilityChange = (): void => {
            if (document.hidden) {
                tabLeftAtRef.current = Date.now();
                if (exam.lockTabSwitch) handleSwitch();
            } else {
                if (!exam.lockTabSwitch) handleSwitch();
            }
        };

        const onBlur = (): void => {
            tabLeftAtRef.current = Date.now();
            handleSwitch();
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('blur', onBlur);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('blur', onBlur);
        };
    }, [exam.antiCheatEnabled, exam.lockTabSwitch, exam.id, finalizeAndRedirect]);

    if (!currentQuestion) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-paper">
                <p className="text-mute">Este examen no tiene preguntas disponibles.</p>
            </div>
        );
    }

    const variants = {
        enter: (d: number) => ({ x: d > 0 ? 32 : -32, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (d: number) => ({ x: d > 0 ? -32 : 32, opacity: 0 }),
    };

    const isMarked = markedSet.has(currentQuestion.id);

    return (
        <div className="flex min-h-screen flex-col bg-paper">
            {/* Top bar */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-3">
                <div className="flex items-center gap-3">
                    <LogoMark size={26} />
                    <div className="h-4 w-px bg-border" />
                    <span className="max-w-[200px] truncate font-mono text-[11px] uppercase tracking-[0.08em] text-mute">
                        {exam.title}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 font-mono text-[10px] text-mute">
                        <span className="size-1.5 animate-pulse rounded-full bg-success" />
                        Autoguardado
                    </span>
                    {exam.antiCheatEnabled && strikes > 0 && (
                        <span
                            className={cn(
                                'rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold',
                                strikes === 1 && 'bg-warning-wash text-warning',
                                strikes === 2 && 'bg-warning-wash text-warning',
                                strikes >= 3 && 'bg-danger-wash text-destructive',
                            )}
                        >
                            {strikes}/3 fuera de pestaña
                        </span>
                    )}
                    <LogoWordmark size={14} color="#75716b" />
                </div>
            </header>

            {/* Progress bar */}
            <div className="h-1 bg-border">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progressPct}%` }}
                />
            </div>

            {/* Content */}
            <div className="flex flex-1">
                {/* Sidebar */}
                <aside className="hidden w-[260px] shrink-0 flex-col gap-5 border-r border-border bg-white p-5 lg:flex">
                    {/* Question map */}
                    <div>
                        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em] text-mute">
                            Mapa de preguntas
                        </p>
                        <div className="grid grid-cols-4 gap-1.5">
                            {exam.questions.map((q, idx) => {
                                const isDone = answeredSet.has(q.id);
                                const isCurrent = currentIndex === idx;
                                const qIsMarked = markedSet.has(q.id);
                                return (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => handleJump(idx)}
                                        className={cn(
                                            'relative h-11 rounded-[6px] font-mono text-[11px] font-semibold transition-colors',
                                            isCurrent &&
                                                'border-2 border-lime bg-lime text-ink',
                                            !isCurrent &&
                                                isDone &&
                                                'bg-primary text-white',
                                            !isCurrent &&
                                                !isDone &&
                                                'border border-border bg-white text-mute hover:border-primary/40',
                                        )}
                                    >
                                        {String(idx + 1).padStart(2, '0')}
                                        {qIsMarked && (
                                            <span className="absolute right-0.5 top-0.5 size-2 rounded-full bg-coral" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5">
                            {[
                                { color: 'bg-primary', label: 'Respondida' },
                                { color: 'bg-lime border border-lime', label: 'Actual' },
                                { color: 'border border-border', label: 'Pendiente' },
                                { color: 'border border-border relative', label: 'Marcada', dot: true },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-1.5 font-mono text-[9px] text-mute">
                                    <div className={cn('relative size-3 rounded-sm shrink-0', item.color)}>
                                        {item.dot && (
                                            <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-coral" />
                                        )}
                                    </div>
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timer card — overrides CSS vars for dark bg */}
                    <div
                        className="flex flex-col items-center rounded-[10px] bg-ink py-5"
                        style={
                            {
                                '--foreground': '#ffffff',
                                '--border': 'rgba(255,255,255,0.12)',
                            } as React.CSSProperties
                        }
                    >
                        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">
                            Tiempo
                        </p>
                        <Timer initialSeconds={initialSeconds} onTimeout={handleTimeout} />
                    </div>
                </aside>

                {/* Question area */}
                <main className="flex flex-1 items-start justify-center p-6 lg:p-10">
                    <div className="w-full max-w-2xl">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={currentIndex}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.18, ease: 'easeInOut' }}
                            >
                                <div className="rounded-[18px] border border-border bg-white p-8 shadow-sm lg:p-10">
                                    {/* Question header */}
                                    <div className="mb-7 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-full bg-primary px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                                                Pregunta {currentIndex + 1} de {totalQuestions}
                                            </span>
                                            <span className="rounded-full bg-paper-warm px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-mute">
                                                {currentQuestion.points} pt
                                                {currentQuestion.points !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleToggleMark}
                                            className={cn(
                                                'flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors',
                                                isMarked
                                                    ? 'bg-coral/10 text-coral'
                                                    : 'bg-paper-warm text-mute hover:bg-coral/10 hover:text-coral',
                                            )}
                                        >
                                            <Flag size={11} />
                                            {isMarked ? 'Marcada' : 'Marcar'}
                                        </button>
                                    </div>

                                    {/* Question text */}
                                    <h2 className="mb-8 font-display text-[26px] font-semibold leading-snug tracking-[-0.02em] text-ink lg:text-[30px]">
                                        {currentQuestion.text}
                                    </h2>

                                    {/* Options */}
                                    <fieldset
                                        className="m-0 flex flex-col gap-3 border-0 p-0"
                                        aria-label="Opciones de respuesta"
                                    >
                                        {currentQuestion.options.map((option, idx) => {
                                            const label = LABELS[idx] ?? String(idx + 1);
                                            const isSelected = selectedOptionIds.includes(option.id);
                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    disabled={isPending}
                                                    onClick={() => handleSelect(option.id)}
                                                    aria-pressed={isSelected}
                                                    className={cn(
                                                        'flex w-full items-center gap-4 rounded-[12px] border px-5 py-[18px] text-left transition-all',
                                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                                                        'disabled:cursor-not-allowed disabled:opacity-60',
                                                        isSelected
                                                            ? 'border-primary bg-primary-wash shadow-sm'
                                                            : 'border-border bg-white hover:border-primary/40 hover:bg-primary-wash/30',
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'flex size-[30px] shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold transition-colors',
                                                            isSelected
                                                                ? 'bg-primary text-white'
                                                                : 'bg-paper-warm text-mute',
                                                        )}
                                                    >
                                                        {label}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'flex-1 text-[15px]',
                                                            isSelected
                                                                ? 'font-medium text-primary'
                                                                : 'text-ink',
                                                        )}
                                                    >
                                                        {option.text}
                                                    </span>
                                                    {isSelected && (
                                                        <svg
                                                            aria-hidden="true"
                                                            width="18"
                                                            height="18"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="3"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="text-primary shrink-0"
                                                        >
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </fieldset>

                                    {/* Footer navigation */}
                                    <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                                        <Button
                                            variant="ghost"
                                            size="default"
                                            onClick={handlePrev}
                                            disabled={currentIndex === 0 || isPending}
                                        >
                                            ← Anterior
                                        </Button>

                                        <span className="hidden font-mono text-[10px] text-mute sm:block">
                                            {answeredSet.has(currentQuestion.id)
                                                ? 'Respuesta guardada'
                                                : 'Sin responder aún'}
                                        </span>

                                        <Button
                                            variant="primary"
                                            size="default"
                                            onClick={handleNext}
                                            disabled={selectedOptionIds.length === 0 || isPending}
                                        >
                                            {isPending ? (
                                                <Loader2 className="animate-spin" />
                                            ) : isLastQuestion ? (
                                                'Finalizar →'
                                            ) : (
                                                'Siguiente →'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
}
