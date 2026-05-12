'use client';

import { deleteQuestion, upsertQuestion } from '@/actions/exams';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Exam, Group, Option, Question } from '@prisma/client';
import { ArrowLeft, BookOpen, Loader2, Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

type QuestionWithOptions = Question & { options: Option[] };
type ExamWithAll = Exam & { groups: Group[]; questions: QuestionWithOptions[] };

interface OptionDraft {
    _key: string;
    id?: string;
    text: string;
    isCorrect: boolean;
}

interface QuestionDraft {
    id?: string;
    text: string;
    points: number;
    options: OptionDraft[];
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
let keyCounter = 0;
const nextKey = (): string => `opt-${++keyCounter}`;

function defaultQuestionDraft(): QuestionDraft {
    return {
        text: '',
        points: 1,
        options: [
            { _key: nextKey(), text: '', isCorrect: true },
            { _key: nextKey(), text: '', isCorrect: false },
            { _key: nextKey(), text: '', isCorrect: false },
            { _key: nextKey(), text: '', isCorrect: false },
        ],
    };
}

export function ExamEditorClient({ exam }: { exam: ExamWithAll }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isDelOpen, setIsDelOpen] = useState(false);

    const [draft, setDraft] = useState<QuestionDraft | null>(null);
    const [draftOrder, setDraftOrder] = useState(0);
    const [toDeleteId, setToDeleteId] = useState<string | null>(null);
    const [qErrors, setQErrors] = useState<{
        text?: string;
        options?: string;
        general?: string;
    }>({});
    const [isPending, startTransition] = useTransition();

    const openNew = (): void => {
        setDraft(defaultQuestionDraft());
        setDraftOrder(exam.questions.length);
        setQErrors({});
        setIsOpen(true);
    };

    const openEdit = (q: QuestionWithOptions, order: number): void => {
        setDraft({
            id: q.id,
            text: q.text,
            points: q.points,
            options: q.options.map((o) => ({
                _key: o.id,
                id: o.id,
                text: o.text,
                isCorrect: o.isCorrect,
            })),
        });
        setDraftOrder(order);
        setQErrors({});
        setIsOpen(true);
    };

    const confirmDelete = (id: string): void => {
        setToDeleteId(id);
        setIsDelOpen(true);
    };

    const setDraftText = (text: string): void => {
        setDraft((d) => (d ? { ...d, text } : d));
        setQErrors((e) => ({ ...e, text: undefined }));
    };

    const setDraftPoints = (points: number): void => {
        setDraft((d) => (d ? { ...d, points } : d));
    };

    const setOptionText = (i: number, text: string): void => {
        setDraft((d) => {
            if (!d) return d;
            const options = d.options.map((o, idx) => (idx === i ? { ...o, text } : o));
            return { ...d, options };
        });
        setQErrors((e) => ({ ...e, options: undefined }));
    };

    const setCorrect = (i: number): void => {
        setDraft((d) => {
            if (!d) return d;
            return {
                ...d,
                options: d.options.map((o, idx) => ({ ...o, isCorrect: idx === i })),
            };
        });
    };

    const addOption = (): void => {
        setDraft((d) => {
            if (!d || d.options.length >= 6) return d;
            return {
                ...d,
                options: [...d.options, { _key: nextKey(), text: '', isCorrect: false }],
            };
        });
    };

    const removeOption = (i: number): void => {
        setDraft((d) => {
            if (!d || d.options.length <= 2) return d;
            const options = d.options.filter((_, idx) => idx !== i);
            if (!options.some((o) => o.isCorrect) && options[0]) {
                options[0] = { ...options[0], isCorrect: true };
            }
            return { ...d, options };
        });
    };

    const validate = (): boolean => {
        const errs: { text?: string; options?: string } = {};
        if (!draft?.text.trim()) errs.text = 'El texto de la pregunta es requerido.';
        if (draft?.options.some((o) => !o.text.trim()))
            errs.options = 'Todas las opciones deben tener texto.';
        if (!draft?.options.some((o) => o.isCorrect))
            errs.options = 'Debe marcarse una opción como correcta.';
        setQErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSaveQ = (): void => {
        if (!validate() || !draft) return;
        startTransition(async () => {
            try {
                await upsertQuestion(exam.id, draft, draftOrder);
                setIsOpen(false);
                router.refresh();
            } catch {
                setQErrors({ general: 'Ocurrió un error. Intentá de nuevo.' });
            }
        });
    };

    const handleDeleteQ = (): void => {
        if (!toDeleteId) return;
        startTransition(async () => {
            await deleteQuestion(toDeleteId, exam.id);
            setIsDelOpen(false);
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/exams"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground transition-colors hover:bg-muted/50"
                >
                    <ArrowLeft size={16} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        {exam.groups.map((g) => g.name).join(' · ')} · {exam.timeLimit} min ·{' '}
                        {exam.questions.length} pregunta
                        {exam.questions.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Questions */}
            <div className="space-y-3.5">
                {exam.questions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-16">
                        <BookOpen size={36} className="mb-3 text-muted-foreground/40" />
                        <p className="font-medium text-muted-foreground">
                            Este examen no tiene preguntas
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground/70">
                            Agregá la primera para empezar.
                        </p>
                    </div>
                ) : (
                    exam.questions.map((q, idx) => (
                        <div
                            key={q.id}
                            className="rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary">
                                    {idx + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[15px] leading-snug font-semibold text-foreground">
                                        {q.text}
                                    </p>
                                    <div className="mt-2.5 flex flex-wrap gap-2">
                                        {q.options.map((o, oi) => (
                                            <span
                                                key={o.id}
                                                className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-semibold ${
                                                    o.isCorrect
                                                        ? 'bg-success/10 text-success ring-1 ring-success/30'
                                                        : 'bg-muted text-muted-foreground'
                                                }`}
                                            >
                                                {LETTERS[oi]}) {o.text}
                                                {o.isCorrect && ' ✓'}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-[11px] text-muted-foreground">
                                        {q.points} {q.points === 1 ? 'punto' : 'puntos'}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-lg font-semibold"
                                        onClick={() => openEdit(q, idx)}
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => confirmDelete(q.id)}
                                    >
                                        <Trash2 size={13} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Button className="rounded-full" onClick={openNew}>
                <Plus size={16} />
                Agregar pregunta
            </Button>

            {/* Question create/edit dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {draft?.id ? 'Editar pregunta' : 'Nueva pregunta'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 space-y-5 overflow-y-auto py-2">
                        {qErrors.general && (
                            <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                                {qErrors.general}
                            </p>
                        )}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">
                                Texto de la pregunta
                            </label>
                            <Input
                                placeholder="Ej: ¿Cuál es la capital de Chile?"
                                value={draft?.text ?? ''}
                                onChange={(e) => setDraftText(e.target.value)}
                                className={qErrors.text ? 'border-destructive' : ''}
                                autoFocus
                            />
                            {qErrors.text && (
                                <p className="text-xs text-destructive">{qErrors.text}</p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Puntos</label>
                            <Input
                                type="number"
                                min={1}
                                max={100}
                                value={String(draft?.points ?? 1)}
                                onChange={(e) => setDraftPoints(Number(e.target.value) || 1)}
                                className="max-w-[120px]"
                            />
                        </div>

                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-sm font-medium text-foreground">
                                    Opciones{' '}
                                    <span className="font-normal text-muted-foreground">
                                        (hacé clic en la letra para marcar la correcta)
                                    </span>
                                </p>
                                {(draft?.options.length ?? 0) < 6 && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-lg"
                                        onClick={addOption}
                                    >
                                        <Plus size={12} />
                                        Agregar opción
                                    </Button>
                                )}
                            </div>
                            {qErrors.options && (
                                <p className="mb-2 text-sm text-destructive">{qErrors.options}</p>
                            )}
                            <div className="space-y-2">
                                {draft?.options.map((opt, i) => (
                                    <div key={opt._key} className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setCorrect(i)}
                                            title="Marcar como correcta"
                                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                                                opt.isCorrect
                                                    ? 'border-success bg-success text-white shadow-sm'
                                                    : 'border-border text-muted-foreground hover:border-success/60 hover:text-success'
                                            }`}
                                        >
                                            {LETTERS[i]}
                                        </button>
                                        <Input
                                            placeholder={`Opción ${LETTERS[i]}`}
                                            value={opt.text}
                                            onChange={(e) => setOptionText(i, e.target.value)}
                                            className="flex-1"
                                        />
                                        {(draft?.options.length ?? 0) > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeOption(i)}
                                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
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
                        <Button
                            className="rounded-full"
                            disabled={isPending}
                            onClick={handleSaveQ}
                        >
                            {isPending && <Loader2 className="animate-spin" />}
                            Guardar pregunta
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete question dialog */}
            <Dialog open={isDelOpen} onOpenChange={setIsDelOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Eliminar pregunta</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        ¿Estás seguro de eliminar esta pregunta? Esta acción no se puede deshacer.
                    </p>
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
                            onClick={handleDeleteQ}
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
