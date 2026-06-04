'use client';

import type { DemoExam } from '@/features/demo/types/demo.types';
import { Timer } from '@/shared/components/ui/timer';
import { LogoMark, LogoWordmark } from '@/shared/components/branding/logo';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Flag } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DemoResultsScreen } from './DemoResultsScreen';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

interface DemoExamCarouselProps {
    exam: DemoExam;
    initialSeconds: number;
}

export function DemoExamCarousel({
    exam,
    initialSeconds,
}: DemoExamCarouselProps): React.JSX.Element {
    const [phase, setPhase] = useState<'exam' | 'results'>('exam');
    const [retryCount, setRetryCount] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
    const [direction, setDirection] = useState(1);
    const [answeredSet, setAnsweredSet] = useState<Set<string>>(new Set());
    const [markedSet, setMarkedSet] = useState<Set<string>>(new Set());
    const [answersMap, setAnswersMap] = useState<Map<string, string[]>>(new Map());

    // Refs to avoid stale closures in timer callback
    const selectedOptionIdsRef = useRef<string[]>([]);
    const currentIndexRef = useRef(0);
    selectedOptionIdsRef.current = selectedOptionIds;
    currentIndexRef.current = currentIndex;

    const totalQuestions = exam.questions.length;
    const currentQuestion = exam.questions[currentIndex];
    const isLastQuestion = currentIndex === totalQuestions - 1;
    const progressPct = ((currentIndex + 1) / totalQuestions) * 100;

    const saveAnswer = useCallback((questionId: string, optionIds: string[]): void => {
        if (optionIds.length === 0) return;
        setAnswersMap((prev) => {
            const next = new Map(prev);
            next.set(questionId, optionIds);
            return next;
        });
        setAnsweredSet((prev) => new Set([...prev, questionId]));
    }, []);

    // Stable callback for Timer — uses refs to avoid re-renders resetting the timer
    const handleTimeout = useCallback((): void => {
        toast.warning('¡Tiempo agotado!', {
            description: 'El examen se envió automáticamente.',
        });
        setAnswersMap((prev) => {
            const qId = exam.questions[currentIndexRef.current]?.id;
            const opts = selectedOptionIdsRef.current;
            if (!qId || opts.length === 0) return prev;
            const next = new Map(prev);
            next.set(qId, opts);
            return next;
        });
        setAnsweredSet((prev) => {
            const qId = exam.questions[currentIndexRef.current]?.id;
            if (!qId || selectedOptionIdsRef.current.length === 0) return prev;
            return new Set([...prev, qId]);
        });
        setPhase('results');
    }, [exam.questions]);

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
    };

    const navigateTo = (nextIndex: number): void => {
        const questionId = currentQuestion?.id;
        if (questionId && selectedOptionIds.length > 0) {
            saveAnswer(questionId, selectedOptionIds);
        }
        setDirection(nextIndex > currentIndex ? 1 : -1);
        setCurrentIndex(nextIndex);
        const targetQId = exam.questions[nextIndex]?.id ?? '';
        setSelectedOptionIds(answersMap.get(targetQId) ?? []);
    };

    const handleNext = (): void => {
        if (!currentQuestion || selectedOptionIds.length === 0) return;
        saveAnswer(currentQuestion.id, selectedOptionIds);
        if (isLastQuestion) {
            setPhase('results');
            return;
        }
        const nextIdx = currentIndex + 1;
        setDirection(1);
        setCurrentIndex(nextIdx);
        const nextQId = exam.questions[nextIdx]?.id ?? '';
        setSelectedOptionIds(answersMap.get(nextQId) ?? []);
    };

    const handlePrev = (): void => {
        if (currentIndex === 0) return;
        navigateTo(currentIndex - 1);
    };

    const handleJump = (idx: number): void => {
        if (idx === currentIndex) return;
        navigateTo(idx);
    };

    const handleRetry = (): void => {
        setRetryCount((c) => c + 1);
        setPhase('exam');
        setCurrentIndex(0);
        setSelectedOptionIds([]);
        setDirection(1);
        setAnsweredSet(new Set());
        setMarkedSet(new Set());
        setAnswersMap(new Map());
    };

    // Block navigation away during exam
    useEffect(() => {
        if (phase !== 'exam') return;
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
    }, [phase]);

    if (phase === 'results') {
        return <DemoResultsScreen exam={exam} answersMap={answersMap} onRetry={handleRetry} />;
    }

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
                    <span className="bg-warning-wash text-warning rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold">
                        DEMO
                    </span>
                    <span className="text-mute flex items-center gap-1.5 font-mono text-[10px]">
                        <span className="bg-success size-1.5 animate-pulse rounded-full" />
                        Autoguardado
                    </span>
                    <LogoWordmark size={14} color="#75716b" />
                </div>
            </header>

            {/* Progress bar */}
            <div className="bg-border h-1">
                <div
                    className="bg-primary h-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPct}%` }}
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

                    {/* Timer */}
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
                        <Timer
                            key={retryCount}
                            initialSeconds={initialSeconds}
                            onTimeout={handleTimeout}
                        />
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
                                            {currentQuestion.questionType === 'MULTIPLE' && (
                                                <span className="border-lime/50 bg-lime/15 text-ink rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.08em] uppercase">
                                                    Múltiple
                                                </span>
                                            )}
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
                                                    onClick={() => handleSelect(option.id)}
                                                    aria-pressed={isSelected}
                                                    className={cn(
                                                        'flex w-full items-center gap-4 rounded-[12px] border px-5 py-[18px] text-left transition-all',
                                                        'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
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

                                    {/* Navigation footer */}
                                    <div className="border-border mt-8 flex items-center justify-between border-t pt-6">
                                        <Button
                                            variant="ghost"
                                            size="default"
                                            onClick={handlePrev}
                                            disabled={currentIndex === 0}
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
                                            disabled={selectedOptionIds.length === 0}
                                        >
                                            {isLastQuestion ? 'Finalizar →' : 'Siguiente →'}
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
