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
        <div className="flex flex-col gap-5">
            <div className="space-y-2">
                <p className="text-default-400 text-sm font-medium">
                    Pregunta {questionNumber} de {totalQuestions}
                </p>
                <h2 className="text-default-900 text-2xl leading-snug font-semibold">
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
                                    ? 'border-primary bg-primary/8 shadow-md'
                                    : 'border-default-200 hover:border-primary/40 hover:bg-primary/4 bg-white hover:shadow-sm',
                            )}
                        >
                            <span
                                className={cn(
                                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors',
                                    isSelected
                                        ? 'bg-primary text-white'
                                        : 'bg-default-100 text-default-500',
                                )}
                            >
                                {label}
                            </span>
                            <span
                                className={cn(
                                    'text-base font-medium',
                                    isSelected ? 'text-primary' : 'text-default-700',
                                )}
                            >
                                {option.text}
                            </span>
                            {isSelected && (
                                <span className="text-primary ml-auto">
                                    <svg
                                        aria-hidden="true"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
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
