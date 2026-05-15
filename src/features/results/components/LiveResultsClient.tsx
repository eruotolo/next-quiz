'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface QuestionOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface LiveQuestion {
    id: string;
    order: number;
    text: string;
    options: QuestionOption[];
}

export interface LiveResultRow {
    studentId: string;
    studentName: string;
    // null for in-progress students
    score: number | null;
    maxScore: number | null;
    grade: number | null;
    passing: boolean | null;
    status: 'in-progress' | 'completed';
    answers: Record<string, string[] | string>;
}

export interface LiveExamData {
    examId: string;
    title: string;
    maxGrade: number;
    passingGrade: number;
    passingPercentage: number;
    questions: LiveQuestion[];
    results: LiveResultRow[];
}

export interface ExamOption {
    id: string;
    title: string;
    active: boolean;
}

interface Props {
    allExams: ExamOption[];
    selectedExamId: string | null;
    examData: LiveExamData | null;
}

const QUESTION_COLORS = [
    'bg-blue-400',
    'bg-orange-400',
    'bg-purple-400',
    'bg-emerald-400',
    'bg-rose-400',
];

const REFRESH_INTERVAL = 5000;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: legacy complex UI component
export function LiveResultsClient({
    allExams,
    selectedExamId,
    examData,
}: Props): React.JSX.Element {
    const router = useRouter();
    const { slug } = useParams<{ slug: string }>();
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        setLastRefreshed(new Date());
    }, []);

    useEffect(() => {
        if (!autoRefresh) return;
        const id = setInterval(() => {
            setIsRefreshing(true);
            router.refresh();
            setLastRefreshed(new Date());
            setTimeout(() => setIsRefreshing(false), 600);
        }, REFRESH_INTERVAL);
        return () => clearInterval(id);
    }, [autoRefresh, router]);

    function handleExamChange(e: React.ChangeEvent<HTMLSelectElement>): void {
        router.push(`/${slug}/liveresults?examId=${e.target.value}`);
    }

    const timeLabel = lastRefreshed?.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const inProgressCount = examData?.results.filter((r) => r.status === 'in-progress').length ?? 0;
    const completedCount = examData?.results.filter((r) => r.status === 'completed').length ?? 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <div className="bg-primary text-primary-foreground relative flex h-8 w-8 items-center justify-center rounded-lg">
                        <Activity size={16} />
                        {autoRefresh && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                                <span className="bg-success relative inline-flex h-2.5 w-2.5 rounded-full" />
                            </span>
                        )}
                    </div>
                    <div>
                        <h1 className="text-foreground text-2xl leading-none font-bold">En vivo</h1>
                        {timeLabel && (
                            <p className="text-muted-foreground mt-0.5 text-xs">
                                Actualizado {timeLabel}
                                {examData && (
                                    <span className="ml-2">
                                        ·{' '}
                                        {inProgressCount > 0 && (
                                            <span className="text-primary">
                                                {inProgressCount} rindiendo
                                            </span>
                                        )}
                                        {inProgressCount > 0 && completedCount > 0 && ' · '}
                                        {completedCount > 0 && (
                                            <span>{completedCount} terminaron</span>
                                        )}
                                    </span>
                                )}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {allExams.length > 1 && (
                        <select
                            value={selectedExamId ?? ''}
                            onChange={handleExamChange}
                            className="border-border text-foreground focus:ring-ring h-9 rounded-lg border bg-white px-3 text-sm shadow-sm focus:ring-2 focus:outline-none"
                        >
                            {allExams.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.active ? '● ' : '○ '}
                                    {e.title}
                                </option>
                            ))}
                        </select>
                    )}

                    <Button
                        variant={autoRefresh ? 'default' : 'outline'}
                        size="sm"
                        className="gap-2"
                        onClick={() => setAutoRefresh((v) => !v)}
                    >
                        <RefreshCw size={14} className={cn(isRefreshing && 'animate-spin')} />
                        {autoRefresh ? 'Pausar' : 'Reanudar'}
                    </Button>
                </div>
            </div>

            {/* Content */}
            {!examData ? (
                <EmptyState hasExams={allExams.length > 0} />
            ) : examData.results.length === 0 ? (
                <WaitingState title={examData.title} />
            ) : (
                <MatrixTable examData={examData} />
            )}
        </div>
    );
}

function MatrixTable({ examData }: { examData: LiveExamData }): React.JSX.Element {
    const { questions, results, passingGrade } = examData;

    const completedResults = results.filter((r) => r.status === 'completed');
    const avgGrade =
        completedResults.length > 0
            ? completedResults.reduce((sum, r) => sum + (r.grade ?? 0), 0) / completedResults.length
            : null;

    return (
        <div className="border-border overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-border border-b">
                            {/* Student name col */}
                            <th className="bg-muted/60 text-muted-foreground sticky left-0 z-10 min-w-[180px] px-5 py-3 text-left text-xs font-semibold tracking-wide whitespace-nowrap uppercase backdrop-blur-sm">
                                Alumno
                            </th>
                            {/* Grade / progress col */}
                            <th className="bg-muted/60 text-muted-foreground min-w-[80px] px-4 py-3 text-center text-xs font-semibold tracking-wide whitespace-nowrap uppercase">
                                Nota
                            </th>
                            {/* Question cols */}
                            {questions.map((q, idx) => (
                                <th
                                    key={q.id}
                                    className="bg-muted/60 min-w-[130px] px-2 pt-0 pb-2 text-center"
                                    title={q.text}
                                >
                                    <div
                                        className={cn(
                                            'mb-2 h-1 w-full',
                                            QUESTION_COLORS[idx % QUESTION_COLORS.length],
                                        )}
                                    />
                                    <span className="text-foreground text-xs font-bold">
                                        {q.order}
                                    </span>
                                    <p className="text-muted-foreground mt-0.5 line-clamp-1 px-1 text-[10px] font-normal">
                                        {q.text}
                                    </p>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-border divide-y">
                        {results.map((r) => (
                            <tr key={r.studentId} className="hover:bg-muted/20">
                                {/* Name + status dot */}
                                <td className="sticky left-0 z-10 min-w-[180px] bg-white px-5 py-3 backdrop-blur-sm">
                                    <div className="flex items-center gap-2">
                                        {r.status === 'in-progress' ? (
                                            <span
                                                className="relative flex h-2 w-2 shrink-0"
                                                title="Rindiendo"
                                            >
                                                <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                                                <span className="bg-primary relative inline-flex h-2 w-2 rounded-full" />
                                            </span>
                                        ) : (
                                            <span
                                                className="bg-success h-2 w-2 shrink-0 rounded-full"
                                                title="Terminó"
                                            />
                                        )}
                                        <span className="text-foreground font-medium">
                                            {r.studentName}
                                        </span>
                                    </div>
                                </td>

                                {/* Grade or progress */}
                                <td className="px-4 py-3 text-center">
                                    {r.status === 'completed' ? (
                                        <span
                                            className={cn(
                                                'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold',
                                                r.passing
                                                    ? 'bg-success/10 text-success'
                                                    : 'bg-destructive/10 text-destructive',
                                            )}
                                        >
                                            {r.grade?.toFixed(1)}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground text-xs tabular-nums">
                                            {Object.keys(r.answers).length}/{questions.length}
                                        </span>
                                    )}
                                </td>

                                {/* Answer cells */}
                                {questions.map((q) => (
                                    <AnswerCell key={q.id} question={q} answers={r.answers} />
                                ))}
                            </tr>
                        ))}
                    </tbody>

                    {/* Stats footer */}
                    <tfoot>
                        <tr className="border-border bg-muted/40 border-t-2 font-semibold">
                            <td className="bg-muted/40 text-muted-foreground sticky left-0 z-10 px-5 py-3 text-xs backdrop-blur-sm">
                                {completedResults.length} terminaron ·{' '}
                                {results.filter((r) => r.status === 'in-progress').length} rindiendo
                            </td>
                            <td className="px-4 py-3 text-center">
                                {avgGrade !== null ? (
                                    <span
                                        className={cn(
                                            'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold',
                                            avgGrade >= passingGrade
                                                ? 'bg-success/10 text-success'
                                                : 'bg-destructive/10 text-destructive',
                                        )}
                                    >
                                        {avgGrade.toFixed(1)}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground text-xs">—</span>
                                )}
                            </td>
                            {questions.map((q) => {
                                const correctSet = new Set(
                                    q.options.filter((o) => o.isCorrect).map((o) => o.id),
                                );
                                // Count correct answers from ALL submissions (in-progress + completed)
                                const correct = results.filter((r) => {
                                    const raw = r.answers[q.id];
                                    if (!raw) return false;
                                    const ids = Array.isArray(raw) ? raw : [raw];
                                    const sel = new Set(ids);
                                    return (
                                        sel.size === correctSet.size &&
                                        [...correctSet].every((id) => sel.has(id))
                                    );
                                }).length;
                                const answered = results.filter((r) => {
                                    const raw = r.answers[q.id];
                                    return Array.isArray(raw) ? raw.length > 0 : !!raw;
                                }).length;
                                const pct =
                                    answered > 0 ? Math.round((correct / answered) * 100) : null;
                                return (
                                    <td key={q.id} className="px-2 py-3 text-center">
                                        {pct !== null ? (
                                            <span
                                                className={cn(
                                                    'text-xs font-bold',
                                                    pct >= 60 ? 'text-success' : 'text-destructive',
                                                )}
                                            >
                                                {pct}%
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">—</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

function AnswerCell({
    question,
    answers,
}: {
    question: LiveQuestion;
    answers: Record<string, string[] | string>;
}): React.JSX.Element {
    const raw = answers[question.id];

    if (!raw || (Array.isArray(raw) && raw.length === 0)) {
        return <td className="text-muted-foreground/30 px-2 py-3 text-center">—</td>;
    }

    const selectedIds = Array.isArray(raw) ? raw : [raw];
    const correctOptions = question.options.filter((o) => o.isCorrect);
    const correctSet = new Set(correctOptions.map((o) => o.id));
    const selectedSet = new Set(selectedIds);
    const isCorrect =
        selectedSet.size > 0 &&
        correctSet.size === selectedSet.size &&
        [...correctSet].every((id) => selectedSet.has(id));

    const letters = selectedIds
        .map((id) => {
            const idx = question.options.findIndex((o) => o.id === id);
            return idx >= 0 ? String.fromCharCode(65 + idx) : '?';
        })
        .join(',');

    const fullText = selectedIds
        .map((id) => question.options.find((o) => o.id === id)?.text ?? '')
        .filter(Boolean)
        .join(', ');

    return (
        <td className="px-2 py-3">
            <div
                className={cn(
                    'inline-flex w-full items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-bold',
                    isCorrect ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive',
                )}
                title={fullText}
            >
                <span>{isCorrect ? '✓' : '✗'}</span>
                <span>{letters}</span>
            </div>
        </td>
    );
}

function EmptyState({ hasExams }: { hasExams: boolean }): React.JSX.Element {
    return (
        <div className="border-border flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white py-24">
            <Activity size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">
                {hasExams ? 'Seleccioná un examen para monitorear' : 'No hay exámenes creados aún'}
            </p>
        </div>
    );
}

function WaitingState({ title }: { title: string }): React.JSX.Element {
    return (
        <div className="border-border flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white py-24">
            <span className="relative mb-4 flex h-4 w-4">
                <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" />
                <span className="bg-primary relative inline-flex h-4 w-4 rounded-full" />
            </span>
            <p className="text-foreground font-medium">{title}</p>
            <p className="text-muted-foreground mt-1 text-sm">
                Esperando que los alumnos comiencen…
            </p>
        </div>
    );
}
