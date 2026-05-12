'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    answers: Record<string, string>;
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

export function LiveResultsClient({
    allExams,
    selectedExamId,
    examData,
}: Props): React.JSX.Element {
    const router = useRouter();
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
        router.push(`/admin/liveresults?examId=${e.target.value}`);
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
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Activity size={16} />
                        {autoRefresh && (
                            <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                            </span>
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold leading-none text-foreground">
                            En vivo
                        </h1>
                        {timeLabel && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Actualizado {timeLabel}
                                {examData && (
                                    <span className="ml-2">
                                        · {inProgressCount > 0 && (
                                            <span className="text-primary">{inProgressCount} rindiendo</span>
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
                            className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
            ? completedResults.reduce((sum, r) => sum + (r.grade ?? 0), 0) /
              completedResults.length
            : null;

    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            {/* Student name col */}
                            <th className="sticky left-0 z-10 min-w-[180px] whitespace-nowrap bg-muted/60 px-5 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase backdrop-blur-sm">
                                Alumno
                            </th>
                            {/* Grade / progress col */}
                            <th className="min-w-[80px] whitespace-nowrap bg-muted/60 px-4 py-3 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                Nota
                            </th>
                            {/* Question cols */}
                            {questions.map((q, idx) => (
                                <th
                                    key={q.id}
                                    className="min-w-[130px] bg-muted/60 px-2 pb-2 pt-0 text-center"
                                    title={q.text}
                                >
                                    <div
                                        className={cn(
                                            'mb-2 h-1 w-full',
                                            QUESTION_COLORS[idx % QUESTION_COLORS.length],
                                        )}
                                    />
                                    <span className="text-xs font-bold text-foreground">
                                        {q.order}
                                    </span>
                                    <p className="mt-0.5 line-clamp-1 px-1 text-[10px] font-normal text-muted-foreground">
                                        {q.text}
                                    </p>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
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
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                                                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                                            </span>
                                        ) : (
                                            <span
                                                className="h-2 w-2 shrink-0 rounded-full bg-success"
                                                title="Terminó"
                                            />
                                        )}
                                        <span className="font-medium text-foreground">
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
                                        <span className="text-xs tabular-nums text-muted-foreground">
                                            {Object.keys(r.answers).length}/{questions.length}
                                        </span>
                                    )}
                                </td>

                                {/* Answer cells */}
                                {questions.map((q) => (
                                    <AnswerCell
                                        key={q.id}
                                        question={q}
                                        answers={r.answers}
                                    />
                                ))}
                            </tr>
                        ))}
                    </tbody>

                    {/* Stats footer */}
                    <tfoot>
                        <tr className="border-t-2 border-border bg-muted/40 font-semibold">
                            <td className="sticky left-0 z-10 bg-muted/40 px-5 py-3 text-xs text-muted-foreground backdrop-blur-sm">
                                {completedResults.length} terminaron · {results.filter(r => r.status === 'in-progress').length} rindiendo
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
                                    <span className="text-xs text-muted-foreground">—</span>
                                )}
                            </td>
                            {questions.map((q) => {
                                const correctOpt = q.options.find((o) => o.isCorrect);
                                // Count correct answers from ALL submissions (in-progress + completed)
                                const correct = results.filter(
                                    (r) => r.answers[q.id] === correctOpt?.id,
                                ).length;
                                const answered = results.filter((r) => r.answers[q.id]).length;
                                const pct =
                                    answered > 0
                                        ? Math.round((correct / answered) * 100)
                                        : null;
                                return (
                                    <td key={q.id} className="px-2 py-3 text-center">
                                        {pct !== null ? (
                                            <span
                                                className={cn(
                                                    'text-xs font-bold',
                                                    pct >= 60
                                                        ? 'text-success'
                                                        : 'text-destructive',
                                                )}
                                            >
                                                {pct}%
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                —
                                            </span>
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
    answers: Record<string, string>;
}): React.JSX.Element {
    const selectedId = answers[question.id];

    if (!selectedId) {
        return (
            <td className="px-2 py-3 text-center text-muted-foreground/30">—</td>
        );
    }

    const selectedIndex = question.options.findIndex((o) => o.id === selectedId);
    const letter = selectedIndex >= 0 ? String.fromCharCode(65 + selectedIndex) : '?';
    const correctOption = question.options.find((o) => o.isCorrect);
    const isCorrect = selectedId === correctOption?.id;
    const fullText = question.options[selectedIndex]?.text ?? '';

    return (
        <td className="px-2 py-3">
            <div
                className={cn(
                    'inline-flex w-full items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-bold',
                    isCorrect
                        ? 'bg-success/15 text-success'
                        : 'bg-destructive/15 text-destructive',
                )}
                title={fullText}
            >
                <span>{isCorrect ? '✓' : '✗'}</span>
                <span>{letter}</span>
            </div>
        </td>
    );
}

function EmptyState({ hasExams }: { hasExams: boolean }): React.JSX.Element {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-24">
            <Activity size={40} className="mb-3 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">
                {hasExams
                    ? 'Seleccioná un examen para monitorear'
                    : 'No hay exámenes creados aún'}
            </p>
        </div>
    );
}

function WaitingState({ title }: { title: string }): React.JSX.Element {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-24">
            <span className="relative mb-4 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-primary" />
            </span>
            <p className="font-medium text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
                Esperando que los alumnos comiencen…
            </p>
        </div>
    );
}
