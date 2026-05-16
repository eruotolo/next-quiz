'use client';

import type { DemoExam, DemoResults, QuestionResult } from '@/features/demo/types/demo.types';
import { calcGrade } from '@/features/results/lib/grade';
import { LogoMark, LogoWordmark } from '@/shared/components/branding/logo';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { CheckCircle2, Circle, RotateCcw, XCircle } from 'lucide-react';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

function computeResults(exam: DemoExam, answersMap: Map<string, string[]>): DemoResults {
    let score = 0;
    let maxScore = 0;
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    const perQuestion: QuestionResult[] = exam.questions.map((q) => {
        maxScore += q.points;
        const selected = answersMap.get(q.id) ?? [];

        if (selected.length === 0) {
            unanswered++;
            return { question: q, isCorrect: false, selected };
        }

        const correctIds = new Set(q.options.filter((o) => o.isCorrect).map((o) => o.id));
        const selectedIds = new Set(selected);
        const isCorrect =
            correctIds.size === selectedIds.size && [...correctIds].every((id) => selectedIds.has(id));

        if (isCorrect) {
            score += q.points;
            correct++;
        } else {
            incorrect++;
        }

        return { question: q, isCorrect, selected };
    });

    return { score, maxScore, correct, incorrect, unanswered, perQuestion };
}

interface DemoResultsScreenProps {
    exam: DemoExam;
    answersMap: Map<string, string[]>;
    onRetry: () => void;
}

export function DemoResultsScreen({
    exam,
    answersMap,
    onRetry,
}: DemoResultsScreenProps): React.JSX.Element {
    const results = computeResults(exam, answersMap);
    const grade = calcGrade(results.score, results.maxScore, 7, 4, 60);
    const passing = grade >= 4;
    const pct = results.maxScore > 0 ? Math.round((results.score / results.maxScore) * 100) : 0;

    return (
        <div className="min-h-screen bg-paper">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-3">
                <div className="flex items-center gap-3">
                    <LogoMark size={26} />
                    <div className="h-4 w-px bg-border" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">
                        {exam.title} — Resultados
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="rounded-full bg-warning-wash px-2.5 py-1 font-mono text-[10px] font-semibold text-warning">
                        DEMO
                    </span>
                    <LogoWordmark size={14} color="#75716b" />
                </div>
            </header>

            <div className="mx-auto max-w-3xl px-4 py-10">
                {/* Summary card */}
                <div className="mb-8 overflow-hidden rounded-[18px] border border-border bg-white shadow-sm">
                    <div className="border-b border-border px-8 py-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-mute">
                                    Resultado final
                                </p>
                                <h1 className="font-display text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink">
                                    {results.score}{' '}
                                    <span className="text-[20px] font-normal text-mute">
                                        / {results.maxScore} pts
                                    </span>
                                </h1>
                            </div>

                            <div
                                className={cn(
                                    'flex flex-col items-center rounded-[12px] px-6 py-4',
                                    passing ? 'bg-success/8' : 'bg-destructive/8',
                                )}
                            >
                                <p className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-mute">
                                    Nota
                                </p>
                                <span
                                    className={cn(
                                        'font-display text-[36px] font-bold leading-none tracking-[-0.04em]',
                                        passing ? 'text-success' : 'text-destructive',
                                    )}
                                >
                                    {grade.toFixed(1)}
                                </span>
                                <span
                                    className={cn(
                                        'mt-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase',
                                        passing
                                            ? 'bg-success/15 text-success'
                                            : 'bg-destructive/15 text-destructive',
                                    )}
                                >
                                    {passing ? 'Aprobado' : 'Reprobado'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-4 divide-x divide-border">
                        {[
                            {
                                label: 'Correctas',
                                value: results.correct,
                                color: 'text-success',
                            },
                            {
                                label: 'Incorrectas',
                                value: results.incorrect,
                                color: 'text-destructive',
                            },
                            {
                                label: 'Sin responder',
                                value: results.unanswered,
                                color: 'text-mute',
                            },
                            {
                                label: 'Porcentaje',
                                value: `${pct}%`,
                                color: 'text-ink',
                            },
                        ].map((stat) => (
                            <div key={stat.label} className="flex flex-col items-center py-5">
                                <span className={cn('font-mono text-[22px] font-bold', stat.color)}>
                                    {stat.value}
                                </span>
                                <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-mute">
                                    {stat.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Question breakdown */}
                <div className="mb-6">
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em] text-mute">
                        Corrección detallada
                    </p>
                    <div className="flex flex-col gap-4">
                        {results.perQuestion.map((qr, idx) => (
                            <QuestionReview key={qr.question.id} qr={qr} idx={idx} />
                        ))}
                    </div>
                </div>

                {/* Footer actions */}
                <div className="flex flex-col items-center gap-4 rounded-[16px] border border-border bg-white px-8 py-6 text-center">
                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">
                        Esta es una demo del sistema de exámenes aulika
                    </p>
                    <Button variant="primary" size="default" onClick={onRetry}>
                        <RotateCcw size={14} className="mr-2" />
                        Volver a intentar
                    </Button>
                </div>
            </div>
        </div>
    );
}

interface QuestionReviewProps {
    qr: QuestionResult;
    idx: number;
}

function QuestionReview({ qr, idx }: QuestionReviewProps): React.JSX.Element {
    const { question, isCorrect, selected } = qr;
    const isUnanswered = selected.length === 0;

    return (
        <div
            className={cn(
                'overflow-hidden rounded-[14px] border bg-white',
                isCorrect
                    ? 'border-success/30'
                    : isUnanswered
                      ? 'border-border'
                      : 'border-destructive/30',
            )}
        >
            {/* Question header */}
            <div
                className={cn(
                    'flex items-center justify-between border-b px-6 py-4',
                    isCorrect
                        ? 'border-success/20 bg-success/5'
                        : isUnanswered
                          ? 'border-border bg-paper'
                          : 'border-destructive/20 bg-destructive/5',
                )}
            >
                <div className="flex items-center gap-3">
                    <span className="rounded-full bg-paper-warm px-2.5 py-1 font-mono text-[10px] text-mute">
                        Pregunta {idx + 1}
                    </span>
                    {question.questionType === 'MULTIPLE' && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-mute">
                            Múltiple
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    {isCorrect ? (
                        <>
                            <CheckCircle2 size={14} className="text-success" />
                            <span className="font-mono text-[11px] font-semibold text-success">
                                Correcta
                            </span>
                        </>
                    ) : isUnanswered ? (
                        <>
                            <Circle size={14} className="text-mute" />
                            <span className="font-mono text-[11px] font-semibold text-mute">
                                Sin responder
                            </span>
                        </>
                    ) : (
                        <>
                            <XCircle size={14} className="text-destructive" />
                            <span className="font-mono text-[11px] font-semibold text-destructive">
                                Incorrecta
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Question text + options */}
            <div className="px-6 py-5">
                <p className="mb-5 text-[16px] font-semibold leading-snug text-ink">
                    {question.text}
                </p>

                <div className="flex flex-col gap-2">
                    {question.options.map((option, optIdx) => {
                        const label = LABELS[optIdx] ?? String(optIdx + 1);
                        const wasSelected = selected.includes(option.id);
                        const isOptionCorrect = option.isCorrect;

                        const isSelectedCorrect = wasSelected && isOptionCorrect;
                        const isSelectedWrong = wasSelected && !isOptionCorrect;
                        const isMissedCorrect = !wasSelected && isOptionCorrect && !isCorrect;

                        return (
                            <div
                                key={option.id}
                                className={cn(
                                    'flex items-center gap-3 rounded-[10px] border px-4 py-3',
                                    isSelectedCorrect &&
                                        'border-success/40 bg-success/8',
                                    isSelectedWrong &&
                                        'border-destructive/40 bg-destructive/8',
                                    isMissedCorrect &&
                                        'border-success/40 bg-success/5',
                                    !wasSelected &&
                                        !isMissedCorrect &&
                                        'border-border bg-white',
                                )}
                            >
                                <span
                                    className={cn(
                                        'flex size-[26px] shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold',
                                        isSelectedCorrect && 'bg-success text-white',
                                        isSelectedWrong && 'bg-destructive text-white',
                                        isMissedCorrect && 'bg-success/20 text-success',
                                        !wasSelected &&
                                            !isMissedCorrect &&
                                            'bg-paper-warm text-mute',
                                    )}
                                >
                                    {label}
                                </span>

                                <span
                                    className={cn(
                                        'flex-1 text-[14px]',
                                        isSelectedCorrect && 'font-medium text-success',
                                        isSelectedWrong && 'font-medium text-destructive',
                                        isMissedCorrect && 'font-medium text-success',
                                        !wasSelected && !isMissedCorrect && 'text-mute',
                                    )}
                                >
                                    {option.text}
                                </span>

                                {isSelectedCorrect && (
                                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-success">
                                        Tu respuesta ✓
                                    </span>
                                )}
                                {isSelectedWrong && (
                                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-destructive">
                                        Tu respuesta ✗
                                    </span>
                                )}
                                {isMissedCorrect && (
                                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-success">
                                        Correcta
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
