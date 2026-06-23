'use client';

import {
    autoSubmit,
    finishExam,
    recordAnswerTiming,
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
import { Timer } from '@/shared/components/ui/timer';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

interface ExamCarouselProps {
    exam: SafeExam;
    initialSeconds: number;
    initialAnswers?: Record<string, string[]>;
    initialMarked?: string[];
}

export function ExamCarousel({
    exam,
    initialSeconds,
    initialAnswers,
    initialMarked,
}: ExamCarouselProps): React.JSX.Element {
    const router = useRouter();
    const submittedRef = useRef(false);
    const tabLeftAtRef = useRef(0);
    const questionEnteredAtRef = useRef(Date.now());
    const strikesKey = `exam:${exam.id}:strikes`;

    const [strikes, setStrikes] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    // Mapa de respuestas guardadas (hidratado desde DB para reanudar).
    // answersMapRef mirrors the state so async callbacks always read the latest value
    // without stale closure issues when the user navigates between questions quickly.
    const answersMapRef = useRef<Record<string, string[]>>(initialAnswers ?? {});
    const [_answersMap, setAnswersMapState] = useState<Record<string, string[]>>(
        initialAnswers ?? {},
    );
    function setAnswersMap(qId: string, optIds: string[]): void {
        answersMapRef.current = { ...answersMapRef.current, [qId]: optIds };
        setAnswersMapState((prev) => ({ ...prev, [qId]: optIds }));
    }
    const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(() => {
        const first = exam.questions[0];
        return first ? (initialAnswers?.[first.id] ?? []) : [];
    });
    const [direction, setDirection] = useState(1);
    const [answeredSet, setAnsweredSet] = useState<Set<string>>(
        new Set(Object.keys(initialAnswers ?? {})),
    );
    const [markedSet, setMarkedSet] = useState<Set<string>>(new Set(initialMarked ?? []));
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
                sessionStorage.removeItem(strikesKey);
                router.replace(`/examen/resultado/${res.resultId}`);
            } catch (err) {
                submittedRef.current = false;
                toast.error('Error al enviar', {
                    description: 'No se pudo enviar el examen. Intenta de nuevo.',
                });
                console.error(err);
            }
        },
        [router, strikesKey],
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
                prev.includes(optionId)
                    ? prev.filter((id) => id !== optionId)
                    : [...prev, optionId],
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

    // Una respuesta ya persistida con el mismo set de opciones no se re-guarda.
    const isUnchanged = (questionId: string, optionIds: string[]): boolean => {
        const saved = answersMapRef.current[questionId] ?? [];
        return optionIds.length === saved.length && optionIds.every((id) => saved.includes(id));
    };

    const recordCurrentQuestionTiming = (questionId: string | undefined): void => {
        if (questionId) {
            const ms = Date.now() - questionEnteredAtRef.current;
            if (ms > 0) void recordAnswerTiming(questionId, ms);
        }
        questionEnteredAtRef.current = Date.now();
    };

    const saveCurrentAndNavigate = (nextIndex: number): void => {
        const questionId = currentQuestion?.id;
        recordCurrentQuestionTiming(questionId);
        const optionIds = selectedOptionIds;

        if (questionId && optionIds.length > 0 && !isUnchanged(questionId, optionIds)) {
            startTransition(async () => {
                try {
                    await submitAnswer({ questionId, optionIds });
                    setAnswersMap(questionId, optionIds);
                    setAnsweredSet((prev) => new Set([...prev, questionId]));
                } catch {
                    // Silent: user will see pending state
                }
            });
        }

        const nextQuestion = exam.questions[nextIndex];
        setDirection(nextIndex > currentIndex ? 1 : -1);
        setCurrentIndex(nextIndex);
        // Reads from ref so stale closure after a background save doesn't lose the latest answers.
        setSelectedOptionIds(nextQuestion ? (answersMapRef.current[nextQuestion.id] ?? []) : []);
    };

    const handleNext = (): void => {
        if (!currentQuestion || selectedOptionIds.length === 0) return;

        const questionId = currentQuestion.id;
        recordCurrentQuestionTiming(questionId);
        const optionIds = [...selectedOptionIds];

        if (isLastQuestion) {
            startTransition(async () => {
                try {
                    if (!isUnchanged(questionId, optionIds)) {
                        await submitAnswer({ questionId, optionIds });
                        setAnswersMap(questionId, optionIds);
                    }
                    setAnsweredSet((prev) => new Set([...prev, questionId]));
                    await finalizeAndRedirect('manual');
                } catch {
                    toast.error('Error al guardar', {
                        description: 'No se pudo guardar la respuesta. Intenta de nuevo.',
                    });
                }
            });
            return;
        }

        // For non-last questions: navigate immediately and save in the background.
        // This prevents the race condition where a pending transition could set currentIndex
        // to the wrong value if the user also clicked a sidebar jump button.
        const nextIndex = currentIndex + 1;
        const nextQuestion = exam.questions[nextIndex];
        setDirection(1);
        setCurrentIndex(nextIndex);
        setAnsweredSet((prev) => new Set([...prev, questionId]));
        setSelectedOptionIds(nextQuestion ? (answersMapRef.current[nextQuestion.id] ?? []) : []);

        if (!isUnchanged(questionId, optionIds)) {
            startTransition(async () => {
                try {
                    await submitAnswer({ questionId, optionIds });
                    setAnswersMap(questionId, optionIds);
                } catch {
                    // Background save failure — silent; the user has already moved on
                }
            });
        }
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
                description: 'No puedes salir mientras el examen está en curso.',
            });
        };
        window.addEventListener('popstate', onPopState);

        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            window.removeEventListener('popstate', onPopState);
        };
    }, []);

    // Tab surveillance: un strike por salida real de la pestaña (visibilitychange).
    // No se usa `blur` para contar: genera falsos positivos (otro monitor,
    // notificaciones del SO, DevTools) y duplicaba el conteo por cada salida.
    useEffect(() => {
        if (!exam.antiCheatEnabled) return;

        const saved = Number(sessionStorage.getItem(strikesKey) ?? '0');
        if (saved > 0) setStrikes(Math.min(saved, 3));

        const mountedAt = Date.now();
        const INITIAL_GRACE_MS = 500;

        const onVisibilityChange = (): void => {
            if (submittedRef.current) return;
            if (Date.now() - mountedAt < INITIAL_GRACE_MS) return;

            if (!document.hidden) {
                // Al volver: registrar la duración de la salida (forense).
                const durationMs = tabLeftAtRef.current > 0 ? Date.now() - tabLeftAtRef.current : 0;
                tabLeftAtRef.current = 0;
                if (durationMs > 0) void recordTabSwitch(durationMs);
                return;
            }

            tabLeftAtRef.current = Date.now();

            if (exam.lockTabSwitch) {
                sessionStorage.removeItem(strikesKey);
                toast.error('Salida detectada. Examen enviado automáticamente.');
                void finalizeAndRedirect('auto');
                return;
            }

            setStrikes((prev) => {
                const next = prev + 1;
                sessionStorage.setItem(strikesKey, String(next));
                if (next === 1) {
                    toast.warning('1/3 — Vuelve al examen ya', {
                        description: 'Si sales 3 veces el examen se envía automáticamente.',
                    });
                } else if (next === 2) {
                    toast.warning('2/3 — Último aviso', {
                        description: 'La próxima salida envía el examen.',
                    });
                } else if (next >= 3) {
                    toast.error('Excediste los intentos permitidos. Examen enviado.');
                    void finalizeAndRedirect('auto');
                }
                return next;
            });
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, [exam.antiCheatEnabled, exam.lockTabSwitch, strikesKey, finalizeAndRedirect]);

    // Fullscreen anti-cheat: request fullscreen on mount; fullscreenchange exit = strike
    useEffect(() => {
        if (!exam.antiCheatEnabled) return;

        void document.documentElement.requestFullscreen().catch(() => {
            // Permission denied or already fullscreen — non-fatal
        });

        const onFullscreenChange = (): void => {
            if (submittedRef.current) return;
            // User exited fullscreen
            if (!document.fullscreenElement) {
                if (exam.lockTabSwitch) {
                    toast.error('Saliste de pantalla completa. Examen enviado automáticamente.');
                    void finalizeAndRedirect('auto');
                    return;
                }
                setStrikes((prev) => {
                    const next = prev + 1;
                    sessionStorage.setItem(strikesKey, String(next));
                    if (next === 1) {
                        toast.warning('1/3 — Vuelve al modo pantalla completa', {
                            description: 'Si salís 3 veces el examen se envía automáticamente.',
                        });
                    } else if (next === 2) {
                        toast.warning('2/3 — Último aviso', {
                            description: 'La próxima salida envía el examen.',
                        });
                    } else if (next >= 3) {
                        toast.error('Excediste los intentos permitidos. Examen enviado.');
                        void finalizeAndRedirect('auto');
                    }
                    return next;
                });
            }
        };

        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', onFullscreenChange);
            // Exit fullscreen when component unmounts (after submit)
            if (document.fullscreenElement) {
                void document.exitFullscreen().catch((_e: unknown) => void _e);
            }
        };
    }, [exam.antiCheatEnabled, exam.lockTabSwitch, strikesKey, finalizeAndRedirect]);

    // Keyboard navigation: A-D / 1-4 select option, ←→ navigate, Enter advances
    useEffect(() => {
        function handleKey(e: KeyboardEvent): void {
            // Ignore when typing in inputs
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            const key = e.key;

            // Option selection: A-D or 1-4
            if (/^[a-dA-D]$/.test(key)) {
                const idx = key.toUpperCase().charCodeAt(0) - 65;
                const opt = currentQuestion?.options[idx];
                if (opt) { e.preventDefault(); handleSelect(opt.id); }
                return;
            }
            if (/^[1-4]$/.test(key)) {
                const idx = Number(key) - 1;
                const opt = currentQuestion?.options[idx];
                if (opt) { e.preventDefault(); handleSelect(opt.id); }
                return;
            }

            // Navigate: ArrowLeft / ArrowRight
            if (key === 'ArrowLeft') { e.preventDefault(); handlePrev(); return; }
            if (key === 'ArrowRight' || key === 'Enter') {
                e.preventDefault();
                handleNext();
                return;
            }
        }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    // biome-ignore lint/correctness/useExhaustiveDependencies: handleSelect/handlePrev/handleNext are non-useCallback functions; re-registering on every render is intentional
    }, [currentQuestion, handleSelect, handlePrev, handleNext]);

    if (!currentQuestion) {
        return (
            <div className="bg-paper flex min-h-screen items-center justify-center">
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
        <div className="bg-paper flex min-h-screen flex-col">
            {/* Top bar */}
            <header className="border-border sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-3">
                <div className="flex items-center gap-3">
                    <LogoMark size={26} />
                    <div className="bg-border h-4 w-px" />
                    <span className="text-mute max-w-[200px] truncate font-mono text-[11px] tracking-[0.08em] uppercase">
                        {exam.title}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-mute flex items-center gap-1.5 font-mono text-[10px]">
                        <span
                            className={cn(
                                'size-1.5 animate-pulse rounded-full',
                                isPending ? 'bg-warning' : 'bg-success',
                            )}
                        />
                        {isPending ? 'Guardando…' : 'Autoguardado'}
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
            <div className="bg-border h-1">
                <div
                    className="bg-primary h-full w-[var(--progress-w)] transition-all duration-500 ease-out"
                    style={{ '--progress-w': `${progressPct}%` } as React.CSSProperties}
                />
            </div>

            {/* Content */}
            <div className="flex flex-1">
                {/* Sidebar */}
                <aside className="border-border hidden w-[260px] shrink-0 flex-col gap-5 border-r bg-white p-5 lg:flex">
                    {/* Question map */}
                    <div>
                        <p className="text-mute mb-3 font-mono text-[10px] tracking-[0.1em] uppercase">
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
                                            isCurrent && 'border-lime bg-lime text-ink border-2',
                                            !isCurrent && isDone && 'bg-primary text-white',
                                            !isCurrent &&
                                                !isDone &&
                                                'border-border text-mute hover:border-primary/40 border bg-white',
                                        )}
                                    >
                                        {String(idx + 1).padStart(2, '0')}
                                        {qIsMarked && (
                                            <span className="bg-coral absolute top-0.5 right-0.5 size-2 rounded-full" />
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
                                {
                                    color: 'border border-border relative',
                                    label: 'Marcada',
                                    dot: true,
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="text-mute flex items-center gap-1.5 font-mono text-[9px]"
                                >
                                    <div
                                        className={cn(
                                            'relative size-3 shrink-0 rounded-sm',
                                            item.color,
                                        )}
                                    >
                                        {item.dot && (
                                            <span className="bg-coral absolute -top-0.5 -right-0.5 size-1.5 rounded-full" />
                                        )}
                                    </div>
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timer card — CSS vars only; className sets bg, not --foreground/--border */}
                    <div
                        className="bg-ink flex flex-col items-center rounded-[10px] py-5"
                        style={
                            {
                                '--foreground': '#ffffff',
                                '--border': 'rgba(255,255,255,0.12)',
                            } as React.CSSProperties
                        }
                    >
                        <p className="mb-3 font-mono text-[10px] tracking-[0.1em] text-white/40 uppercase">
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
                                <div className="border-border rounded-[18px] border bg-white p-8 shadow-sm lg:p-10">
                                    {/* Question header */}
                                    <div className="mb-7 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-primary rounded-full px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.08em] text-white uppercase">
                                                Pregunta {currentIndex + 1} de {totalQuestions}
                                            </span>
                                            <span className="bg-paper-warm text-mute rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.08em] uppercase">
                                                {currentQuestion.points} pt
                                                {currentQuestion.points !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleToggleMark}
                                            className={cn(
                                                'flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 font-mono text-[10px] tracking-[0.08em] uppercase transition-colors',
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
                                    <h2 className="font-display text-ink mb-8 text-[26px] leading-snug font-semibold tracking-[-0.02em] lg:text-[30px]">
                                        {currentQuestion.text}
                                    </h2>

                                    {/* Options */}
                                    <fieldset
                                        className="m-0 flex flex-col gap-3 border-0 p-0"
                                        aria-label="Opciones de respuesta"
                                    >
                                        {currentQuestion.options.map((option, idx) => {
                                            const label = LABELS[idx] ?? String(idx + 1);
                                            const isSelected = selectedOptionIds.includes(
                                                option.id,
                                            );
                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    disabled={isPending}
                                                    onClick={() => handleSelect(option.id)}
                                                    aria-pressed={isSelected}
                                                    className={cn(
                                                        'flex w-full items-center gap-4 rounded-[12px] border px-5 py-[18px] text-left transition-all',
                                                        'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                                                        'disabled:cursor-not-allowed disabled:opacity-60',
                                                        isSelected
                                                            ? 'border-primary bg-primary-wash shadow-sm'
                                                            : 'border-border hover:border-primary/40 hover:bg-primary-wash/30 bg-white',
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
                                                                ? 'text-primary font-medium'
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
                                    <div className="border-border mt-8 flex items-center justify-between border-t pt-6">
                                        <Button
                                            variant="ghost"
                                            size="default"
                                            onClick={handlePrev}
                                            disabled={currentIndex === 0 || isPending}
                                        >
                                            ← Anterior
                                        </Button>

                                        <span className="text-mute hidden font-mono text-[10px] sm:block">
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
