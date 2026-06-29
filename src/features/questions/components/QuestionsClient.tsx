'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    createBankQuestion,
    updateBankQuestion,
    deleteBankQuestion,
    cloneBankQuestion,
} from '@/features/questions/actions/mutations';
import { getBankQuestions } from '@/features/questions/actions/queries';
import {
    bankQuestionSchema,
    type BankQuestionInput,
} from '@/features/questions/schemas/bank-question.schemas';
import type {
    SafeBankQuestion,
    BankQuestionFilters,
} from '@/features/questions/types/bank-question.types';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Tag } from '@/shared/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/shared/components/ui/dialog';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { cn } from '@/shared/lib/utils';
import {
    Copy,
    Library,
    Loader2,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';

interface Props {
    slug: string;
    institutionName: string;
    initialItems: SafeBankQuestion[];
    facets: BankQuestionFilters;
}

interface OptionDraft {
    id?: string;
    text: string;
    isCorrect: boolean;
    _key: string;
}

interface QuestionDraft {
    id?: string;
    text: string;
    questionType: 'UNICA' | 'MULTIPLE';
    subject: string;
    unit: string;
    difficulty: 'FACIL' | 'MEDIA' | 'DIFICIL';
    tags: string;
    feedback: string;
    options: OptionDraft[];
}

let optKeySeq = 0;
function nextOptKey(): string {
    optKeySeq += 1;
    return `opt-${optKeySeq}`;
}

const EMPTY_DRAFT: QuestionDraft = {
    text: '',
    questionType: 'UNICA',
    subject: '',
    unit: '',
    difficulty: 'MEDIA',
    tags: '',
    feedback: '',
    options: [
        { text: '', isCorrect: true, _key: nextOptKey() },
        { text: '', isCorrect: false, _key: nextOptKey() },
    ],
};

const DIFFICULTY_LABEL: Record<'FACIL' | 'MEDIA' | 'DIFICIL', string> = {
    FACIL: 'Fácil',
    MEDIA: 'Media',
    DIFICIL: 'Difícil',
};

const DIFFICULTY_TONE: Record<'FACIL' | 'MEDIA' | 'DIFICIL', 'success' | 'warning' | 'danger'> = {
    FACIL: 'success',
    MEDIA: 'warning',
    DIFICIL: 'danger',
};

function toDraft(q: SafeBankQuestion): QuestionDraft {
    return {
        id: q.id,
        text: q.text,
        questionType: q.questionType,
        subject: q.subject ?? '',
        unit: q.unit ?? '',
        difficulty: q.difficulty,
        tags: q.tags.join(', '),
        feedback: q.feedback ?? '',
        options: q.options.map((o) => ({
            id: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
            _key: nextOptKey(),
        })),
    };
}

function draftToInput(d: QuestionDraft): BankQuestionInput {
    return {
        id: d.id,
        text: d.text,
        questionType: d.questionType,
        subject: d.subject || undefined,
        unit: d.unit || undefined,
        difficulty: d.difficulty,
        tags: d.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        feedback: d.feedback || undefined,
        options: d.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
    };
}

export function QuestionsClient({ slug, institutionName, initialItems, facets }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [items, setItems] = useState<SafeBankQuestion[]>(initialItems);

    useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    const [search, setSearch] = useState('');
    const [subject, setSubject] = useState<string>('');
    const [unit, setUnit] = useState<string>('');
    const [difficulty, setDifficulty] = useState<string>('');
    const [tag, setTag] = useState<string>('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [draft, setDraft] = useState<QuestionDraft>(EMPTY_DRAFT);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [deleteTarget, setDeleteTarget] = useState<SafeBankQuestion | null>(null);

    function applyFilters(
        overrides?: Partial<{
            search: string;
            subject: string;
            unit: string;
            difficulty: string;
            tag: string;
        }>,
    ): void {
        const s = overrides?.search ?? search;
        const sub = overrides?.subject ?? subject;
        const u = overrides?.unit ?? unit;
        const d = overrides?.difficulty ?? difficulty;
        const tg = overrides?.tag ?? tag;
        startTransition(async () => {
            const res = await getBankQuestions(slug, {
                search: s || undefined,
                subject: sub || undefined,
                unit: u || undefined,
                difficulty: (d as 'FACIL' | 'MEDIA' | 'DIFICIL' | '') || undefined,
                tag: tg || undefined,
            });
            setItems(res.items);
        });
    }

    function openCreate(): void {
        setDraft(EMPTY_DRAFT);
        setErrors({});
        setDialogOpen(true);
    }

    function openEdit(q: SafeBankQuestion): void {
        setDraft(toDraft(q));
        setErrors({});
        setDialogOpen(true);
    }

    function addOption(): void {
        setDraft((d) => ({
            ...d,
            options: [...d.options, { text: '', isCorrect: false, _key: nextOptKey() }],
        }));
    }

    function removeOption(idx: number): void {
        setDraft((d) => ({
            ...d,
            options: d.options.filter((_, i) => i !== idx),
        }));
    }

    function setOptionText(idx: number, text: string): void {
        setDraft((d) => ({
            ...d,
            options: d.options.map((o, i) => (i === idx ? { ...o, text } : o)),
        }));
    }

    function setOptionCorrect(idx: number, isCorrect: boolean): void {
        setDraft((d) => {
            if (d.questionType === 'UNICA' && isCorrect) {
                return {
                    ...d,
                    options: d.options.map((o, i) => ({ ...o, isCorrect: i === idx })),
                };
            }
            return {
                ...d,
                options: d.options.map((o, i) => (i === idx ? { ...o, isCorrect } : o)),
            };
        });
    }

    function handleSubmit(): void {
        const input = draftToInput(draft);
        const result = bankQuestionSchema.safeParse(input);
        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            for (const issue of result.error.issues) {
                const path = issue.path.join('.');
                if (!fieldErrors[path]) fieldErrors[path] = issue.message;
            }
            setErrors(fieldErrors);
            return;
        }

        startTransition(async () => {
            try {
                if (draft.id) {
                    await updateBankQuestion(slug, draft.id, input);
                    toast.success('Pregunta actualizada');
                } else {
                    await createBankQuestion(slug, input);
                    toast.success('Pregunta creada');
                }
                setDialogOpen(false);
                router.refresh();
            } catch (err) {
                toast.error('Error al guardar', {
                    description: err instanceof Error ? err.message : 'Intenta de nuevo.',
                });
            }
        });
    }

    function handleDelete(): void {
        if (!deleteTarget) return;
        const id = deleteTarget.id;
        startTransition(async () => {
            try {
                await deleteBankQuestion(slug, id);
                toast.success('Pregunta eliminada');
                setDeleteTarget(null);
                router.refresh();
            } catch (err) {
                toast.error('Error al eliminar', {
                    description: err instanceof Error ? err.message : 'Intenta de nuevo.',
                });
            }
        });
    }

    function handleClone(q: SafeBankQuestion): void {
        startTransition(async () => {
            try {
                await cloneBankQuestion(slug, q.id);
                toast.success('Pregunta duplicada');
                router.refresh();
            } catch (err) {
                toast.error('Error al duplicar', {
                    description: err instanceof Error ? err.message : 'Intenta de nuevo.',
                });
            }
        });
    }

    const hasActiveFilters = !!(search || subject || unit || difficulty || tag);

    function clearFilters(): void {
        setSearch('');
        setSubject('');
        setUnit('');
        setDifficulty('');
        setTag('');
        setItems(initialItems);
    }

    return (
        <>
            {/* Filter bar */}
            <div data-tour="questions-filters" className="border-border border-b bg-white px-8 py-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[220px] flex-1">
                        <Search className="text-mute absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') applyFilters();
                            }}
                            placeholder="Buscar por texto o asignatura…"
                            className="border-border h-[38px] bg-white pl-9"
                        />
                    </div>

                    {facets.subjects.length > 0 && (
                        <Select
                            value={subject}
                            onValueChange={(v) => {
                                setSubject(v);
                                applyFilters({ subject: v });
                            }}
                        >
                            <SelectTrigger className="border-border h-[38px] w-[160px] rounded-[10px] bg-white text-[13px] font-medium shadow-sm">
                                <SelectValue placeholder="Asignatura" />
                            </SelectTrigger>
                            <SelectContent>
                                {facets.subjects.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {facets.units.length > 0 && (
                        <Select
                            value={unit}
                            onValueChange={(v) => {
                                setUnit(v);
                                applyFilters({ unit: v });
                            }}
                        >
                            <SelectTrigger className="border-border h-[38px] w-[140px] rounded-[10px] bg-white text-[13px] font-medium shadow-sm">
                                <SelectValue placeholder="Unidad" />
                            </SelectTrigger>
                            <SelectContent>
                                {facets.units.map((u) => (
                                    <SelectItem key={u} value={u}>
                                        {u}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <Select
                        value={difficulty}
                        onValueChange={(v) => {
                            setDifficulty(v);
                            applyFilters({ difficulty: v });
                        }}
                    >
                        <SelectTrigger className="border-border h-[38px] w-[130px] rounded-[10px] bg-white text-[13px] font-medium shadow-sm">
                            <SelectValue placeholder="Dificultad" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="FACIL">Fácil</SelectItem>
                            <SelectItem value="MEDIA">Media</SelectItem>
                            <SelectItem value="DIFICIL">Difícil</SelectItem>
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="text-mute hover:text-ink inline-flex items-center gap-1 text-[12px] font-medium"
                        >
                            <X size={12} />
                            Limpiar
                        </button>
                    )}

                    <div className="flex-1" />
                    <span className="text-mute font-mono text-[11px] tracking-wider uppercase">
                        {items.length} preguntas
                    </span>
                    <Button variant="ink" size="md" onClick={openCreate} className="gap-2">
                        <Plus size={16} />
                        Nueva pregunta
                    </Button>
                </div>

                {facets.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-mute text-[11px] font-bold tracking-wider uppercase">
                            Tags:
                        </span>
                        {facets.tags.map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => {
                                    const nextTag = tag === t ? '' : t;
                                    setTag(nextTag);
                                    applyFilters({ tag: nextTag });
                                }}
                                className={cn(
                                    'rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                                    tag === t
                                        ? 'bg-primary text-white'
                                        : 'bg-paper-warm text-ink-dim hover:bg-paper',
                                )}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <main data-tour="questions-list" className="flex-1 overflow-auto p-8">
                {items.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <Library size={48} className="text-mute/20 mb-4" />
                        <p className="text-ink text-lg font-medium">
                            {hasActiveFilters
                                ? 'No hay preguntas que coincidan con los filtros.'
                                : 'El banco está vacío'}
                        </p>
                        <p className="text-mute mt-1 text-sm">
                            {hasActiveFilters
                                ? 'Probá con otros criterios o limpiá los filtros.'
                                : 'Crea tu primera pregunta reutilizable para compartirla entre exámenes.'}
                        </p>
                        {!hasActiveFilters && (
                            <Button
                                variant="primary"
                                size="md"
                                onClick={openCreate}
                                className="mt-6 gap-2"
                            >
                                <Plus size={16} />
                                Nueva pregunta
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {items.map((q) => (
                            <Card
                                key={q.id}
                                className="border-border flex flex-col bg-white p-5 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-ink line-clamp-3 flex-1 text-[14px] font-medium">
                                        {q.text}
                                    </p>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                className="h-9 w-9 shrink-0"
                                            >
                                                <MoreHorizontal size={18} className="text-mute" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="border-border w-44 rounded-xl shadow-xl"
                                        >
                                            <DropdownMenuItem
                                                onClick={() => openEdit(q)}
                                                className="cursor-pointer gap-2 py-2.5"
                                            >
                                                <Pencil size={14} /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleClone(q)}
                                                disabled={isPending}
                                                className="cursor-pointer gap-2 py-2.5"
                                            >
                                                <Copy size={14} /> Duplicar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setDeleteTarget(q)}
                                                className="text-destructive focus:bg-danger-wash focus:text-destructive cursor-pointer gap-2 py-2.5"
                                            >
                                                <Trash2 size={14} /> Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                    <Tag tone="outline" className="h-5 text-[10px] font-bold">
                                        {q.questionType === 'UNICA' ? 'Única' : 'Múltiple'}
                                    </Tag>
                                    <Tag
                                        tone={DIFFICULTY_TONE[q.difficulty]}
                                        className="h-5 text-[10px] font-bold"
                                    >
                                        {DIFFICULTY_LABEL[q.difficulty]}
                                    </Tag>
                                    {q.subject && (
                                        <Tag tone="default" className="h-5 text-[10px] font-bold">
                                            {q.subject}
                                        </Tag>
                                    )}
                                    {q.unit && (
                                        <Tag
                                            tone="outline"
                                            className="bg-paper-warm/50 border-border h-5 font-mono text-[10px]"
                                        >
                                            {q.unit}
                                        </Tag>
                                    )}
                                    {q.tags.map((t) => (
                                        <span
                                            key={t}
                                            className="bg-paper-warm text-ink-dim rounded-full px-2 py-0.5 font-mono text-[10px] font-medium"
                                        >
                                            #{t}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-mute mt-3 font-mono text-[11px]">
                                    {q.options.length} opciones ·{' '}
                                    {q.options.filter((o) => o.isCorrect).length} correcta
                                    {q.options.filter((o) => o.isCorrect).length !== 1 ? 's' : ''}
                                </p>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="border-border max-h-[90vh] max-w-[640px] overflow-hidden rounded-[22px] p-0 shadow-2xl">
                    <div className="border-border bg-paper border-b px-6 py-5">
                        <DialogTitle className="font-display text-ink text-2xl">
                            {draft.id ? 'Editar pregunta' : 'Nueva pregunta'}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Guardá la pregunta en el banco para reutilizarla en cualquier examen.
                        </DialogDescription>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="q-text" className="text-ink text-[13px] font-bold">
                                Pregunta
                            </label>
                            <Textarea
                                id="q-text"
                                value={draft.text}
                                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                                placeholder="Escribe la pregunta…"
                                rows={3}
                                className="border-border rounded-[10px] bg-white"
                                autoFocus
                            />
                            {errors.text && (
                                <p className="text-destructive text-[12px] font-medium">
                                    {errors.text}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-ink text-[13px] font-bold">Tipo</Label>
                                <Select
                                    value={draft.questionType}
                                    onValueChange={(v) =>
                                        setDraft({
                                            ...draft,
                                            questionType: v as 'UNICA' | 'MULTIPLE',
                                        })
                                    }
                                >
                                    <SelectTrigger className="border-border h-11 rounded-[10px] bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-border rounded-xl shadow-xl">
                                        <SelectItem value="UNICA">Única respuesta</SelectItem>
                                        <SelectItem value="MULTIPLE">Múltiple respuesta</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-ink text-[13px] font-bold">Dificultad</Label>
                                <Select
                                    value={draft.difficulty}
                                    onValueChange={(v) =>
                                        setDraft({
                                            ...draft,
                                            difficulty: v as 'FACIL' | 'MEDIA' | 'DIFICIL',
                                        })
                                    }
                                >
                                    <SelectTrigger className="border-border h-11 rounded-[10px] bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-border rounded-xl shadow-xl">
                                        <SelectItem value="FACIL">Fácil</SelectItem>
                                        <SelectItem value="MEDIA">Media</SelectItem>
                                        <SelectItem value="DIFICIL">Difícil</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="q-subject"
                                    className="text-ink text-[13px] font-bold"
                                >
                                    Asignatura
                                </label>
                                <Input
                                    id="q-subject"
                                    value={draft.subject}
                                    onChange={(e) =>
                                        setDraft({ ...draft, subject: e.target.value })
                                    }
                                    placeholder="Ej: Historia"
                                    className="border-border h-11 rounded-[10px] bg-white"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="q-unit" className="text-ink text-[13px] font-bold">
                                    Unidad
                                </label>
                                <Input
                                    id="q-unit"
                                    value={draft.unit}
                                    onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                                    placeholder="Ej: Unidad 4"
                                    className="border-border h-11 rounded-[10px] bg-white"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="q-tags" className="text-ink text-[13px] font-bold">
                                Tags{' '}
                                <span className="text-mute font-normal">(separados por coma)</span>
                            </label>
                            <Input
                                id="q-tags"
                                value={draft.tags}
                                onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                                placeholder="Ej: colonia, siglo XIX"
                                className="border-border h-11 rounded-[10px] bg-white"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-ink text-[13px] font-bold">Opciones</span>
                            <p className="text-mute text-[11px]">
                                {draft.questionType === 'UNICA'
                                    ? 'Marcá 1 opción como correcta.'
                                    : 'Marcá al menos 2 opciones como correctas.'}
                            </p>
                            <div className="mt-1 space-y-2">
                                {draft.options.map((o, i) => (
                                    <div key={o._key} className="flex items-center gap-2">
                                        <Checkbox
                                            checked={o.isCorrect}
                                            onCheckedChange={(v) => setOptionCorrect(i, v === true)}
                                            aria-label={`Opción ${i + 1} correcta`}
                                        />
                                        <Input
                                            value={o.text}
                                            onChange={(e) => setOptionText(i, e.target.value)}
                                            placeholder={`Opción ${i + 1}`}
                                            className="border-border h-10 flex-1 rounded-[10px] bg-white"
                                        />
                                        {draft.options.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeOption(i)}
                                                className="text-mute hover:text-destructive rounded-md p-1.5"
                                                aria-label={`Quitar opción ${i + 1}`}
                                            >
                                                <X size={15} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {errors.options && (
                                <p className="text-destructive mt-1 text-[12px] font-medium">
                                    {errors.options}
                                </p>
                            )}
                            {draft.options.length < 6 && (
                                <Button
                                    variant="ghost"
                                    onClick={addOption}
                                    className="mt-1 gap-1.5"
                                    size="sm"
                                >
                                    <Plus size={14} />
                                    Añadir opción
                                </Button>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="q-feedback" className="text-ink text-[13px] font-bold">
                                Feedback <span className="text-mute font-normal">(opcional)</span>
                            </label>
                            <Textarea
                                id="q-feedback"
                                value={draft.feedback}
                                onChange={(e) => setDraft({ ...draft, feedback: e.target.value })}
                                placeholder="Explicación que verá el alumno al corregir…"
                                rows={2}
                                className="border-border rounded-[10px] bg-white"
                            />
                        </div>
                    </div>

                    <div className="border-border flex justify-end gap-2 border-t bg-white px-6 py-4">
                        <Button
                            variant="ghost"
                            size="md"
                            onClick={() => setDialogOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="ink"
                            size="md"
                            onClick={handleSubmit}
                            disabled={isPending}
                            className="min-w-[140px]"
                        >
                            {isPending && <Loader2 className="mr-2 animate-spin" size={14} />}
                            {draft.id ? 'Guardar cambios' : 'Crear pregunta'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">
                            Eliminar pregunta
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de eliminar esta pregunta del banco? No se puede deshacer.
                            Las copias ya agregadas a exámenes se conservan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isPending && <Loader2 className="mr-2 animate-spin" size={14} />}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
