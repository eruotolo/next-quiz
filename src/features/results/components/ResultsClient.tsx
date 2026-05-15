'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteResult } from '@/features/results/actions/mutations';
import { Button } from '@/shared/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/components/ui/dialog';
import { calcGrade } from '@/features/results/lib/grade';
import { formatRut } from '@/shared/lib/rut';
import { cn } from '@/shared/lib/utils';
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
    answers: Record<string, string[] | string>;
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
    slug: string;
}

export function ResultsClient({ examGroups, totalCount, slug }: Props): React.JSX.Element {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; studentName: string } | null>(
        null,
    );
    const [viewTarget, setViewTarget] = useState<{ result: ResultRow; exam: ExamGroup } | null>(
        null,
    );

    function handleDelete(): void {
        if (!deleteTarget) return;
        const { id, studentName } = deleteTarget;
        startTransition(async () => {
            await deleteResult(slug, id);
            setDeleteTarget(null);
            toast.success('Resultado eliminado', {
                description: `Se eliminó el resultado de ${studentName}.`,
            });
            router.refresh();
        });
    }

    if (totalCount === 0) {
        return (
            <div className="border-border flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white py-20">
                <BarChart3 size={40} className="text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground font-medium">Todavía no hay resultados</p>
                <p className="text-muted-foreground/70 mt-1 text-sm">
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
                        className="border-border overflow-hidden rounded-2xl border bg-white shadow-sm"
                    >
                        <div className="border-border bg-muted/50 border-b px-6 py-4">
                            <h2 className="text-foreground font-semibold">{data.title}</h2>
                            <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-sm">
                                <Users size={13} />
                                {data.groupNames} · {data.results.length} alumno
                                {data.results.length !== 1 ? 's' : ''} · Nota máx {data.maxGrade}{' '}
                                (aprobación: {data.passingGrade} con {data.passingPercentage}%)
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-border border-b">
                                    <tr>
                                        <th className="text-muted-foreground px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                            Alumno
                                        </th>
                                        <th className="text-muted-foreground px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                            RUT
                                        </th>
                                        <th className="text-muted-foreground px-6 py-3 text-center text-xs font-semibold tracking-wide uppercase">
                                            Puntaje
                                        </th>
                                        <th className="text-muted-foreground px-6 py-3 text-center text-xs font-semibold tracking-wide uppercase">
                                            Nota
                                        </th>
                                        <th className="text-muted-foreground px-6 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                                            Entregado
                                        </th>
                                        <th className="text-muted-foreground px-6 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-border divide-y">
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
                                                className="hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="text-foreground px-6 py-4 font-medium">
                                                    {r.studentName}
                                                </td>
                                                <td className="text-muted-foreground px-6 py-4 font-mono text-sm">
                                                    {formatRut(r.studentRut)}
                                                </td>
                                                <td className="text-foreground px-6 py-4 text-center text-sm font-semibold">
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
                                                    className="text-muted-foreground px-6 py-4 text-right text-sm"
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
                                                            className="text-muted-foreground hover:text-foreground h-8 w-8"
                                                            onClick={() =>
                                                                setViewTarget({
                                                                    result: r,
                                                                    exam: data,
                                                                })
                                                            }
                                                        >
                                                            <Eye size={15} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-destructive h-8 w-8"
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
                    <p className="text-muted-foreground text-sm">
                        ¿Estás seguro de que querés eliminar el resultado de{' '}
                        <span className="text-foreground font-semibold">
                            {deleteTarget?.studentName}
                        </span>
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
                        <p className="text-muted-foreground text-sm">{viewTarget?.exam.title}</p>
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

    function getSelectedIds(val: string[] | string | undefined): string[] {
        if (!val) return [];
        return Array.isArray(val) ? val : [val];
    }

    return (
        <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-2 pr-1 pb-2">
                {exam.questions.map((q, idx) => {
                    const selectedIds = getSelectedIds(answerMap[q.id]);
                    const correctOptions = q.options.filter((o) => o.isCorrect);
                    const correctSet = new Set(correctOptions.map((o) => o.id));
                    const selectedSet = new Set(selectedIds);
                    const isCorrect =
                        selectedSet.size > 0 &&
                        correctSet.size === selectedSet.size &&
                        [...correctSet].every((id) => selectedSet.has(id));
                    const selectedOptions = q.options.filter((o) => selectedIds.includes(o.id));

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
                                        className="text-success mt-[2px] shrink-0"
                                    />
                                ) : (
                                    <XCircle
                                        size={18}
                                        className="text-destructive mt-[2px] shrink-0"
                                    />
                                )}
                                <p className="text-foreground text-sm leading-snug font-medium">
                                    {idx + 1}. {q.text}
                                </p>
                            </div>
                            {!isCorrect && (
                                <div className="mt-1.5 ml-7 flex flex-col gap-0.5 text-[13px]">
                                    <p className="text-destructive">
                                        <span className="font-semibold">Respuesta:</span>{' '}
                                        {selectedOptions.length > 0
                                            ? selectedOptions.map((o) => o.text).join(', ')
                                            : 'Sin respuesta'}
                                    </p>
                                    <p className="text-success">
                                        <span className="font-semibold">
                                            {correctOptions.length > 1 ? 'Correctas:' : 'Correcta:'}
                                        </span>{' '}
                                        {correctOptions.map((o) => o.text).join(', ')}
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
