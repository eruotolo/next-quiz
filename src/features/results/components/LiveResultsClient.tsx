'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { Activity, RefreshCw, ChevronDown, User } from 'lucide-react';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Tag } from '@/shared/components/ui/badge';

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
    '#1F2EFF', // Primary
    '#FF9900', // Warning
    '#7C5CFF', // Iris
    '#22C55E', // Success
    '#FF5A4D', // Coral
];

const REFRESH_INTERVAL = 5000;

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

    function handleExamChange(val: string): void {
        router.push(`/${slug}/liveresults?examId=${val}`);
    }

    const timeLabel = lastRefreshed?.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const inProgressCount = examData?.results.filter((r) => r.status === 'in-progress').length ?? 0;
    const completedCount = examData?.results.filter((r) => r.status === 'completed').length ?? 0;

    return (
        <div className="flex flex-col min-h-screen bg-paper">
            {/* Header */}
            <AdminTopBar
                breadcrumb={['Monitor', 'En Vivo']}
                title="Monitoreo en Tiempo Real"
                subtitle={
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-success font-bold">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                            </span>
                            SISTEMA ACTIVO
                        </span>
                        {timeLabel && <span className="text-mute">· Última actualización: {timeLabel}</span>}
                    </div>
                }
                actions={
                    <div className="flex items-center gap-3">
                        {allExams.length > 0 && (
                            <div className="relative group">
                                <select
                                    value={selectedExamId ?? ''}
                                    onChange={(e) => handleExamChange(e.target.value)}
                                    className="h-10 pl-4 pr-10 rounded-[12px] border border-border bg-white text-[13px] font-bold text-ink appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20 outline-none shadow-sm transition-all"
                                >
                                    <option value="" disabled>Seleccionar examen...</option>
                                    {allExams.map((e) => (
                                        <option key={e.id} value={e.id}>
                                            {e.active ? '● ' : '○ '} {e.title}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-mute pointer-events-none transition-transform group-hover:translate-y-[-40%]" />
                            </div>
                        )}

                        <Button
                            variant={autoRefresh ? 'ink' : 'ghost'}
                            size="md"
                            className="gap-2 min-w-[120px]"
                            onClick={() => setAutoRefresh((v) => !v)}
                        >
                            <RefreshCw size={15} className={cn(isRefreshing && 'animate-spin')} />
                            {autoRefresh ? 'Pausar' : 'Reanudar'}
                        </Button>
                    </div>
                }
            />

            <main className="flex-1 p-8 space-y-6 overflow-hidden flex flex-col">
                {examData && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Card className="p-5 flex items-center gap-4 bg-white border-border shadow-sm">
                            <div className="size-10 rounded-[10px] bg-primary-wash flex items-center justify-center text-primary border border-primary/10">
                                <Activity size={20} />
                            </div>
                            <div>
                                <p className="text-[20px] font-bold text-ink leading-none">{inProgressCount}</p>
                                <p className="text-[11px] font-bold text-mute uppercase tracking-widest mt-1">Rindiendo ahora</p>
                            </div>
                        </Card>
                        <Card className="p-5 flex items-center gap-4 bg-white border-border shadow-sm">
                            <div className="size-10 rounded-[10px] bg-success-wash flex items-center justify-center text-success border border-success/10">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-[20px] font-bold text-ink leading-none">{completedCount}</p>
                                <p className="text-[11px] font-bold text-mute uppercase tracking-widest mt-1">Entregados</p>
                            </div>
                        </Card>
                        <Card className="p-5 flex items-center gap-4 bg-white border-border shadow-sm">
                            <div className="size-10 rounded-[10px] bg-paper-warm flex items-center justify-center text-ink-dim border border-border">
                                <span className="font-display font-bold text-[18px]">%</span>
                            </div>
                            <div>
                                <p className="text-[20px] font-bold text-ink leading-none">
                                    {examData.results.length > 0 ? Math.round((completedCount / examData.results.length) * 100) : 0}%
                                </p>
                                <p className="text-[11px] font-bold text-mute uppercase tracking-widest mt-1">Progreso total</p>
                            </div>
                        </Card>
                    </div>
                )}

                <div className="flex-1 min-h-0">
                    {!examData ? (
                        <Card className="h-full flex flex-col items-center justify-center border-dashed py-24 bg-white">
                            <Activity size={48} className="mb-4 text-mute/20" />
                            <p className="text-lg font-medium text-ink">
                                {allExams.length > 0 ? 'Seleccioná un examen para monitorear' : 'No hay exámenes activos'}
                            </p>
                            <p className="mt-1 text-sm text-mute">Los datos se actualizarán automáticamente cada 5 segundos.</p>
                        </Card>
                    ) : examData.results.length === 0 ? (
                        <Card className="h-full flex flex-col items-center justify-center border-dashed py-24 bg-white">
                            <div className="relative mb-6">
                                <span className="absolute inset-[-12px] animate-ping rounded-full bg-primary/20" />
                                <div className="relative size-4 rounded-full bg-primary shadow-[0_0_15px_rgba(31,46,255,0.5)]" />
                            </div>
                            <p className="text-lg font-bold text-ink">{examData.title}</p>
                            <p className="mt-1 text-sm text-mute font-medium">Esperando que los primeros estudiantes inicien la sesión...</p>
                        </Card>
                    ) : (
                        <Card className="h-full flex flex-col border-border bg-white shadow-xl overflow-hidden p-0">
                            <div className="flex-1 overflow-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead className="sticky top-0 z-20 shadow-sm">
                                        <tr className="bg-paper border-b border-border">
                                            <th className="sticky left-0 z-30 bg-paper px-6 py-4 text-left font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-mute min-w-[240px] border-r border-border backdrop-blur-md">
                                                Estudiante
                                            </th>
                                            <th className="px-4 py-4 text-center font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-mute min-w-[80px] border-r border-border">
                                                Estado
                                            </th>
                                            {examData.questions.map((q, idx) => (
                                                <th key={q.id} className="px-2 pt-0 pb-3 text-center min-w-[100px] border-r border-border/50 group hover:bg-paper-warm/50 transition-colors">
                                                    <div
                                                        className="mb-3 h-1 w-full"
                                                        style={{ backgroundColor: QUESTION_COLORS[idx % QUESTION_COLORS.length] }}
                                                    />
                                                    <span className="text-[12px] font-display font-bold text-ink">Q{q.order}</span>
                                                    <div className="mt-1 flex justify-center">
                                                        <div className="size-1 rounded-full bg-mute/30 group-hover:bg-primary transition-colors" />
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-border">
                                        {examData.results.map((r) => (
                                            <tr key={r.studentId} className="group hover:bg-paper-warm/20 transition-colors">
                                                <td className="sticky left-0 z-10 bg-white px-6 py-4 border-r border-border group-hover:bg-paper-warm/50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "size-2 rounded-full",
                                                            r.status === 'in-progress' ? "bg-primary animate-pulse shadow-[0_0_8px_rgba(31,46,255,0.5)]" : "bg-success"
                                                        )} />
                                                        <span className={cn("text-[14px] font-bold", r.status === 'completed' ? "text-ink-dim" : "text-ink")}>
                                                            {r.studentName}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4 text-center border-r border-border">
                                                    {r.status === 'completed' ? (
                                                        <Tag
                                                            tone={r.passing ? "success" : "danger"}
                                                            className="font-display font-bold text-[13px] h-6 px-2.5 rounded-full"
                                                        >
                                                            {r.grade?.toFixed(1)}
                                                        </Tag>
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-mono text-[11px] font-bold text-primary">
                                                                {Object.keys(r.answers).length}/{examData.questions.length}
                                                            </span>
                                                            <div className="w-10 h-1 bg-paper-warm rounded-full mt-1 overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-primary transition-all duration-1000" 
                                                                    style={{ width: `${(Object.keys(r.answers).length / examData.questions.length) * 100}%` }} 
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>

                                                {examData.questions.map((q) => (
                                                    <AnswerCell key={q.id} question={q} answers={r.answers} />
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Matrix Footer Stats */}
                            <div className="bg-paper border-t border-border px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-primary" />
                                        <span className="text-[11px] font-bold text-mute uppercase tracking-widest">Activo</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-success" />
                                        <span className="text-[11px] font-bold text-mute uppercase tracking-widest">Completado</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-mute uppercase tracking-widest">Promedio Grupo:</span>
                                    <span className="font-display font-bold text-[18px] text-primary">
                                        {(examData.results.filter(r => r.grade !== null).reduce((acc, r) => acc + (r.grade || 0), 0) / (examData.results.filter(r => r.grade !== null).length || 1)).toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </main>
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
        return <td className="px-2 py-4 text-center border-r border-border/30 opacity-20">—</td>;
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
        <td className={cn("px-2 py-4 text-center border-r border-border/30 transition-colors", isCorrect ? "bg-success/5" : "bg-danger-wash/30")}>
            <div
                className={cn(
                    'inline-flex items-center justify-center min-w-[32px] h-6 rounded-md px-1.5 text-[11px] font-bold shadow-sm ring-1 ring-inset',
                    isCorrect 
                        ? 'bg-success text-white ring-success/20' 
                        : 'bg-destructive text-white ring-destructive/20',
                )}
            >
                {letters}
            </div>
        </td>
    );
}
