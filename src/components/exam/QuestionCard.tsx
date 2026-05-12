'use client';

import { cn } from '@/lib/utils';
import type { SafeQuestion } from '@/types/exam';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

interface QuestionCardProps {
    question: SafeQuestion;
    questionNumber: number;
    totalQuestions: number;
    selectedOptionId: string | null;
    onSelect: (optionId: string) => void;
    disabled?: boolean;
}

export function QuestionCard({
    question,
    questionNumber,
    totalQuestions,
    selectedOptionId,
    onSelect,
    disabled,
}: QuestionCardProps) {
    return (
        <div className="flex flex-col gap-[22px]">
            <div className="space-y-1.5">
                <p className="text-[13px] font-medium text-muted-foreground">
                    Pregunta {questionNumber} de {totalQuestions}
                </p>
                <h2 className="text-[26px] leading-[1.3] font-bold tracking-tight text-foreground">
                    {question.text}
                </h2>
            </div>

            <div
                className="flex flex-col gap-3"
                role="radiogroup"
                aria-label="Opciones de respuesta"
            >
                {question.options.map((option, idx) => {
                    const label = LABELS[idx] ?? String(idx + 1);
                    const isSelected = selectedOptionId === option.id;

                    return (
                        <button
                            key={option.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => onSelect(option.id)}
                            aria-pressed={isSelected}
                            className={cn(
                                'flex w-full items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all duration-150',
                                'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                                disabled && 'cursor-not-allowed opacity-60',
                                isSelected
                                    ? 'border-primary bg-primary/5 shadow-md'
                                    : 'border-border hover:border-primary/40 hover:bg-primary/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
                            )}
                        >
                            <span
                                className={cn(
                                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors',
                                    isSelected
                                        ? 'bg-primary text-white'
                                        : 'bg-muted text-muted-foreground',
                                )}
                            >
                                {label}
                            </span>
                            <span
                                className={cn(
                                    'text-base font-medium',
                                    isSelected ? 'text-primary' : 'text-foreground',
                                )}
                            >
                                {option.text}
                            </span>
                            {isSelected && (
                                <span className="ml-auto text-primary">
                                    <svg
                                        aria-hidden="true"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
