'use client';

import { useState, useTransition } from 'react';
import {
    createLmsGradebookItem,
    deleteLmsGradebookItem,
    recordLmsGrade,
} from '@/features/lms/actions/gradebook';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { BarChart2, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/utils';

type ItemType = 'TAREA' | 'EXAMEN' | 'PARTICIPACION' | 'MANUAL';

interface GradebookItem {
    id: string;
    title: string;
    type: string;
    weight: number;
    assignmentId: string | null;
    examId: string | null;
}

interface StudentRow {
    studentId: string;
    studentName: string;
    studentRut: string | null;
    scores: { gradebookItemId: string; score: number | null; feedback: string | null }[];
    average: number | null;
    passed: boolean | null;
}

interface Props {
    slug: string;
    courseId: string;
    items: GradebookItem[];
    rows: StudentRow[];
}

const ITEM_TYPE_LABEL: Record<string, string> = {
    TAREA: 'Tarea',
    EXAMEN: 'Examen',
    PARTICIPACION: 'Participación',
    MANUAL: 'Manual',
};

const EDITABLE_TYPES = new Set<string>(['PARTICIPACION', 'MANUAL']);

function GradeCell({
    slug,
    itemId,
    itemType,
    studentId,
    score,
    feedback,
}: {
    slug: string;
    itemId: string;
    itemType: string;
    studentId: string;
    score: number | null;
    feedback: string | null;
}) {
    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(score?.toFixed(1) ?? '');
    const [fbText, setFbText] = useState(feedback ?? '');
    const [isPending, startTransition] = useTransition();
    const isEditable = EDITABLE_TYPES.has(itemType);

    const handleSave = () => {
        const parsed = Number.parseFloat(value);
        if (Number.isNaN(parsed) || parsed < 1 || parsed > 7) {
            toast.error('La nota debe estar entre 1.0 y 7.0');
            return;
        }
        startTransition(async () => {
            const result = await recordLmsGrade(slug, {
                gradebookItemId: itemId,
                studentId,
                score: parsed,
                feedback: fbText.trim() || null,
            });
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Nota guardada');
            setEditing(false);
            router.refresh();
        });
    };

    if (!isEditable) {
        return (
            <td className="border-border border-r px-3 py-3 text-center">
                {score !== null ? (
                    <span
                        className={cn(
                            'font-mono text-sm font-bold',
                            score >= 4 ? 'text-primary' : 'text-destructive',
                        )}
                    >
                        {score.toFixed(1)}
                    </span>
                ) : (
                    <span className="text-mute text-sm">—</span>
                )}
            </td>
        );
    }

    if (editing) {
        return (
            <td className="border-border border-r px-2 py-2 text-center">
                <div className="flex items-center gap-1">
                    <Input
                        type="number"
                        min={1}
                        max={7}
                        step={0.5}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="h-7 w-16 rounded-[6px] px-1 text-center font-mono text-xs"
                        disabled={isPending}
                        autoFocus
                    />
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleSave}
                        disabled={isPending || !value}
                        className="h-7 w-7"
                    >
                        {isPending ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <CheckCircle2 size={12} />
                        )}
                    </Button>
                </div>
            </td>
        );
    }

    return (
        <td
            className="border-border cursor-pointer border-r px-3 py-3 text-center"
            onClick={() => setEditing(true)}
            title="Click para editar"
        >
            {score !== null ? (
                <span
                    className={cn(
                        'font-mono text-sm font-bold underline decoration-dashed',
                        score >= 4 ? 'text-primary' : 'text-destructive',
                    )}
                >
                    {score.toFixed(1)}
                </span>
            ) : (
                <span className="text-mute hover:text-ink text-sm">—</span>
            )}
        </td>
    );
}

function AddItemDialog({
    slug,
    courseId,
    open,
    onClose,
}: {
    slug: string;
    courseId: string;
    open: boolean;
    onClose: () => void;
}) {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [type, setType] = useState<string>('PARTICIPACION');
    const [weight, setWeight] = useState('1');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleCreate = () => {
        if (!title.trim()) {
            setError('El título es requerido');
            return;
        }
        const w = Number.parseFloat(weight);
        if (Number.isNaN(w) || w < 0 || w > 1) {
            setError('El peso debe estar entre 0 y 1 (ej: 0.2 = 20%)');
            return;
        }
        if (type === 'TAREA' || type === 'EXAMEN') {
            setError('Los ítems de tipo Tarea y Examen se crean automáticamente');
            return;
        }
        startTransition(async () => {
            const result = await createLmsGradebookItem(slug, {
                courseId,
                title: title.trim(),
                type: type as ItemType,
                weight: w,
            });
            if (result.error) {
                setError(result.error);
                return;
            }
            toast.success('Ítem agregado al gradebook');
            onClose();
            router.refresh();
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="border-border rounded-[22px] shadow-2xl sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display text-2xl">Nuevo ítem</DialogTitle>
                    <DialogDescription className="sr-only">
                        Agregar ítem al libro de calificaciones
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-2">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="gb-item-title" className="text-ink text-[13px] font-bold">
                            Título
                        </label>
                        <Input
                            id="gb-item-title"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                setError(null);
                            }}
                            placeholder="Ej: Participación clase 1"
                            className="border-border h-11 rounded-[10px]"
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-ink text-[13px] font-bold">Tipo</span>
                        <SearchableSelect
                            value={type}
                            onChange={setType}
                            options={[
                                { value: 'PARTICIPACION', label: 'Participación' },
                                { value: 'MANUAL', label: 'Manual' },
                            ]}
                            placeholder="Tipo de ítem"
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="gb-item-weight" className="text-ink text-[13px] font-bold">
                            Peso (0–1, ej: 0.2 = 20%)
                        </label>
                        <Input
                            id="gb-item-weight"
                            type="number"
                            min={0}
                            max={1}
                            step={0.05}
                            value={weight}
                            onChange={(e) => {
                                setWeight(e.target.value);
                                setError(null);
                            }}
                            className="border-border h-11 rounded-[10px]"
                            disabled={isPending}
                        />
                    </div>
                    {error && <p className="text-destructive text-sm">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isPending}>
                        Cancelar
                    </Button>
                    <Button
                        variant="ink"
                        onClick={handleCreate}
                        disabled={isPending || !title.trim()}
                    >
                        {isPending && <Loader2 size={14} className="mr-1 animate-spin" />}
                        Agregar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function LmsGradebookClient({ slug, courseId, items, rows }: Props) {
    const router = useRouter();
    const [addOpen, setAddOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleDelete = (itemId: string) => {
        startTransition(async () => {
            const result = await deleteLmsGradebookItem(slug, itemId);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Ítem eliminado');
            setDeletingId(null);
            router.refresh();
        });
    };

    if (rows.length === 0) {
        return (
            <Card className="border-border flex flex-col items-center justify-center border-dashed py-24">
                <BarChart2 size={40} className="text-mute/30 mb-4" />
                <p className="text-ink text-lg font-medium">Sin estudiantes inscriptos</p>
                <p className="text-mute mt-1 text-sm">
                    El gradebook aparecerá cuando haya alumnos activos en el curso.
                </p>
            </Card>
        );
    }

    const totalWeight = items.reduce((sum, it) => sum + it.weight, 0);

    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-mute text-sm">
                        {items.length} ítem{items.length !== 1 ? 's' : ''} · peso total:{' '}
                        <span
                            className={cn(
                                'font-mono font-bold',
                                totalWeight > 1.001 ? 'text-destructive' : 'text-ink',
                            )}
                        >
                            {(totalWeight * 100).toFixed(0)}%
                        </span>
                    </span>
                    {totalWeight > 1.001 && (
                        <Badge variant="destructive" className="text-xs">
                            Suma de pesos supera 100%
                        </Badge>
                    )}
                </div>
                <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
                    <Plus size={14} className="mr-1" /> Agregar ítem
                </Button>
            </div>

            <Card className="border-border overflow-x-auto bg-white shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-paper border-border border-b">
                        <tr>
                            <th className="text-mute bg-paper sticky left-0 px-6 py-3 text-left font-mono text-[10px] tracking-widest uppercase">
                                Estudiante
                            </th>
                            {items.map((it) => (
                                <th
                                    key={it.id}
                                    className="border-border min-w-[110px] border-r px-3 py-3 text-center"
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-ink max-w-[100px] truncate text-[11px] font-semibold">
                                            {it.title}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Badge
                                                variant="outline"
                                                className="px-1.5 py-0 text-[9px]"
                                            >
                                                {ITEM_TYPE_LABEL[it.type] ?? it.type}
                                            </Badge>
                                            <span className="text-mute font-mono text-[9px]">
                                                {(it.weight * 100).toFixed(0)}%
                                            </span>
                                            {EDITABLE_TYPES.has(it.type) && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingId(it.id)}
                                                    className="text-mute/50 hover:text-destructive ml-0.5 transition-colors"
                                                    aria-label="Eliminar ítem"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </th>
                            ))}
                            <th className="text-mute min-w-[90px] px-3 py-3 text-center font-mono text-[10px] tracking-widest uppercase">
                                Promedio
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                        {rows.map((row) => (
                            <tr key={row.studentId} className="hover:bg-paper/50 transition-colors">
                                <td className="border-border sticky left-0 border-r bg-white px-6 py-3">
                                    <p className="text-ink text-sm font-semibold">
                                        {row.studentName}
                                    </p>
                                    {row.studentRut && (
                                        <p className="text-mute font-mono text-[11px]">
                                            {row.studentRut}
                                        </p>
                                    )}
                                </td>
                                {items.map((it) => {
                                    const cell = row.scores.find(
                                        (s) => s.gradebookItemId === it.id,
                                    );
                                    return (
                                        <GradeCell
                                            key={it.id}
                                            slug={slug}
                                            itemId={it.id}
                                            itemType={it.type}
                                            studentId={row.studentId}
                                            score={cell?.score ?? null}
                                            feedback={cell?.feedback ?? null}
                                        />
                                    );
                                })}
                                <td className="px-3 py-3 text-center">
                                    {row.average !== null ? (
                                        <div className="flex flex-col items-center">
                                            <span
                                                className={cn(
                                                    'font-mono text-base font-bold',
                                                    row.average >= 4
                                                        ? 'text-primary'
                                                        : 'text-destructive',
                                                )}
                                            >
                                                {row.average.toFixed(1)}
                                            </span>
                                            {row.passed !== null && (
                                                <Badge
                                                    variant={row.passed ? 'default' : 'destructive'}
                                                    className="mt-0.5 px-1.5 py-0 text-[9px]"
                                                >
                                                    {row.passed ? 'Aprueba' : 'Reprueba'}
                                                </Badge>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-mute text-sm">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <AddItemDialog
                slug={slug}
                courseId={courseId}
                open={addOpen}
                onClose={() => setAddOpen(false)}
            />

            {deletingId && (
                <Dialog open onOpenChange={(v) => !v && setDeletingId(null)}>
                    <DialogContent className="border-border rounded-[22px]">
                        <DialogHeader>
                            <DialogTitle className="text-destructive">Eliminar ítem</DialogTitle>
                            <DialogDescription>
                                Esta acción eliminará el ítem y todas las notas asociadas.
                                ¿Continuar?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="ghost"
                                onClick={() => setDeletingId(null)}
                                disabled={isPending}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={() => handleDelete(deletingId)}
                                disabled={isPending}
                                className="bg-destructive hover:bg-destructive/90 text-white"
                            >
                                {isPending && <Loader2 size={14} className="mr-1 animate-spin" />}
                                Eliminar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
