'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteResult } from '@/actions/results';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { calcGrade } from '@/lib/grade';
import { formatRut } from '@/lib/rut';
import { cn } from '@/lib/utils';
import { BarChart3, CheckCircle, Eye, Trash2, Users, XCircle } from 'lucide-react';

interface QuestionOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface ExamQuestion {
    id: string;
    order: number;
    text: string;
    options: QuestionOption[];
}

export interface ResultRow {
    id: string;
    studentName: string;
    studentRut: string;
    score: number;
    maxScore: number;
    completedAt: string;
    answers: Record<string, string>;
}

export interface ExamGroup {
    examId: string;
    title: string;
    groupNames: string;
    maxGrade: number;
    passingGrade: number;
    passingPercentage: number;
    questions: ExamQuestion[];
    results: ResultRow[];
}

interface Props {
    examGroups: ExamGroup[];
    totalCount: number;
}

export function ResultsClient({ examGroups, totalCount }: Props): React.JSX.Element {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; studentName: string } | null>(null);
    const [viewTarget, setViewTarget] = useState<{ result: ResultRow; exam: ExamGroup } | null>(null);

    function handleDelete(): void {
        if (!deleteTarget) return;
        const { id, studentName } = deleteTarget;
        startTransition(async () => {
            await deleteResult(id);
            setDeleteTarget(null);
            toast.success('Resultado eliminado', {
                description: `Se eliminó el resultado de ${studentName}.`,
            });
            router.refresh();
        });
    }

    if (totalCount === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-20">
                <BarChart3 size={40} className="mb-3 text-muted-foreground/40" />
                <p className="font-medium text-muted-foreground">Todavía no hay resultados</p>
                <p className="mt-1 text-sm text-muted-foreground/70">
                    Los resultados aparecerán aquí cuando los alumnos completen exámenes.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {examGroups.map((data) => (
                    <div
                        key={data.examId}
                        className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
                    >
                        <div className="border-b border-border bg-muted/50 px-6 py-4">
                            <h2 className="font-semibold text-foreground">{data.title}</h2>
                            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                                <Users size={13} />
                                {data.groupNames} · {data.results.length} alumno
                                {data.results.length !== 1 ? 's' : ''} · Nota máx {data.maxGrade}{' '}
                                (aprobación: {data.passingGrade} con {data.passingPercentage}%)
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-border">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Alumno
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            RUT
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Puntaje
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Nota
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Entregado
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {data.results.map((r) => {
                                        const grade = calcGrade(
                                            r.score,
                                            r.maxScore,
                                            data.maxGrade,
                                            data.passingGrade,
                                            data.passingPercentage,
                                        );
                                        const passing = grade >= data.passingGrade;
                                        return (
                                            <tr
                                                key={r.id}
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-6 py-4 font-medium text-foreground">
                                                    {r.studentName}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                                                    {formatRut(r.studentRut)}
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                                                    {r.score}/{r.maxScore}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center justify-center rounded-full px-3 py-0.5 text-xs font-bold',
                                                            passing
                                                                ? 'bg-success/10 text-success'
                                                                : 'bg-destructive/10 text-destructive',
                                                        )}
                                                    >
                                                        {grade.toFixed(1)}
                                                    </span>
                                                </td>
                                                <td
                                                    suppressHydrationWarning
                                                    className="px-6 py-4 text-right text-sm text-muted-foreground"
                                                >
                                                    {new Date(r.completedAt).toLocaleDateString(
                                                        'es-CL',
                                                        {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        },
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                            onClick={() =>
                                                                setViewTarget({ result: r, exam: data })
                                                            }
                                                        >
                                                            <Eye size={15} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            onClick={() =>
                                                                setDeleteTarget({
                                                                    id: r.id,
                                                                    studentName: r.studentName,
                                                                })
                                                            }
                                                        >
                                                            <Trash2 size={15} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delete confirmation */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Eliminar resultado</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        ¿Estás seguro de que querés eliminar el resultado de{' '}
                        <span className="font-semibold text-foreground">{deleteTarget?.studentName}</span>
                        ? Esta acción no se puede deshacer.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                            {isPending ? 'Eliminando…' : 'Eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Answers review */}
            <Dialog open={!!viewTarget} onOpenChange={(open) => !open && setViewTarget(null)}>
                <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg">
                    <DialogHeader className="shrink-0">
                        <DialogTitle>{viewTarget?.result.studentName}</DialogTitle>
                        <p className="text-sm text-muted-foreground">{viewTarget?.exam.title}</p>
                    </DialogHeader>
                    {viewTarget && (
                        <AnswersReview result={viewTarget.result} exam={viewTarget.exam} />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function AnswersReview({
    result,
    exam,
}: {
    result: ResultRow;
    exam: ExamGroup;
}): React.JSX.Element {
    const answerMap = result.answers;
    return (
        <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-2 pb-2 pr-1">
                {exam.questions.map((q, idx) => {
                    const selectedId = answerMap[q.id];
                    const correctOption = q.options.find((o) => o.isCorrect);
                    const selectedOption = q.options.find((o) => o.id === selectedId);
                    const isCorrect = selectedId === correctOption?.id;

                    return (
                        <div
                            key={q.id}
                            className={cn(
                                'rounded-[14px] border-2 p-[14px]',
                                isCorrect
                                    ? 'border-success/30 bg-success/10'
                                    : 'border-destructive/30 bg-destructive/10',
                            )}
                        >
                            <div className="flex items-start gap-2.5">
                                {isCorrect ? (
                                    <CheckCircle
                                        size={18}
                                        className="mt-[2px] shrink-0 text-success"
                                    />
                                ) : (
                                    <XCircle
                                        size={18}
                                        className="mt-[2px] shrink-0 text-destructive"
                                    />
                                )}
                                <p className="text-sm font-medium leading-snug text-foreground">
                                    {idx + 1}. {q.text}
                                </p>
                            </div>
                            {!isCorrect && (
                                <div className="ml-7 mt-1.5 flex flex-col gap-0.5 text-[13px]">
                                    <p className="text-destructive">
                                        <span className="font-semibold">Respuesta:</span>{' '}
                                        {selectedOption?.text ?? 'Sin respuesta'}
                                    </p>
                                    <p className="text-success">
                                        <span className="font-semibold">Correcta:</span>{' '}
                                        {correctOption?.text}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
