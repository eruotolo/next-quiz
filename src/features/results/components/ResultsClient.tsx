'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteResult } from '@/features/results/actions/mutations';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Tag } from '@/shared/components/ui/badge';
import { calcGrade } from '@/features/results/lib/grade';
import { formatRut } from '@/shared/lib/rut';
import { cn } from '@/shared/lib/utils';
import { BarChart3, CheckCircle, Eye, Loader2, Trash2, Users, XCircle, MoreHorizontal, Download } from 'lucide-react';
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

    // Compute summary stats
    const allResults = examGroups.flatMap((eg) =>
        eg.results.map((r) => ({
            grade: calcGrade(r.score, r.maxScore, eg.maxGrade, eg.passingGrade, eg.passingPercentage),
            passingGrade: eg.passingGrade,
        })),
    );
    const avgGrade =
        allResults.length > 0
            ? allResults.reduce((s, r) => s + r.grade, 0) / allResults.length
            : 0;
    const passingCount = allResults.filter((r) => r.grade >= r.passingGrade).length;
    const passingRate = allResults.length > 0 ? Math.round((passingCount / allResults.length) * 100) : 0;

    return (
        <div className="flex flex-col min-h-screen bg-paper">
            {/* Header */}
            <AdminTopBar
                breadcrumb={['Colegio Antártica', 'Resultados']}
                title="Historial de Resultados"
                subtitle={`${totalCount} evaluaciones completadas y procesadas`}
                actions={
                    <Button variant="ink" size="md" className="gap-2">
                        <Download size={16} />
                        Exportar Reporte
                    </Button>
                }
            />

            <main className="flex-1 p-8 space-y-8 overflow-auto">
                {/* Global Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[
                        { label: 'Total Entregas', value: String(totalCount), icon: Users, color: '#1F2EFF' },
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
                        <Card key={tile.label} className="p-6 bg-white border-border shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-8 rounded-[8px] flex items-center justify-center border border-border bg-paper-warm" style={{ color: tile.color }}>
                                    <tile.icon size={16} />
                                </div>
                                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-mute">{tile.label}</span>
                            </div>
                            <p className="font-display text-[32px] font-bold leading-none tracking-tight text-ink">
                                {tile.value}
                            </p>
                        </Card>
                    ))}
                </div>

                {totalCount === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <BarChart3 size={48} className="mb-4 text-mute/20" />
                        <p className="text-lg font-medium text-ink">Todavía no hay resultados</p>
                        <p className="mt-1 text-sm text-mute">Los resultados aparecerán aquí cuando los alumnos completen exámenes.</p>
                    </Card>
                ) : (
                    <div className="space-y-10">
                        {examGroups.map((data) => (
                            <div key={data.examId} className="space-y-4">
                                <div className="flex items-end justify-between px-2">
                                    <div>
                                        <h2 className="font-display text-[22px] font-bold text-ink tracking-tight">{data.title}</h2>
                                        <div className="mt-1 flex items-center gap-2 text-mute">
                                            <Tag tone="outline" className="bg-paper-warm/50 border-border font-mono text-[10px] h-5">{data.groupNames}</Tag>
                                            <span className="text-[12px] font-medium">· {data.results.length} alumnos evaluados</span>
                                        </div>
                                    </div>
                                    <div className="font-mono text-[10px] font-bold text-mute uppercase tracking-widest bg-white border border-border px-3 py-1 rounded-full">
                                        Escala: {data.passingGrade} ({data.passingPercentage}%)
                                    </div>
                                </div>

                                <Card className="p-0 overflow-visible border-border shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-paper">
                                            <TableRow className="hover:bg-transparent border-b border-border">
                                                <TableHead>Estudiante</TableHead>
                                                <TableHead className="w-[160px]">RUT</TableHead>
                                                <TableHead className="w-[140px] text-center">Puntaje</TableHead>
                                                <TableHead className="w-[120px] text-center">Nota</TableHead>
                                                <TableHead className="w-[180px] text-right">Fecha de Entrega</TableHead>
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
                                                    <TableRow key={r.id} className="group h-16 border-b border-border last:border-0">
                                                        <TableCell>
                                                            <span className="text-[13.5px] font-bold text-ink">{r.studentName}</span>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-[12px] text-mute">
                                                            {formatRut(r.studentRut)}
                                                        </TableCell>
                                                        <TableCell className="text-center font-mono text-[13px] font-bold text-ink-dim">
                                                            {r.score} / {r.maxScore}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Tag
                                                                tone={passing ? "success" : "danger"}
                                                                className="font-display font-bold text-[14px] h-7 px-3 rounded-full"
                                                            >
                                                                {grade.toFixed(1)}
                                                            </Tag>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-[11px] font-bold text-mute uppercase">
                                                            {new Date(r.completedAt).toLocaleDateString('es-CL', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon-sm" className="h-9 w-9">
                                                                        <MoreHorizontal size={18} className="text-mute" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="rounded-xl border-border shadow-xl w-44">
                                                                    <DropdownMenuItem onClick={() => setViewTarget({ result: r, exam: data })} className="gap-2 py-2.5 cursor-pointer">
                                                                        <Eye size={14} /> Revisar respuestas
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => setDeleteTarget({ id: r.id, studentName: r.studentName })} className="text-destructive gap-2 py-2.5 cursor-pointer focus:bg-danger-wash focus:text-destructive">
                                                                        <Trash2 size={14} /> Eliminar registro
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
                <DialogContent className="sm:max-w-sm rounded-[22px] border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl text-destructive">Eliminar registro</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-[14px] leading-relaxed text-ink-dim">
                            ¿Estás seguro de eliminar el resultado de <strong className="text-ink">{deleteTarget?.studentName}</strong>? Esta acción no se puede deshacer.
                        </p>
                    </div>
                    <DialogFooter className="gap-2 sm:justify-end mt-2">
                        <Button variant="ghost" size="md" onClick={() => setDeleteTarget(null)} disabled={isPending}>Cancelar</Button>
                        <Button variant="danger" size="md" onClick={handleDelete} disabled={isPending}>
                            {isPending && <Loader2 className="animate-spin mr-2" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Answers review */}
            <Dialog open={!!viewTarget} onOpenChange={(open) => !open && setViewTarget(null)}>
                <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg rounded-[22px] border-border shadow-2xl overflow-hidden p-0">
                    <div className="px-6 py-5 border-b border-border bg-paper">
                        <DialogTitle className="font-display text-xl text-ink">{viewTarget?.result.studentName}</DialogTitle>
                        <p className="text-[12px] font-bold text-mute uppercase tracking-widest mt-1">{viewTarget?.exam.title}</p>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        {viewTarget && (
                            <AnswersReview result={viewTarget.result} exam={viewTarget.exam} />
                        )}
                    </div>
                    <div className="px-6 py-4 border-t border-border flex justify-end bg-white">
                        <Button variant="ink" size="md" onClick={() => setViewTarget(null)}>Cerrar revisión</Button>
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

    return (
        <div className="h-full overflow-y-auto px-6 py-6 space-y-4">
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
                            'rounded-[14px] border p-4 transition-all',
                            isCorrect
                                ? 'border-success/20 bg-success/5'
                                : 'border-destructive/20 bg-danger-wash/50',
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div className={cn(
                                "size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                isCorrect ? "bg-success text-white" : "bg-destructive text-white"
                            )}>
                                {isCorrect ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            </div>
                            <div className="flex-1">
                                <p className="text-[14px] font-bold leading-tight text-ink">
                                    {idx + 1}. {q.text}
                                </p>
                                
                                {!isCorrect && (
                                    <div className="mt-3 space-y-2">
                                        <div className="rounded-[8px] bg-white/60 p-2 border border-destructive/10">
                                            <p className="text-[11px] font-bold text-destructive uppercase tracking-wider mb-1">Respuesta del alumno</p>
                                            <p className="text-[13px] text-ink-dim">
                                                {selectedOptions.length > 0
                                                    ? selectedOptions.map((o) => o.text).join(', ')
                                                    : 'Sin respuesta'}
                                            </p>
                                        </div>
                                        <div className="rounded-[8px] bg-success/10 p-2 border border-success/10">
                                            <p className="text-[11px] font-bold text-success uppercase tracking-wider mb-1">Respuesta correcta</p>
                                            <p className="text-[13px] text-ink">
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
