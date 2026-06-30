'use client';

import type React from 'react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { Activity, PauseCircle, RefreshCw, User, XCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Tag } from '@/shared/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { pauseExamAttempt, cancelExamAttempt } from '@/features/results/actions/exam-control';
import { toast } from 'sonner';

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
    avgTimePerQuestion?: Record<string, number>;
    results: LiveResultRow[];
}

export interface ExamOption {
    id: string;
    title: string;
    active: boolean;
}

export interface GroupOption {
    id: string;
    name: string;
}

interface Props {
    allExams: ExamOption[];
    selectedExamId: string | null;
    examData: LiveExamData | null;
    groupOptions: GroupOption[];
    selectedGroupId: string | null;
}

const QUESTION_COLORS = [
    '#1F2EFF', // Primary
    '#FF9900', // Warning
    '#7C5CFF', // Iris
    '#22C55E', // Success
    '#FF5A4D', // Coral
];

const REFRESH_INTERVAL = 5000;

function formatMs(ms: number | null | undefined): string {
    if (ms == null || ms <= 0) return '—';
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
}

type PendingAction = {
    type: 'pause' | 'cancel';
    studentId: string;
    studentName: string;
    examId: string;
};

export function LiveResultsClient({
    allExams,
    selectedExamId,
    examData,
    groupOptions,
    selectedGroupId,
}: Props): React.JSX.Element {
    const router = useRouter();
    const { slug } = useParams<{ slug: string }>();
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleActionConfirm(): void {
        if (!pendingAction) return;
        startTransition(async () => {
            try {
                if (pendingAction.type === 'pause') {
                    await pauseExamAttempt(slug, pendingAction.studentId, pendingAction.examId);
                    toast.success(`Examen de ${pendingAction.studentName} pausado`);
                } else {
                    await cancelExamAttempt(slug, pendingAction.studentId, pendingAction.examId);
                    toast.success(`Intento de ${pendingAction.studentName} cancelado`);
                }
                router.refresh();
            } catch {
                toast.error('Ocurrió un error. Intenta de nuevo.');
            } finally {
                setPendingAction(null);
            }
        });
    }

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

    const questionStats = useMemo(() => {
        if (!examData?.results.length) return [];
        return examData.questions.map((q) => {
            const total = examData.results.length;
            const counts: Record<string, number> = Object.fromEntries(
                q.options.map((o) => [o.id, 0]),
            );
            let answered = 0;
            for (const r of examData.results) {
                const raw = r.answers[q.id];
                const ids = Array.isArray(raw) ? raw : raw ? [raw] : [];
                if (ids.length > 0) answered++;
                for (const id of ids) {
                    if (counts[id] !== undefined) counts[id]++;
                }
            }
            return { question: q, counts, total, answered };
        });
    }, [examData]);

    function handleExamChange(val: string): void {
        // Reset group when changing exam
        router.push(`/${slug}/liveresults?examId=${val}`);
    }

    function handleGroupChange(val: string): void {
        const params = new URLSearchParams();
        if (selectedExamId) params.set('examId', selectedExamId);
        params.set('groupId', val);
        router.push(`/${slug}/liveresults?${params.toString()}`);
    }

    const timeLabel = lastRefreshed?.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const inProgressCount = examData?.results.filter((r) => r.status === 'in-progress').length ?? 0;
    const completedCount = examData?.results.filter((r) => r.status === 'completed').length ?? 0;

    return (
        <>
            {/* Filter / control bar */}
            <div
                data-tour="liveresults-header"
                className="border-border flex flex-wrap items-center gap-3 border-b bg-white px-8 py-4"
            >
                <span className="text-success flex items-center gap-1.5 text-[13px] font-bold">
                    <span className="relative flex h-2 w-2">
                        <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                        <span className="bg-success relative inline-flex h-2 w-2 rounded-full" />
                    </span>
                    SISTEMA ACTIVO
                </span>
                {timeLabel && (
                    <span className="text-mute text-[13px]">
                        · Última actualización: {timeLabel}
                    </span>
                )}

                <div className="flex-1" />

                {allExams.length > 0 && (
                    <Select value={selectedExamId ?? undefined} onValueChange={handleExamChange}>
                        <SelectTrigger className="border-border h-9 w-[200px] rounded-[10px] bg-white text-[13px] font-medium shadow-sm">
                            <SelectValue placeholder="Seleccionar examen..." />
                        </SelectTrigger>
                        <SelectContent>
                            {allExams.map((e) => (
                                <SelectItem key={e.id} value={e.id}>
                                    {e.active ? '● ' : '○ '} {e.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {selectedExamId && groupOptions.length > 0 && (
                    <Select value={selectedGroupId ?? undefined} onValueChange={handleGroupChange}>
                        <SelectTrigger className="border-border h-9 w-[160px] rounded-[10px] bg-white text-[13px] font-medium shadow-sm">
                            <SelectValue placeholder="Todos los grupos" />
                        </SelectTrigger>
                        <SelectContent>
                            {groupOptions.map((g) => (
                                <SelectItem key={g.id} value={g.id}>
                                    {g.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                <Button
                    variant={autoRefresh ? 'ink' : 'ghost'}
                    size="md"
                    className="min-w-[120px] gap-2"
                    onClick={() => setAutoRefresh((v) => !v)}
                >
                    <RefreshCw size={15} className={cn(isRefreshing && 'animate-spin')} />
                    {autoRefresh ? 'Pausar' : 'Reanudar'}
                </Button>
            </div>

            <main className="flex flex-1 flex-col space-y-6 overflow-hidden p-8">
                {examData && (
                    <div
                        data-tour="liveresults-stats"
                        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                    >
                        <Card className="border-border flex items-center gap-4 bg-white p-5 shadow-sm">
                            <div className="bg-primary-wash text-primary border-primary/10 flex size-10 items-center justify-center rounded-[10px] border">
                                <Activity size={20} />
                            </div>
                            <div>
                                <p className="text-ink text-[20px] leading-none font-bold">
                                    {inProgressCount}
                                </p>
                                <p className="text-mute mt-1 text-[11px] font-bold tracking-widest uppercase">
                                    Rindiendo ahora
                                </p>
                            </div>
                        </Card>
                        <Card className="border-border flex items-center gap-4 bg-white p-5 shadow-sm">
                            <div className="bg-success-wash text-success border-success/10 flex size-10 items-center justify-center rounded-[10px] border">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-ink text-[20px] leading-none font-bold">
                                    {completedCount}
                                </p>
                                <p className="text-mute mt-1 text-[11px] font-bold tracking-widest uppercase">
                                    Entregados
                                </p>
                            </div>
                        </Card>
                        <Card className="border-border flex items-center gap-4 bg-white p-5 shadow-sm">
                            <div className="bg-paper-warm text-ink-dim border-border flex size-10 items-center justify-center rounded-[10px] border">
                                <span className="font-display text-[18px] font-bold">%</span>
                            </div>
                            <div>
                                <p className="text-ink text-[20px] leading-none font-bold">
                                    {examData.results.length > 0
                                        ? Math.round(
                                              (completedCount / examData.results.length) * 100,
                                          )
                                        : 0}
                                    %
                                </p>
                                <p className="text-mute mt-1 text-[11px] font-bold tracking-widest uppercase">
                                    Progreso total
                                </p>
                            </div>
                        </Card>
                    </div>
                )}

                <div data-tour="liveresults-list" className="min-h-0 flex-1">
                    {!examData ? (
                        <Card className="flex h-full flex-col items-center justify-center border-dashed bg-white py-24">
                            <Activity size={48} className="text-mute/20 mb-4" />
                            <p className="text-ink text-lg font-medium">
                                {allExams.length > 0
                                    ? 'Seleccioná un examen para monitorear'
                                    : 'No hay exámenes activos'}
                            </p>
                            <p className="text-mute mt-1 text-sm">
                                Los datos se actualizarán automáticamente cada 5 segundos.
                            </p>
                        </Card>
                    ) : examData.results.length === 0 ? (
                        <Card className="flex h-full flex-col items-center justify-center border-dashed bg-white py-24">
                            <div className="relative mb-6">
                                <span className="bg-primary/20 absolute inset-[-12px] animate-ping rounded-full" />
                                <div className="bg-primary relative size-4 rounded-full shadow-[0_0_15px_rgba(31,46,255,0.5)]" />
                            </div>
                            <p className="text-ink text-lg font-bold">{examData.title}</p>
                            <p className="text-mute mt-1 text-sm font-medium">
                                Esperando que los primeros estudiantes inicien la sesión...
                            </p>
                        </Card>
                    ) : (
                        <Card className="border-border flex h-full flex-col overflow-hidden bg-white p-0 shadow-xl">
                            <div className="flex-1 overflow-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead className="sticky top-0 z-20 shadow-sm">
                                        <tr className="bg-paper border-border border-b">
                                            <th className="bg-paper text-mute border-border sticky left-0 z-30 min-w-[240px] border-r px-6 py-4 text-left font-mono text-[10px] font-bold tracking-[0.15em] uppercase backdrop-blur-md">
                                                Estudiante
                                            </th>
                                            <th className="text-mute border-border min-w-[80px] border-r px-4 py-4 text-center font-mono text-[10px] font-bold tracking-[0.15em] uppercase">
                                                Estado
                                            </th>
                                            {examData.questions.map((q, idx) => (
                                                <th
                                                    key={q.id}
                                                    className="border-border/50 group hover:bg-paper-warm/50 min-w-[100px] border-r px-2 pt-0 pb-3 text-center transition-colors"
                                                >
                                                    <div
                                                        className="mb-3 h-1 w-full [background-color:var(--qc-bg)]"
                                                        style={
                                                            {
                                                                '--qc-bg':
                                                                    QUESTION_COLORS[
                                                                        idx % QUESTION_COLORS.length
                                                                    ],
                                                            } as React.CSSProperties
                                                        }
                                                    />
                                                    <span className="font-display text-ink text-[12px] font-bold">
                                                        Q{q.order}
                                                    </span>
                                                    <div className="mt-1 flex justify-center">
                                                        <div className="bg-mute/30 group-hover:bg-primary size-1 rounded-full transition-colors" />
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody className="divide-border divide-y">
                                        {examData.results.map((r) => (
                                            <tr
                                                key={r.studentId}
                                                className="group hover:bg-paper-warm/20 transition-colors"
                                            >
                                                <td className="border-border group-hover:bg-paper-warm/50 sticky left-0 z-10 border-r bg-white px-6 py-4 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn(
                                                                'size-2 shrink-0 rounded-full',
                                                                r.status === 'in-progress'
                                                                    ? 'bg-primary animate-pulse shadow-[0_0_8px_rgba(31,46,255,0.5)]'
                                                                    : 'bg-success',
                                                            )}
                                                        />
                                                        <span
                                                            className={cn(
                                                                'text-[14px] font-bold',
                                                                r.status === 'completed'
                                                                    ? 'text-ink-dim'
                                                                    : 'text-ink',
                                                            )}
                                                        >
                                                            {r.studentName}
                                                        </span>
                                                        {r.status === 'in-progress' && examData && (
                                                            <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                                <button
                                                                    type="button"
                                                                    title="Pausar examen"
                                                                    onClick={() =>
                                                                        setPendingAction({
                                                                            type: 'pause',
                                                                            studentId: r.studentId,
                                                                            studentName:
                                                                                r.studentName,
                                                                            examId: examData.examId,
                                                                        })
                                                                    }
                                                                    className="text-warning hover:bg-warning/10 rounded p-1 transition-colors"
                                                                >
                                                                    <PauseCircle className="size-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    title="Cancelar intento"
                                                                    onClick={() =>
                                                                        setPendingAction({
                                                                            type: 'cancel',
                                                                            studentId: r.studentId,
                                                                            studentName:
                                                                                r.studentName,
                                                                            examId: examData.examId,
                                                                        })
                                                                    }
                                                                    className="text-danger hover:bg-danger/10 rounded p-1 transition-colors"
                                                                >
                                                                    <XCircle className="size-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="border-border border-r px-4 py-4 text-center">
                                                    {r.status === 'completed' ? (
                                                        <Tag
                                                            tone={r.passing ? 'success' : 'danger'}
                                                            className="font-display h-6 rounded-full px-2.5 text-[13px] font-bold"
                                                        >
                                                            {r.grade?.toFixed(1)}
                                                        </Tag>
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-primary font-mono text-[11px] font-bold">
                                                                {Object.keys(r.answers).length}/
                                                                {examData.questions.length}
                                                            </span>
                                                            <div className="bg-paper-warm mt-1 h-1 w-10 overflow-hidden rounded-full">
                                                                <div
                                                                    className="bg-primary h-full w-[var(--prog-w)] transition-all duration-1000"
                                                                    style={
                                                                        {
                                                                            '--prog-w': `${(Object.keys(r.answers).length / examData.questions.length) * 100}%`,
                                                                        } as React.CSSProperties
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>

                                                {examData.questions.map((q) => (
                                                    <AnswerCell
                                                        key={q.id}
                                                        question={q}
                                                        answers={r.answers}
                                                    />
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Matrix Footer Stats */}
                            <div className="bg-paper border-border flex items-center justify-between border-t px-6 py-4">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-primary size-2 rounded-full" />
                                        <span className="text-mute text-[11px] font-bold tracking-widest uppercase">
                                            Activo
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-success size-2 rounded-full" />
                                        <span className="text-mute text-[11px] font-bold tracking-widest uppercase">
                                            Completado
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-mute text-[11px] font-bold tracking-widest uppercase">
                                        Promedio Grupo:
                                    </span>
                                    <span className="font-display text-primary text-[18px] font-bold">
                                        {(
                                            examData.results
                                                .filter((r) => r.grade !== null)
                                                .reduce((acc, r) => acc + (r.grade || 0), 0) /
                                            (examData.results.filter((r) => r.grade !== null)
                                                .length || 1)
                                        ).toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Per-question option distribution */}
                {questionStats.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-mute px-1 font-mono text-[10px] font-bold tracking-[0.15em] uppercase">
                            Distribución por pregunta
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {questionStats.map(({ question, counts, total, answered }, idx) => (
                                <Card
                                    key={question.id}
                                    className="border-border bg-white p-4 shadow-sm"
                                >
                                    <div className="mb-3 flex items-center gap-2">
                                        <div
                                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] text-[10px] font-bold text-white [background:var(--qs-accent)]"
                                            style={
                                                {
                                                    '--qs-accent':
                                                        QUESTION_COLORS[
                                                            idx % QUESTION_COLORS.length
                                                        ],
                                                } as React.CSSProperties
                                            }
                                        >
                                            {question.order}
                                        </div>
                                        <p className="text-ink line-clamp-2 flex-1 text-[12px] font-medium">
                                            {question.text}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        {question.options.map((opt, optIdx) => {
                                            const count = counts[opt.id] ?? 0;
                                            const pct =
                                                total > 0 ? Math.round((count / total) * 100) : 0;
                                            return (
                                                <div key={opt.id}>
                                                    <div className="mb-0.5 flex items-center gap-1.5">
                                                        <span
                                                            className={cn(
                                                                'flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] font-mono text-[9px] font-bold',
                                                                opt.isCorrect
                                                                    ? 'bg-success text-white'
                                                                    : 'border-border text-mute border',
                                                            )}
                                                        >
                                                            {String.fromCharCode(65 + optIdx)}
                                                        </span>
                                                        <span className="text-ink-dim flex-1 truncate text-[11px]">
                                                            {opt.text}
                                                        </span>
                                                        <span className="text-mute font-mono text-[10px] font-bold">
                                                            {pct}%
                                                        </span>
                                                    </div>
                                                    <div className="bg-paper-warm h-1.5 overflow-hidden rounded-full">
                                                        <div
                                                            className={cn(
                                                                'h-full w-[var(--qs-w)] rounded-full transition-all duration-500',
                                                                opt.isCorrect
                                                                    ? 'bg-success'
                                                                    : 'bg-primary/30',
                                                            )}
                                                            style={
                                                                {
                                                                    '--qs-w': `${pct}%`,
                                                                } as React.CSSProperties
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="text-mute mt-3 flex items-center justify-between text-[10px] font-medium">
                                        <span>
                                            {answered}/{total} respondieron
                                        </span>
                                        <span className="font-mono">
                                            Tiempo medio:{' '}
                                            {formatMs(examData?.avgTimePerQuestion?.[question.id])}
                                        </span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <AlertDialog
                open={!!pendingAction}
                onOpenChange={(open) => !open && setPendingAction(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingAction?.type === 'pause' ? 'Pausar examen' : 'Cancelar intento'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingAction?.type === 'pause' ? (
                                <>
                                    ¿Pausar el examen de{' '}
                                    <strong>{pendingAction?.studentName}</strong>? El alumno volverá
                                    a la pantalla de instrucciones. Sus respuestas se conservan y
                                    podrá retomar el examen con tiempo nuevo.
                                </>
                            ) : (
                                <>
                                    ¿Cancelar el intento de{' '}
                                    <strong>{pendingAction?.studentName}</strong>? Se eliminarán
                                    todas sus respuestas. El alumno podrá rendir el examen
                                    nuevamente desde cero.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Volver</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleActionConfirm}
                            disabled={isPending}
                            className={
                                pendingAction?.type === 'cancel'
                                    ? 'bg-danger hover:bg-danger/90 text-white'
                                    : undefined
                            }
                        >
                            {isPending
                                ? 'Procesando...'
                                : pendingAction?.type === 'pause'
                                  ? 'Pausar'
                                  : 'Cancelar intento'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
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
        return <td className="border-border/30 border-r px-2 py-4 text-center opacity-20">—</td>;
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

    return (
        <td
            className={cn(
                'border-border/30 border-r px-2 py-4 text-center transition-colors',
                isCorrect ? 'bg-success/5' : 'bg-danger-wash/30',
            )}
        >
            <div
                className={cn(
                    'inline-flex h-6 min-w-[32px] items-center justify-center rounded-md px-1.5 text-[11px] font-bold shadow-sm ring-1 ring-inset',
                    isCorrect
                        ? 'bg-success ring-success/20 text-white'
                        : 'bg-destructive ring-destructive/20 text-white',
                )}
            >
                {letters}
            </div>
        </td>
    );
}
