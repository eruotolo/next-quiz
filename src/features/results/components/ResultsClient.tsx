'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteResult, recalculateResult } from '@/features/results/actions/mutations';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/components/ui/table';
import { Tag } from '@/shared/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { calcGrade } from '@/features/results/lib/grade';
import { formatRut } from '@/shared/lib/rut';
import { cn } from '@/shared/lib/utils';
import {
    BarChart3,
    CheckCircle,
    Eye,
    Loader2,
    RefreshCw,
    Trash2,
    Users,
    XCircle,
    MoreHorizontal,
    X,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

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

export interface ExamOption {
    id: string;
    title: string;
}

export interface GroupOption {
    id: string;
    name: string;
}

export interface ExamGroup {
    examId: string;
    groupId: string;
    title: string;
    groupName: string;
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
    institutionName: string;
    examOptions: ExamOption[];
    groupOptions: GroupOption[];
    selectedExamId: string | null;
    selectedGroupId: string | null;
}

export function ResultsClient({
    examGroups,
    totalCount,
    slug,
    institutionName,
    examOptions,
    groupOptions,
    selectedExamId,
    selectedGroupId,
}: Props): React.JSX.Element {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; studentName: string } | null>(
        null,
    );
    const [viewTarget, setViewTarget] = useState<{ result: ResultRow; exam: ExamGroup } | null>(
        null,
    );

    function handleExamChange(val: string): void {
        router.push(`/${slug}/results?examId=${val}`);
    }

    function handleGroupChange(val: string): void {
        const params = new URLSearchParams();
        if (selectedExamId) params.set('examId', selectedExamId);
        params.set('groupId', val);
        router.push(`/${slug}/results?${params.toString()}`);
    }

    function handleClearFilters(): void {
        router.push(`/${slug}/results`);
    }

    function handleDelete(): void {
        if (!deleteTarget) return;
        const { id, studentName } = deleteTarget;
        startTransition(async () => {
            const result = await deleteResult(slug, id);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            setDeleteTarget(null);
            toast.success('Resultado eliminado', {
                description: `Se eliminó el resultado de ${studentName}.`,
            });
            router.refresh();
        });
    }

    function handleRecalculate(id: string, studentName: string): void {
        startTransition(async () => {
            const result = await recalculateResult(slug, id);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Resultado recalculado', {
                description: `Se recalculó la nota de ${studentName}.`,
            });
            router.refresh();
        });
    }

    const allResults = examGroups.flatMap((eg) =>
        eg.results.map((r) => ({
            grade: calcGrade(
                r.score,
                r.maxScore,
                eg.maxGrade,
                eg.passingGrade,
                eg.passingPercentage,
            ),
            passingGrade: eg.passingGrade,
        })),
    );
    const avgGrade =
        allResults.length > 0 ? allResults.reduce((s, r) => s + r.grade, 0) / allResults.length : 0;
    const passingCount = allResults.filter((r) => r.grade >= r.passingGrade).length;
    const passingRate =
        allResults.length > 0 ? Math.round((passingCount / allResults.length) * 100) : 0;

    const hasActiveFilters = !!(selectedExamId ?? selectedGroupId);

    return (
        <div className="bg-paper flex min-h-screen flex-col">
            <AdminTopBar
                breadcrumb={[institutionName, 'Resultados']}
                title="Historial de Resultados"
                subtitle={`${totalCount} evaluaciones completadas y procesadas`}
            />

            <main className="flex-1 space-y-8 overflow-auto p-8">
                {/* Global Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[
                        {
                            label: 'Total Entregas',
                            value: String(totalCount),
                            icon: Users,
                            color: '#1F2EFF',
                        },
                        {
                            label: 'Promedio General',
                            value: avgGrade.toFixed(1),
                            icon: BarChart3,
                            color: '#7C5CFF',
                        },
                        {
                            label: 'Tasa Aprobación',
                            value: `${passingRate}%`,
                            icon: CheckCircle,
                            color: '#22C55E',
                        },
                    ].map((tile) => (
                        <Card key={tile.label} className="border-border bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-3">
                                <div
                                    className="border-border bg-paper-warm flex size-8 items-center justify-center rounded-[8px] border"
                                    style={{ color: tile.color }}
                                >
                                    <tile.icon size={16} />
                                </div>
                                <span className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                    {tile.label}
                                </span>
                            </div>
                            <p className="font-display text-ink text-[32px] leading-none font-bold tracking-tight">
                                {tile.value}
                            </p>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                {examOptions.length > 0 && (
                    <div className="border-border flex flex-wrap items-center gap-3 rounded-[14px] border bg-white px-4 py-3 shadow-sm">
                        <span className="text-mute font-mono text-[10px] font-bold tracking-widest uppercase">
                            Filtrar por:
                        </span>
                        <Select
                            value={selectedExamId ?? ''}
                            onValueChange={handleExamChange}
                        >
                            <SelectTrigger className="border-border h-9 w-[220px] rounded-[10px] bg-white text-[13px] font-medium shadow-sm">
                                <SelectValue placeholder="Todos los exámenes" />
                            </SelectTrigger>
                            <SelectContent>
                                {examOptions.map((e) => (
                                    <SelectItem key={e.id} value={e.id}>
                                        {e.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {selectedExamId && groupOptions.length > 0 && (
                            <Select
                                value={selectedGroupId ?? ''}
                                onValueChange={handleGroupChange}
                            >
                                <SelectTrigger className="border-border h-9 w-[180px] rounded-[10px] bg-white text-[13px] font-medium shadow-sm">
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

                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearFilters}
                                className="text-mute hover:text-ink h-9 gap-1.5 rounded-[10px] text-[12px]"
                            >
                                <X size={13} />
                                Limpiar filtros
                            </Button>
                        )}
                    </div>
                )}

                {totalCount === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <BarChart3 size={48} className="text-mute/20 mb-4" />
                        <p className="text-ink text-lg font-medium">
                            {hasActiveFilters
                                ? 'No hay resultados para los filtros seleccionados'
                                : 'Todavía no hay resultados'}
                        </p>
                        <p className="text-mute mt-1 text-sm">
                            {hasActiveFilters
                                ? 'Probá cambiando el examen o el grupo.'
                                : 'Los resultados aparecerán aquí cuando los alumnos completen exámenes.'}
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-10">
                        {examGroups.map((data) => (
                            <div key={`${data.examId}-${data.groupId}`} className="space-y-4">
                                <div className="flex items-end justify-between px-2">
                                    <div>
                                        <h2 className="font-display text-ink text-[22px] font-bold tracking-tight">
                                            {data.title}
                                        </h2>
                                        <div className="text-mute mt-1 flex items-center gap-2">
                                            <Tag
                                                tone="outline"
                                                className="bg-paper-warm/50 border-border h-5 font-mono text-[10px]"
                                            >
                                                {data.groupName}
                                            </Tag>
                                            <span className="text-[12px] font-medium">
                                                · {data.results.length} alumnos evaluados
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-mute border-border rounded-full border bg-white px-3 py-1 font-mono text-[10px] font-bold tracking-widest uppercase">
                                        Escala: {data.passingGrade} ({data.passingPercentage}%)
                                    </div>
                                </div>

                                <Card className="border-border overflow-visible p-0 shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-paper">
                                            <TableRow className="border-border border-b hover:bg-transparent">
                                                <TableHead>Estudiante</TableHead>
                                                <TableHead className="w-[160px]">RUT</TableHead>
                                                <TableHead className="w-[140px] text-center">
                                                    Puntaje
                                                </TableHead>
                                                <TableHead className="w-[120px] text-center">
                                                    Nota
                                                </TableHead>
                                                <TableHead className="w-[180px] text-right">
                                                    Fecha de Entrega
                                                </TableHead>
                                                <TableHead className="w-12" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
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
                                                    <TableRow
                                                        key={r.id}
                                                        className="group border-border h-16 border-b last:border-0"
                                                    >
                                                        <TableCell>
                                                            <span className="text-ink text-[13.5px] font-bold">
                                                                {r.studentName}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-mute font-mono text-[12px]">
                                                            {formatRut(r.studentRut)}
                                                        </TableCell>
                                                        <TableCell className="text-ink-dim text-center font-mono text-[13px] font-bold">
                                                            {r.score} / {r.maxScore}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Tag
                                                                tone={
                                                                    passing ? 'success' : 'danger'
                                                                }
                                                                className="font-display h-7 rounded-full px-3 text-[14px] font-bold"
                                                            >
                                                                {grade.toFixed(1)}
                                                            </Tag>
                                                        </TableCell>
                                                        <TableCell className="text-mute text-right font-mono text-[11px] font-bold uppercase">
                                                            {new Date(
                                                                r.completedAt,
                                                            ).toLocaleDateString('es-CL', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon-sm"
                                                                        className="h-9 w-9"
                                                                    >
                                                                        <MoreHorizontal
                                                                            size={18}
                                                                            className="text-mute"
                                                                        />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent
                                                                    align="end"
                                                                    className="border-border w-44 rounded-xl shadow-xl"
                                                                >
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            setViewTarget({
                                                                                result: r,
                                                                                exam: data,
                                                                            })
                                                                        }
                                                                        className="cursor-pointer gap-2 py-2.5"
                                                                    >
                                                                        <Eye size={14} /> Revisar
                                                                        respuestas
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            handleRecalculate(
                                                                                r.id,
                                                                                r.studentName,
                                                                            )
                                                                        }
                                                                        className="cursor-pointer gap-2 py-2.5"
                                                                    >
                                                                        <RefreshCw size={14} />{' '}
                                                                        Recalcular nota
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            setDeleteTarget({
                                                                                id: r.id,
                                                                                studentName:
                                                                                    r.studentName,
                                                                            })
                                                                        }
                                                                        className="text-destructive focus:bg-danger-wash focus:text-destructive cursor-pointer gap-2 py-2.5"
                                                                    >
                                                                        <Trash2 size={14} />{' '}
                                                                        Eliminar registro
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Delete confirmation */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="border-border rounded-[22px] shadow-2xl sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="font-display text-destructive text-2xl">
                            Eliminar registro
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Confirmación para eliminar el registro de resultado.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-ink-dim text-[14px] leading-relaxed">
                            ¿Estás seguro de eliminar el resultado de{' '}
                            <strong className="text-ink">{deleteTarget?.studentName}</strong>? Esta
                            acción no se puede deshacer.
                        </p>
                    </div>
                    <DialogFooter className="mt-2 gap-2 sm:justify-end">
                        <Button
                            variant="ghost"
                            size="md"
                            onClick={() => setDeleteTarget(null)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            size="md"
                            onClick={handleDelete}
                            disabled={isPending}
                        >
                            {isPending && <Loader2 className="mr-2 animate-spin" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Answers review */}
            <Dialog open={!!viewTarget} onOpenChange={(open) => !open && setViewTarget(null)}>
                <DialogContent className="border-border flex max-h-[90vh] flex-col overflow-hidden rounded-[22px] p-0 shadow-2xl sm:max-w-lg">
                    <div className="border-border bg-paper border-b px-6 py-5">
                        <DialogTitle className="font-display text-ink text-xl">
                            {viewTarget?.result.studentName}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Detalle del resultado del estudiante en el examen.
                        </DialogDescription>
                        <p className="text-mute mt-1 text-[12px] font-bold tracking-widest uppercase">
                            {viewTarget?.exam.title}
                        </p>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        {viewTarget && (
                            <AnswersReview result={viewTarget.result} exam={viewTarget.exam} />
                        )}
                    </div>
                    <div className="border-border flex justify-end border-t bg-white px-6 py-4">
                        <Button variant="ink" size="md" onClick={() => setViewTarget(null)}>
                            Cerrar revisión
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
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

    const analysisMap = React.useMemo(() => {
        const map = new Map();
        for (const q of exam.questions) {
            const correctOptions = q.options.filter((o) => o.isCorrect);
            const correctSet = new Set(correctOptions.map((o) => o.id));
            map.set(q.id, { correctOptions, correctSet });
        }
        return map;
    }, [exam.questions]);

    return (
        <div className="h-full space-y-4 overflow-y-auto px-6 py-6">
            {exam.questions.map((q, idx) => {
                const selectedIds = getSelectedIds(answerMap[q.id]);
                const { correctOptions, correctSet } = analysisMap.get(q.id)!;
                const selectedSet = new Set(selectedIds);
                const isCorrect =
                    selectedSet.size > 0 &&
                    correctSet.size === selectedSet.size &&
                    [...correctSet].every((id) => selectedSet.has(id));
                const selectedOptions = q.options.filter((o) => selectedSet.has(o.id));

                return (
                    <div
                        key={q.id}
                        className={cn(
                            'rounded-[14px] border p-4 transition-all',
                            isCorrect
                                ? 'border-success/20 bg-success/5'
                                : 'border-destructive/20 bg-danger-wash/50',
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={cn(
                                    'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full',
                                    isCorrect
                                        ? 'bg-success text-white'
                                        : 'bg-destructive text-white',
                                )}
                            >
                                {isCorrect ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            </div>
                            <div className="flex-1">
                                <p className="text-ink text-[14px] leading-tight font-bold">
                                    {idx + 1}. {q.text}
                                </p>

                                {!isCorrect && (
                                    <div className="mt-3 space-y-2">
                                        <div className="border-destructive/10 rounded-[8px] border bg-white/60 p-2">
                                            <p className="text-destructive mb-1 text-[11px] font-bold tracking-wider uppercase">
                                                Respuesta del alumno
                                            </p>
                                            <p className="text-ink-dim text-[13px]">
                                                {selectedOptions.length > 0
                                                    ? selectedOptions.map((o) => o.text).join(', ')
                                                    : 'Sin respuesta'}
                                            </p>
                                        </div>
                                        <div className="bg-success/10 border-success/10 rounded-[8px] border p-2">
                                            <p className="text-success mb-1 text-[11px] font-bold tracking-wider uppercase">
                                                Respuesta correcta
                                            </p>
                                            <p className="text-ink text-[13px]">
                                                {correctOptions.map((o) => o.text).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
