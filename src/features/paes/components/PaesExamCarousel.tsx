'use client';

import { PaesAviso } from '@/features/paes/components/PaesAviso';
import { PaesResultsScreen } from '@/features/paes/components/PaesResultsScreen';
import { computePaesResults } from '@/features/paes/lib/scoring';
import type { PaesExam } from '@/features/paes/types/paes.types';
import { Timer } from '@/shared/components/ui/timer';
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

export function PaesExamCarousel({
    exam,
    initialSeconds,
    backUrl = '/paes',
}: PaesExamCarouselProps): React.JSX.Element {
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
            <div className="bg-paper flex min-h-screen items-center justify-center">
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
                    <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold">
                        PAES PRÁCTICA
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
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="border-border hidden w-[240px] shrink-0 flex-col gap-5 overflow-y-auto border-r bg-white p-5 lg:flex">
                    {/* Question map */}
                    <div>
                        <p className="text-mute mb-3 font-mono text-[10px] tracking-[0.1em] uppercase">
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
                        className="bg-ink flex flex-col items-center gap-1 rounded-[10px] py-5"
                        style={
                            {
                                '--foreground': '#ffffff',
                                '--border': 'rgba(255,255,255,0.12)',
                            } as React.CSSProperties
                        }
                    >
                        <p className="mb-2 font-mono text-[10px] tracking-[0.1em] text-white/40 uppercase">
                            Tiempo
                        </p>
                        <Timer
                            key={retryCount}
                            initialSeconds={initialSeconds}
                            onTimeout={handleTimeout}
                        />
                        <p className="mt-1 font-mono text-[9px] text-white/30">h:mm:ss</p>
                    </div>
                </aside>

                {/* Main area — adapts if context exists */}
                {hasContext ? (
                    <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
                        {/* Texto de lectura */}
                        <div className="border-border flex-1 overflow-y-auto border-b bg-white p-6 lg:max-w-[45%] lg:border-r lg:border-b-0 lg:p-8">
                            {currentQuestion.contextTitle && (
                                <p className="text-mute mb-3 font-mono text-[10px] tracking-[0.1em] uppercase">
                                    {currentQuestion.contextTitle}
                                </p>
                            )}
                            <p className="text-ink text-[15px] leading-[1.8]">
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

                <div className="border-border rounded-[18px] border bg-white p-6 shadow-sm lg:p-8">
                    {/* Question header */}
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-primary rounded-full px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.08em] text-white uppercase">
                                {currentIndex + 1} / {totalQuestions}
                            </span>
                            <span className="bg-paper-warm text-mute rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.08em] uppercase">
                                {currentQuestion.eje}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onToggleMark}
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

                    {/* Statement */}
                    <h2 className="font-display text-ink mb-6 text-[22px] leading-snug font-semibold tracking-[-0.02em] lg:text-[26px]">
                        {currentQuestion.statement}
                    </h2>

                    {/* Options */}
                    <fieldset
                        className="m-0 flex flex-col gap-3 border-0 p-0"
                        aria-label="Alternativas"
                    >
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
                                        'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                                        isSelected
                                            ? 'border-primary bg-primary-wash shadow-sm'
                                            : 'border-border hover:border-primary/40 hover:bg-primary-wash/30 bg-white',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'flex size-[28px] shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold transition-colors',
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
                                            isSelected ? 'text-primary font-medium' : 'text-ink',
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
                    <div className="border-border mt-6 flex items-center justify-between border-t pt-5">
                        <Button
                            variant="ghost"
                            size="default"
                            onClick={onPrev}
                            disabled={currentIndex === 0}
                        >
                            ← Anterior
                        </Button>
                        <span className="text-mute hidden font-mono text-[10px] sm:block">
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
