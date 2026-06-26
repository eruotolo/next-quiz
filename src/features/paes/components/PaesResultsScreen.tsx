'use client';

import type { CSSProperties } from 'react';
import { PaesAviso } from '@/features/paes/components/PaesAviso';
import type {
    PaesExam,
    PaesQuestion,
    PaesQuestionResult,
    PaesResult,
} from '@/features/paes/types/paes.types';
import { LogoMark, LogoWordmark } from '@/shared/components/branding/logo';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { CheckCircle2, Circle, RotateCcw, XCircle } from 'lucide-react';
import Link from 'next/link';

const LABELS = ['A', 'B', 'C', 'D'] as const;

interface PaesResultsScreenProps {
    exam: PaesExam;
    results: PaesResult;
    onRetry: () => void;
    backUrl?: string;
}

export function PaesResultsScreen({
    exam,
    results,
    onRetry,
    backUrl = '/paes',
}: PaesResultsScreenProps) {
    const isGood = results.percent >= 60;

    return (
        <div className="bg-paper min-h-screen">
            {/* Header */}
            <header className="border-border sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-3">
                <div className="flex items-center gap-3">
                    <LogoMark size={26} />
                    <div className="bg-border h-4 w-px" />
                    <span className="text-mute font-mono text-[11px] tracking-[0.08em] uppercase">
                        {exam.title} — Resultados
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold">
                        PAES PRÁCTICA
                    </span>
                    <LogoWordmark size={14} color="#75716b" />
                </div>
            </header>

            <div className="mx-auto max-w-3xl px-4 py-10">
                {/* Aviso fuente */}
                <div className="mb-6">
                    <PaesAviso source={exam.source} sourceUrl={exam.sourceUrl} />
                </div>

                {/* Summary card */}
                <div className="border-border mb-6 overflow-hidden rounded-[18px] border bg-white shadow-sm">
                    <div className="border-border border-b px-8 py-6">
                        <div className="flex flex-wrap items-start justify-between gap-6">
                            <div>
                                <p className="text-mute mb-1 font-mono text-[10px] tracking-[0.1em] uppercase">
                                    Resultado final
                                </p>
                                <h1 className="font-display text-ink text-[34px] leading-none font-semibold tracking-[-0.03em]">
                                    {results.correct}{' '}
                                    <span className="text-mute text-[20px] font-normal">
                                        / {results.total} correctas
                                    </span>
                                </h1>
                            </div>

                            <div
                                className={cn(
                                    'flex flex-col items-center rounded-[12px] px-6 py-4',
                                    isGood ? 'bg-success/8' : 'bg-warning/8',
                                )}
                            >
                                <p className="text-mute mb-0.5 font-mono text-[9px] tracking-[0.1em] uppercase">
                                    Puntaje estimado
                                </p>
                                <span
                                    className={cn(
                                        'font-display text-[36px] leading-none font-bold tracking-[-0.04em]',
                                        isGood ? 'text-success' : 'text-warning',
                                    )}
                                >
                                    {results.estimatedScore}
                                </span>
                                <span className="text-mute mt-1 font-mono text-[9px]">
                                    Escala 150–1000 · referencial
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="divide-border grid grid-cols-4 divide-x">
                        {[
                            { label: 'Correctas', value: results.correct, color: 'text-success' },
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
                                value: `${results.percent}%`,
                                color: 'text-ink',
                            },
                        ].map((stat) => (
                            <div key={stat.label} className="flex flex-col items-center py-5">
                                <span className={cn('font-mono text-[20px] font-bold', stat.color)}>
                                    {stat.value}
                                </span>
                                <span className="text-mute font-mono text-[9px] tracking-[0.08em] uppercase">
                                    {stat.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Por eje temático */}
                {results.byEje.length > 0 && (
                    <div className="mb-6">
                        <p className="text-mute mb-3 font-mono text-[10px] tracking-[0.1em] uppercase">
                            Resultados por eje temático
                        </p>
                        <div className="flex flex-col gap-2">
                            {results.byEje.map((eje) => {
                                const ejePct =
                                    eje.total > 0 ? Math.round((eje.correct / eje.total) * 100) : 0;
                                return (
                                    <div
                                        key={eje.eje}
                                        className="border-border flex items-center gap-4 rounded-[12px] border bg-white px-5 py-4"
                                    >
                                        <div className="flex-1">
                                            <p className="text-ink mb-1.5 text-[14px] font-medium">
                                                {eje.eje}
                                            </p>
                                            <div className="bg-border h-1.5 w-full rounded-full">
                                                <div
                                                    className={cn(
                                                        'h-full w-[var(--eje-w)] rounded-full transition-all',
                                                        ejePct >= 60 ? 'bg-success' : 'bg-warning',
                                                    )}
                                                    style={
                                                        { '--eje-w': `${ejePct}%` } as CSSProperties
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end">
                                            <span className="text-ink font-mono text-[14px] font-bold">
                                                {eje.correct}/{eje.total}
                                            </span>
                                            <span className="text-mute font-mono text-[10px]">
                                                {ejePct}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Question breakdown */}
                <div className="mb-6">
                    <p className="text-mute mb-3 font-mono text-[10px] tracking-[0.1em] uppercase">
                        Corrección detallada
                    </p>
                    <div className="flex flex-col gap-4">
                        {results.perQuestion.map((qr, idx) => {
                            const question = exam.questions.find((q) => q.id === qr.questionId);
                            if (!question) return null;
                            return (
                                <PaesQuestionReview
                                    key={qr.questionId}
                                    qr={qr}
                                    question={question}
                                    idx={idx}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Footer actions */}
                <div className="border-border flex flex-col items-center gap-4 rounded-[16px] border bg-white px-8 py-6 text-center">
                    <p className="text-mute font-mono text-[11px] tracking-[0.08em] uppercase">
                        El puntaje estimado es referencial — no constituye un puntaje oficial de la
                        PAES
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button variant="ghost" size="default" asChild>
                            <Link href={backUrl}>← Todas las pruebas</Link>
                        </Button>
                        <Button variant="primary" size="default" onClick={onRetry}>
                            <RotateCcw size={14} className="mr-2" />
                            Volver a intentar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface PaesQuestionReviewProps {
    qr: PaesQuestionResult;
    question: PaesQuestion;
    idx: number;
}

function PaesQuestionReview({ qr, question, idx }: PaesQuestionReviewProps) {
    const isUnanswered = qr.selected.length === 0;

    return (
        <div
            className={cn(
                'overflow-hidden rounded-[14px] border bg-white',
                qr.isCorrect
                    ? 'border-success/30'
                    : isUnanswered
                      ? 'border-border'
                      : 'border-destructive/30',
            )}
        >
            <div
                className={cn(
                    'flex items-center justify-between border-b px-6 py-4',
                    qr.isCorrect
                        ? 'border-success/20 bg-success/5'
                        : isUnanswered
                          ? 'border-border bg-paper'
                          : 'border-destructive/20 bg-destructive/5',
                )}
            >
                <div className="flex items-center gap-2">
                    <span className="bg-paper-warm text-mute rounded-full px-2.5 py-1 font-mono text-[10px]">
                        Pregunta {idx + 1}
                    </span>
                    <span className="text-mute font-mono text-[9px]">{question.eje}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {qr.isCorrect ? (
                        <>
                            <CheckCircle2 size={14} className="text-success" />
                            <span className="text-success font-mono text-[11px] font-semibold">
                                Correcta
                            </span>
                        </>
                    ) : isUnanswered ? (
                        <>
                            <Circle size={14} className="text-mute" />
                            <span className="text-mute font-mono text-[11px] font-semibold">
                                Sin responder
                            </span>
                        </>
                    ) : (
                        <>
                            <XCircle size={14} className="text-destructive" />
                            <span className="text-destructive font-mono text-[11px] font-semibold">
                                Incorrecta
                            </span>
                        </>
                    )}
                </div>
            </div>

            <div className="px-6 py-5">
                <p className="text-ink mb-5 text-[15px] leading-snug font-semibold">
                    {question.statement}
                </p>
                <div className="flex flex-col gap-2">
                    {question.options.map((option, optIdx) => (
                        <PaesOptionReview
                            key={option.id}
                            option={option}
                            label={LABELS[optIdx] ?? String(optIdx + 1)}
                            wasSelected={qr.selected.includes(option.id)}
                            questionIsCorrect={qr.isCorrect}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

interface PaesOptionReviewProps {
    option: PaesExam['questions'][number]['options'][number];
    label: string;
    wasSelected: boolean;
    questionIsCorrect: boolean;
}

type OptionState = 'selectedCorrect' | 'selectedWrong' | 'missedCorrect' | 'neutral';

function resolveOptionState(
    wasSelected: boolean,
    isCorrect: boolean,
    questionIsCorrect: boolean,
): OptionState {
    if (wasSelected && isCorrect) return 'selectedCorrect';
    if (wasSelected && !isCorrect) return 'selectedWrong';
    if (!wasSelected && isCorrect && !questionIsCorrect) return 'missedCorrect';
    return 'neutral';
}

const OPTION_ROW_CLASS: Record<OptionState, string> = {
    selectedCorrect: 'border-success/40 bg-success/8',
    selectedWrong: 'border-destructive/40 bg-destructive/8',
    missedCorrect: 'border-success/40 bg-success/5',
    neutral: 'border-border bg-white',
};

const OPTION_BADGE_CLASS: Record<OptionState, string> = {
    selectedCorrect: 'bg-success text-white',
    selectedWrong: 'bg-destructive text-white',
    missedCorrect: 'bg-success/20 text-success',
    neutral: 'bg-paper-warm text-mute',
};

const OPTION_TEXT_CLASS: Record<OptionState, string> = {
    selectedCorrect: 'font-medium text-success',
    selectedWrong: 'font-medium text-destructive',
    missedCorrect: 'font-medium text-success',
    neutral: 'text-mute',
};

function PaesOptionReview({
    option,
    label,
    wasSelected,
    questionIsCorrect,
}: PaesOptionReviewProps) {
    const state = resolveOptionState(wasSelected, option.isCorrect, questionIsCorrect);

    return (
        <div
            className={cn(
                'flex items-center gap-3 rounded-[10px] border px-4 py-3',
                OPTION_ROW_CLASS[state],
            )}
        >
            <span
                className={cn(
                    'flex size-[26px] shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold',
                    OPTION_BADGE_CLASS[state],
                )}
            >
                {label}
            </span>
            <span className={cn('flex-1 text-[14px]', OPTION_TEXT_CLASS[state])}>
                {option.text}
            </span>
            {state === 'selectedCorrect' && (
                <span className="text-success font-mono text-[9px] font-semibold tracking-[0.08em] uppercase">
                    Tu respuesta ✓
                </span>
            )}
            {state === 'selectedWrong' && (
                <span className="text-destructive font-mono text-[9px] font-semibold tracking-[0.08em] uppercase">
                    Tu respuesta ✗
                </span>
            )}
            {state === 'missedCorrect' && (
                <span className="text-success font-mono text-[9px] font-semibold tracking-[0.08em] uppercase">
                    Correcta
                </span>
            )}
        </div>
    );
}
