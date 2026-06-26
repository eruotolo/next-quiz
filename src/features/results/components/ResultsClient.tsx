'use client';

import type { CSSProperties } from 'react';
import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteResult, recalculateResult } from '@/features/results/actions/mutations';
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
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
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
import { calcGrade } from '@/shared/lib/grade';
import { formatRut } from '@/shared/lib/rut';
import { cn } from '@/shared/lib/utils';
import {
    BarChart3,
    CheckCircle,
    Download,
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
    courseSection: { id: string; name: string } | null;
    program: { id: string; name: string } | null;
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

async function exportResultsToXlsx(examGroups: ExamGroup[], institutionName: string): Promise<void> {
    const { utils, writeFile } = await import('xlsx');
    const wb = utils.book_new();
    for (const eg of examGroups) {
        const rows = eg.results.map((r) => {
            const grade = calcGrade(r.score, r.maxScore, eg.maxGrade, eg.passingGrade, eg.passingPercentage);
            return {
                Nombre: r.studentName,
                RUT: r.studentRut,
                Puntaje: r.score,
                'Máx. puntaje': r.maxScore,
                'Porcentaje (%)': r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0,
                Nota: grade.toFixed(1),
                Estado: grade >= eg.passingGrade ? 'Aprobado' : 'Reprobado',
                'Fecha entrega': new Date(r.completedAt).toLocaleDateString('es-CL', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                }),
            };
        });
        const ws = utils.json_to_sheet(rows);
        const sheetName = `${eg.title.slice(0, 20)} - ${eg.groupName.slice(0, 10)}`.replace(/[:/\\?*[\]]/g, '');
        utils.book_append_sheet(wb, ws, sheetName);
    }
    const date = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
    writeFile(wb, `resultados-${institutionName}-${date}.xlsx`);
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: vista de resultados con KPIs, filtros, tablas y diálogos
export function ResultsClient({
    examGroups,
    totalCount,
    slug,
    institutionName,
    examOptions,
    groupOptions,
    selectedExamId,
    selectedGroupId,
}: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isExporting, setIsExporting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; studentName: string } | null>(
        null,
    );
    const [viewTarget, setViewTarget] = useState<{ result: ResultRow; exam: ExamGroup } | null>(
        null,
    );
    const [programFilter, setProgramFilter] = useState<string>('all');
    const [courseFilter, setCourseFilter] = useState<string>('all');

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
        setProgramFilter('all');
        setCourseFilter('all');
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

    // Filtros cliente por programa/asignatura (jerarquía académica, Fase 4). Se
    // derivan de los propios examGroups: solo aparecen opciones con resultados.
    const programOptions = useMemo(() => {
        const map = new Map<string, string>();
        for (const eg of examGroups) if (eg.program) map.set(eg.program.id, eg.program.name);
        return Array.from(map, ([id, name]) => ({ id, name }));
    }, [examGroups]);

    const courseOptions = useMemo(() => {
        const map = new Map<string, string>();
        for (const eg of examGroups)
            if (eg.courseSection) map.set(eg.courseSection.id, eg.courseSection.name);
        return Array.from(map, ([id, name]) => ({ id, name }));
    }, [examGroups]);

    const visibleExamGroups = useMemo(
        () =>
            examGroups.filter((eg) => {
                const matchesProgram = programFilter === 'all' || eg.program?.id === programFilter;
                const matchesCourse = courseFilter === 'all' || eg.courseSection?.id === courseFilter;
                return matchesProgram && matchesCourse;
            }),
        [examGroups, programFilter, courseFilter],
    );

    const hasClientFilters = programFilter !== 'all' || courseFilter !== 'all';

    return (
        <>
            <main className="flex-1 space-y-8 overflow-auto p-8">
                {/* Export action */}
                {totalCount > 0 && (
                    <div className="flex justify-end">
                        <Button
                            variant="ghost"
                            size="md"
                            className="gap-2"
                            disabled={isExporting}
                            onClick={async () => {
                                setIsExporting(true);
                                try {
                                    await exportResultsToXlsx(visibleExamGroups, institutionName);
                                } catch {
                                    toast.error('No se pudo exportar el reporte.');
                                } finally {
                                    setIsExporting(false);
                                }
                            }}
                        >
                            {isExporting ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                            Exportar XLSX
                        </Button>
                    </div>
                )}

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
                                    className="border-border bg-paper-warm flex size-8 items-center justify-center rounded-[8px] border [color:var(--tile-c)]"
                                    style={{ '--tile-c': tile.color } as CSSProperties}
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

                        {groupOptions.length > 0 && (
                            <div title={!selectedExamId ? 'Selecciona un examen primero' : undefined}>
                                <Select
                                    value={selectedGroupId ?? ''}
                                    onValueChange={handleGroupChange}
                                    disabled={!selectedExamId}
                                >
                                    <SelectTrigger className="border-border h-9 w-[180px] rounded-[10px] bg-white text-[13px] font-medium shadow-sm disabled:opacity-50">
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
                            </div>
                        )}

                        {programOptions.length > 0 && (
                            <Select value={programFilter} onValueChange={setProgramFilter}>
                                <SelectTrigger className="border-border h-9 w-[180px] rounded-[10px] bg-white text-[13px] font-medium shadow-sm">
                                    <SelectValue placeholder="Todos los programas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los programas</SelectItem>
                                    {programOptions.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {courseOptions.length > 0 && (
                            <Select value={courseFilter} onValueChange={setCourseFilter}>
                                <SelectTrigger className="border-border h-9 w-[180px] rounded-[10px] bg-white text-[13px] font-medium shadow-sm">
                                    <SelectValue placeholder="Todas las asignaturas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las asignaturas</SelectItem>
                                    {courseOptions.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {(hasActiveFilters || hasClientFilters) && (
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
                ) : visibleExamGroups.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <BarChart3 size={48} className="text-mute/20 mb-4" />
                        <p className="text-ink text-lg font-medium">
                            No hay resultados para los filtros seleccionados
                        </p>
                        <p className="text-mute mt-1 text-sm">
                            Probá cambiando el programa o la asignatura.
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-10">
                        {visibleExamGroups.map((data) => (
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
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">
                            Eliminar registro
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de eliminar el resultado de{' '}
                            <strong className="text-ink">{deleteTarget?.studentName}</strong>? Esta
                            acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isPending}
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isPending && <Loader2 className="mr-2 animate-spin" size={14} />}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
        </>
    );
}

function AnswersReview({
    result,
    exam,
}: {
    result: ResultRow;
    exam: ExamGroup;
}) {
    const answerMap = result.answers;

    function getSelectedIds(val: string[] | string | undefined): string[] {
        if (!val) return [];
        return Array.isArray(val) ? val : [val];
    }

    const analysisMap = useMemo(() => {
        const map = new Map<string, { correctOptions: QuestionOption[]; correctSet: Set<string> }>();
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
                const analysis = analysisMap.get(q.id);
                if (!analysis) return null;
                const { correctOptions, correctSet } = analysis;
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
