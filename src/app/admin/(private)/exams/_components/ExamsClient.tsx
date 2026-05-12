'use client';

import { createExam, deleteExam, toggleExamActive, updateExam } from '@/actions/exams';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { Exam, Group } from '@prisma/client';
import {
    BookOpen,
    Clock,
    Edit2,
    HelpCircle,
    Loader2,
    Plus,
    Settings,
    Trash2,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface ExamWithCount extends Exam {
    groups: Group[];
    _count: { questions: number };
}

interface FormState {
    title: string;
    timeLimit: string;
    groupIds: string[];
    active: boolean;
    maxGrade: string;
    passingGrade: string;
    passingPercentage: string;
}

const emptyForm: FormState = {
    title: '',
    timeLimit: '30',
    groupIds: [],
    active: false,
    maxGrade: '7',
    passingGrade: '4',
    passingPercentage: '60',
};

export function ExamsClient({ exams, groups }: { exams: ExamWithCount[]; groups: Group[] }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isDelOpen, setIsDelOpen] = useState(false);
    const [editing, setEditing] = useState<ExamWithCount | null>(null);
    const [toDelete, setToDelete] = useState<ExamWithCount | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'general', string>>>({});
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const setField = <K extends keyof FormState>(field: K, value: FormState[K]): void => {
        setForm((f) => ({ ...f, [field]: value }));
        setErrors((e) => ({ ...e, [field]: undefined }));
    };

    const toggleGroup = (id: string): void => {
        setForm((f) => ({
            ...f,
            groupIds: f.groupIds.includes(id)
                ? f.groupIds.filter((g) => g !== id)
                : [...f.groupIds, id],
        }));
        setErrors((e) => ({ ...e, groupIds: undefined }));
    };

    const openCreate = (): void => {
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
        setIsOpen(true);
    };

    const openEdit = (exam: ExamWithCount): void => {
        setEditing(exam);
        setForm({
            title: exam.title,
            timeLimit: String(exam.timeLimit),
            groupIds: exam.groups.map((g) => g.id),
            active: exam.active,
            maxGrade: String(exam.maxGrade),
            passingGrade: String(exam.passingGrade),
            passingPercentage: String(exam.passingPercentage),
        });
        setErrors({});
        setIsOpen(true);
    };

    const openDelete = (exam: ExamWithCount): void => {
        setToDelete(exam);
        setDeleteError(null);
        setIsDelOpen(true);
    };

    const validate = (): boolean => {
        const next: Partial<Record<keyof FormState, string>> = {};
        if (!form.title.trim()) next.title = 'Título requerido';
        const tl = Number(form.timeLimit);
        if (!form.timeLimit || Number.isNaN(tl) || tl < 1 || tl > 180)
            next.timeLimit = 'Entre 1 y 180 minutos';
        if (form.groupIds.length === 0) next.groupIds = 'Seleccioná al menos un grupo';
        const mg = Number(form.maxGrade);
        const pg = Number(form.passingGrade);
        const pp = Number(form.passingPercentage);
        if (Number.isNaN(mg) || mg < 1 || mg > 10) next.maxGrade = 'Entre 1 y 10';
        if (Number.isNaN(pg) || pg < 1 || pg >= mg) next.passingGrade = `Entre 1 y ${form.maxGrade}`;
        if (Number.isNaN(pp) || pp < 1 || pp > 99) next.passingPercentage = 'Entre 1 y 99';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSave = (): void => {
        if (!validate()) return;
        startTransition(async () => {
            try {
                const data = {
                    ...form,
                    timeLimit: Number(form.timeLimit),
                    maxGrade: Number(form.maxGrade),
                    passingGrade: Number(form.passingGrade),
                    passingPercentage: Number(form.passingPercentage),
                };
                if (editing) await updateExam(editing.id, data);
                else await createExam(data);
                setIsOpen(false);
                router.refresh();
            } catch {
                setErrors({ general: 'Ocurrió un error. Intentá de nuevo.' });
            }
        });
    };

    const handleDelete = (): void => {
        if (!toDelete) return;
        startTransition(async () => {
            try {
                await deleteExam(toDelete.id);
                setIsDelOpen(false);
                router.refresh();
            } catch {
                setDeleteError('Ocurrió un error al eliminar. Intentá de nuevo.');
            }
        });
    };

    const handleToggle = (id: string, active: boolean): void => {
        startTransition(async () => {
            await toggleExamActive(id, active);
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Exámenes</h1>
                    <p className="text-sm text-muted-foreground">{exams.length} exámenes creados</p>
                </div>
                <Button className="rounded-full" onClick={openCreate}>
                    <Plus size={16} />
                    Nuevo examen
                </Button>
            </div>

            {exams.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-20">
                    <BookOpen size={40} className="mb-3 text-muted-foreground/40" />
                    <p className="font-medium text-muted-foreground">Todavía no hay exámenes</p>
                    <p className="mt-1 text-sm text-muted-foreground/70">
                        Creá el primero y luego añadile preguntas.
                    </p>
                    <Button className="mt-4 rounded-full" size="sm" onClick={openCreate}>
                        Crear examen
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {exams.map((exam) => (
                        <div
                            key={exam.id}
                            className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm"
                        >
                            <div className="mb-3 flex items-start justify-between gap-2">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                                    <BookOpen size={20} className="text-amber-600" />
                                </div>
                                <span
                                    className={cn(
                                        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                        exam.active
                                            ? 'bg-success/10 text-success'
                                            : 'bg-muted text-muted-foreground',
                                    )}
                                >
                                    {exam.active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>

                            <h3 className="leading-snug font-semibold text-foreground">
                                {exam.title}
                            </h3>

                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock size={13} />
                                    {exam.timeLimit} min
                                </span>
                                <span className="flex items-center gap-1">
                                    <HelpCircle size={13} />
                                    {exam._count.questions} pregunta
                                    {exam._count.questions !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1">
                                {exam.groups.map((g) => (
                                    <span
                                        key={g.id}
                                        className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                                    >
                                        <Users size={10} />
                                        {g.name}
                                    </span>
                                ))}
                            </div>

                            <p className="mt-1.5 text-xs text-muted-foreground">
                                Nota máx {exam.maxGrade} · Aprobación {exam.passingGrade} ({exam.passingPercentage}%)
                            </p>

                            <div className="mt-4 flex items-center gap-2">
                                <Switch
                                    checked={exam.active}
                                    onCheckedChange={(v) => handleToggle(exam.id, v)}
                                    disabled={isPending}
                                    className="data-[state=checked]:bg-success"
                                />
                                <span className="text-xs text-muted-foreground">
                                    {exam.active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button asChild size="sm" variant="outline" className="rounded-lg">
                                    <Link href={`/admin/exams/${exam.id}/edit`}>
                                        <Settings size={13} />
                                        Preguntas
                                    </Link>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-lg"
                                    onClick={() => openEdit(exam)}
                                >
                                    <Edit2 size={13} />
                                    Editar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => openDelete(exam)}
                                >
                                    <Trash2 size={13} />
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar examen' : 'Nuevo examen'}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 space-y-4 overflow-y-auto py-2">
                        {errors.general && (
                            <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                                {errors.general}
                            </p>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">
                                Título del examen
                            </label>
                            <Input
                                placeholder="Ej: Matemáticas — Unidad 3"
                                value={form.title}
                                onChange={(e) => setField('title', e.target.value)}
                                className={errors.title ? 'border-destructive' : ''}
                                autoFocus
                            />
                            {errors.title && (
                                <p className="text-xs text-destructive">{errors.title}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">
                                Tiempo límite (minutos)
                            </label>
                            <Input
                                type="number"
                                min={1}
                                max={180}
                                value={form.timeLimit}
                                onChange={(e) => setField('timeLimit', e.target.value)}
                                className={cn(
                                    'max-w-[140px]',
                                    errors.timeLimit ? 'border-destructive' : '',
                                )}
                            />
                            {errors.timeLimit && (
                                <p className="text-xs text-destructive">{errors.timeLimit}</p>
                            )}
                        </div>

                        {/* Groups multi-select */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Grupos</label>
                            <div
                                className={cn(
                                    'max-h-[160px] overflow-y-auto rounded-lg border',
                                    errors.groupIds ? 'border-destructive' : 'border-border',
                                )}
                            >
                                {groups.length === 0 ? (
                                    <p className="px-3 py-2.5 text-sm text-muted-foreground">
                                        No hay grupos creados
                                    </p>
                                ) : (
                                    groups.map((g) => (
                                        <label
                                            key={g.id}
                                            className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50 first:rounded-t-lg last:rounded-b-lg"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={form.groupIds.includes(g.id)}
                                                onChange={() => toggleGroup(g.id)}
                                                className="h-4 w-4 accent-primary"
                                            />
                                            <span className="text-sm text-foreground">{g.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                            {errors.groupIds && (
                                <p className="text-xs text-destructive">{errors.groupIds}</p>
                            )}
                        </div>

                        {/* Grade scale */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-foreground">
                                Escala de notas
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">
                                        Nota máxima
                                    </label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={10}
                                        step={0.1}
                                        value={form.maxGrade}
                                        onChange={(e) => setField('maxGrade', e.target.value)}
                                        className={cn(
                                            'text-center',
                                            errors.maxGrade ? 'border-destructive' : '',
                                        )}
                                    />
                                    {errors.maxGrade && (
                                        <p className="text-xs text-destructive">{errors.maxGrade}</p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">
                                        Nota aprobación
                                    </label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={10}
                                        step={0.1}
                                        value={form.passingGrade}
                                        onChange={(e) => setField('passingGrade', e.target.value)}
                                        className={cn(
                                            'text-center',
                                            errors.passingGrade ? 'border-destructive' : '',
                                        )}
                                    />
                                    {errors.passingGrade && (
                                        <p className="text-xs text-destructive">
                                            {errors.passingGrade}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">% mínimo</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={99}
                                        value={form.passingPercentage}
                                        onChange={(e) =>
                                            setField('passingPercentage', e.target.value)
                                        }
                                        className={cn(
                                            'text-center',
                                            errors.passingPercentage ? 'border-destructive' : '',
                                        )}
                                    />
                                    {errors.passingPercentage && (
                                        <p className="text-xs text-destructive">
                                            {errors.passingPercentage}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Con {form.passingPercentage}% de respuestas correctas se obtiene nota{' '}
                                {form.passingGrade} (máx {form.maxGrade}).
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Switch
                                id="exam-active"
                                checked={form.active}
                                onCheckedChange={(v) => setField('active', v)}
                                className="data-[state=checked]:bg-success"
                            />
                            <label htmlFor="exam-active" className="cursor-pointer text-sm">
                                {editing ? 'Examen activo' : 'Activar examen al crearlo'}
                            </label>
                        </div>

                        {!editing && (
                            <div className="rounded-[12px] bg-muted/50 px-4 py-3 text-[12.5px] text-muted-foreground">
                                Después de crearlo vas a poder agregarle preguntas desde el editor.
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setIsOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button className="rounded-full" disabled={isPending} onClick={handleSave}>
                            {isPending && <Loader2 className="animate-spin" />}
                            {editing ? 'Guardar cambios' : 'Crear examen'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete dialog */}
            <Dialog open={isDelOpen} onOpenChange={setIsDelOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Eliminar examen</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        ¿Estás seguro de eliminar{' '}
                        <strong className="text-foreground">
                            &ldquo;{toDelete?.title}&rdquo;
                        </strong>
                        ? Se eliminarán todas las preguntas y resultados asociados.
                    </p>
                    {deleteError && (
                        <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                            {deleteError}
                        </p>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setIsDelOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            className="rounded-full"
                            disabled={isPending}
                            onClick={handleDelete}
                        >
                            {isPending && <Loader2 className="animate-spin" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
