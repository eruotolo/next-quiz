'use client';

import { PaesAviso } from '@/features/paes/components/PaesAviso';
import { PaesResultsScreen } from '@/features/paes/components/PaesResultsScreen';
import { computePaesResults } from '@/features/paes/lib/scoring';
import type { PaesExam } from '@/features/paes/types/paes.types';
import { Timer } from '@/features/exam-session/components/Timer';
import { LogoMark, LogoWordmark } from '@/shared/components/branding/logo';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Flag } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const LABELS = ['A', 'B', 'C', 'D'] as const;


interface PaesExamCarouselProps {
    exam: PaesExam;
    initialSeconds: number;
    backUrl?: string;
}

export function PaesExamCarousel({ exam, initialSeconds, backUrl = '/paes' }: PaesExamCarouselProps): React.JSX.Element {
    const [phase, setPhase] = useState<'exam' | 'results'>('exam');
    const [retryCount, setRetryCount] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
    const [direction, setDirection] = useState(1);
    const [answeredSet, setAnsweredSet] = useState<Set<string>>(new Set());
    const [markedSet, setMarkedSet] = useState<Set<string>>(new Set());
    const [answersMap, setAnswersMap] = useState<Map<string, string[]>>(new Map());

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

    const handleTimeout = useCallback((): void => {
        toast.warning('¡Tiempo agotado!', { description: 'El ensayo se envió automáticamente.' });
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
        setSelectedOptionIds([optionId]);
    };

    const handleToggleMark = (): void => {
        if (!currentQuestion) return;
        const qId = currentQuestion.id;
        setMarkedSet((prev) => {
            const next = new Set(prev);
            if (next.has(qId)) next.delete(qId);
            else next.add(qId);
            return next;
        });
    };

    const navigateTo = (nextIndex: number): void => {
        const questionId = currentQuestion?.id;
        if (questionId && selectedOptionIds.length > 0) saveAnswer(questionId, selectedOptionIds);
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
                description: 'No podés salir mientras el ensayo está en curso.',
            });
        };
        window.addEventListener('popstate', onPopState);
        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            window.removeEventListener('popstate', onPopState);
        };
    }, [phase]);

    if (phase === 'results') {
        const results = computePaesResults(exam, answersMap);
        return (
            <PaesResultsScreen
                exam={exam}
                results={results}
                onRetry={handleRetry}
                backUrl={backUrl}
            />
        );
    }

    if (!currentQuestion) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-paper">
                <p className="text-mute">Esta prueba no tiene preguntas disponibles.</p>
            </div>
        );
    }

    const variants = {
        enter: (d: number) => ({ x: d > 0 ? 32 : -32, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (d: number) => ({ x: d > 0 ? -32 : 32, opacity: 0 }),
    };

    const isMarked = markedSet.has(currentQuestion.id);
    const hasContext = Boolean(currentQuestion.context);

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
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-primary">
                        PAES PRÁCTICA
                    </span>
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
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="hidden w-[240px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-border bg-white p-5 lg:flex">
                    {/* Question map */}
                    <div>
                        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em] text-mute">
                            Mapa
                        </p>
                        <div className="grid grid-cols-4 gap-1">
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
                                            'relative h-10 rounded-[6px] font-mono text-[10px] font-semibold transition-colors',
                                            isCurrent && 'border-2 border-lime bg-lime text-ink',
                                            !isCurrent && isDone && 'bg-primary text-white',
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
                        <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5">
                            {[
                                { color: 'bg-primary', label: 'Respondida' },
                                { color: 'bg-lime border border-lime', label: 'Actual' },
                                { color: 'border border-border', label: 'Pendiente' },
                                { color: 'border border-border relative', label: 'Marcada', dot: true },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center gap-1.5 font-mono text-[9px] text-mute"
                                >
                                    <div className={cn('relative size-3 shrink-0 rounded-sm', item.color)}>
                                        {item.dot && (
                                            <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-coral" />
                                        )}
                                    </div>
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timer */}
                    <div
                        className="flex flex-col items-center rounded-[10px] bg-ink py-5 gap-1"
                        style={{ '--foreground': '#ffffff', '--border': 'rgba(255,255,255,0.12)' } as React.CSSProperties}
                    >
                        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">
                            Tiempo
                        </p>
                        <Timer key={retryCount} initialSeconds={initialSeconds} onTimeout={handleTimeout} />
                        <p className="mt-1 font-mono text-[9px] text-white/30">h:mm:ss</p>
                    </div>
                </aside>

                {/* Main area — adapts if context exists */}
                {hasContext ? (
                    <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
                        {/* Texto de lectura */}
                        <div className="flex-1 overflow-y-auto border-b border-border bg-white p-6 lg:border-b-0 lg:border-r lg:p-8 lg:max-w-[45%]">
                            {currentQuestion.contextTitle && (
                                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em] text-mute">
                                    {currentQuestion.contextTitle}
                                </p>
                            )}
                            <p className="text-[15px] leading-[1.8] text-ink">
                                {currentQuestion.context}
                            </p>
                        </div>

                        {/* Pregunta */}
                        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                            <QuestionPanel
                                currentQuestion={currentQuestion}
                                currentIndex={currentIndex}
                                totalQuestions={totalQuestions}
                                isLastQuestion={isLastQuestion}
                                selectedOptionIds={selectedOptionIds}
                                isMarked={isMarked}
                                answeredSet={answeredSet}
                                direction={direction}
                                exam={exam}
                                variants={variants}
                                onSelect={handleSelect}
                                onToggleMark={handleToggleMark}
                                onNext={handleNext}
                                onPrev={handlePrev}
                                exam_source={exam.source}
                                exam_sourceUrl={exam.sourceUrl}
                            />
                        </div>
                    </div>
                ) : (
                    <main className="flex flex-1 items-start justify-center overflow-y-auto p-6 lg:p-10">
                        <div className="w-full max-w-2xl">
                            <QuestionPanel
                                currentQuestion={currentQuestion}
                                currentIndex={currentIndex}
                                totalQuestions={totalQuestions}
                                isLastQuestion={isLastQuestion}
                                selectedOptionIds={selectedOptionIds}
                                isMarked={isMarked}
                                answeredSet={answeredSet}
                                direction={direction}
                                exam={exam}
                                variants={variants}
                                onSelect={handleSelect}
                                onToggleMark={handleToggleMark}
                                onNext={handleNext}
                                onPrev={handlePrev}
                                exam_source={exam.source}
                                exam_sourceUrl={exam.sourceUrl}
                            />
                        </div>
                    </main>
                )}
            </div>
        </div>
    );
}

interface QuestionPanelProps {
    currentQuestion: PaesExam['questions'][number];
    currentIndex: number;
    totalQuestions: number;
    isLastQuestion: boolean;
    selectedOptionIds: string[];
    isMarked: boolean;
    answeredSet: Set<string>;
    direction: number;
    exam: PaesExam;
    variants: {
        enter: (d: number) => { x: number; opacity: number };
        center: { x: number; opacity: number };
        exit: (d: number) => { x: number; opacity: number };
    };
    onSelect: (id: string) => void;
    onToggleMark: () => void;
    onNext: () => void;
    onPrev: () => void;
    exam_source: string;
    exam_sourceUrl: string;
}

function QuestionPanel({
    currentQuestion,
    currentIndex,
    totalQuestions,
    isLastQuestion,
    selectedOptionIds,
    isMarked,
    answeredSet,
    direction,
    variants,
    onSelect,
    onToggleMark,
    onNext,
    onPrev,
    exam_source,
    exam_sourceUrl,
}: QuestionPanelProps): React.JSX.Element {
    return (
        <AnimatePresence mode="wait" custom={direction}>
            <motion.div
                key={currentQuestion.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.18, ease: 'easeInOut' }}
                className="flex flex-col gap-4"
            >
                {/* Aviso fuente */}
                <PaesAviso source={exam_source} sourceUrl={exam_sourceUrl} />

                <div className="rounded-[18px] border border-border bg-white p-6 shadow-sm lg:p-8">
                    {/* Question header */}
                    <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="rounded-full bg-primary px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                                {currentIndex + 1} / {totalQuestions}
                            </span>
                            <span className="rounded-full bg-paper-warm px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-mute">
                                {currentQuestion.eje}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onToggleMark}
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

                    {/* Statement */}
                    <h2 className="mb-6 font-display text-[22px] font-semibold leading-snug tracking-[-0.02em] text-ink lg:text-[26px]">
                        {currentQuestion.statement}
                    </h2>

                    {/* Options */}
                    <fieldset className="m-0 flex flex-col gap-3 border-0 p-0" aria-label="Alternativas">
                        {currentQuestion.options.map((option, idx) => {
                            const label = LABELS[idx] ?? String(idx + 1);
                            const isSelected = selectedOptionIds.includes(option.id);
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => onSelect(option.id)}
                                    aria-pressed={isSelected}
                                    className={cn(
                                        'flex w-full items-center gap-4 rounded-[12px] border px-5 py-[16px] text-left transition-all',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                                        isSelected
                                            ? 'border-primary bg-primary-wash shadow-sm'
                                            : 'border-border bg-white hover:border-primary/40 hover:bg-primary-wash/30',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'flex size-[28px] shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold transition-colors',
                                            isSelected ? 'bg-primary text-white' : 'bg-paper-warm text-mute',
                                        )}
                                    >
                                        {label}
                                    </span>
                                    <span
                                        className={cn(
                                            'flex-1 text-[15px]',
                                            isSelected ? 'font-medium text-primary' : 'text-ink',
                                        )}
                                    >
                                        {option.text}
                                    </span>
                                    {isSelected && (
                                        <svg
                                            aria-hidden="true"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="shrink-0 text-primary"
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </fieldset>

                    {/* Navigation footer */}
                    <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
                        <Button variant="ghost" size="default" onClick={onPrev} disabled={currentIndex === 0}>
                            ← Anterior
                        </Button>
                        <span className="hidden font-mono text-[10px] text-mute sm:block">
                            {answeredSet.has(currentQuestion.id) ? 'Guardada' : 'Sin responder'}
                        </span>
                        <Button
                            variant="primary"
                            size="default"
                            onClick={onNext}
                            disabled={selectedOptionIds.length === 0}
                        >
                            {isLastQuestion ? 'Finalizar →' : 'Siguiente →'}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
