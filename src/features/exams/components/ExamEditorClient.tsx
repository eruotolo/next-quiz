'use client';

import { deleteQuestion, updateExam, upsertQuestion } from '@/features/exams/actions/mutations';
import { questionSchema } from '@/features/exams/schemas/exam.schemas';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const ImportQuestionsDialog = dynamic(
    () => import('@/features/exams/components/ImportQuestionsDialog').then((m) => m.ImportQuestionsDialog),
    { ssr: false }
);
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Tag } from '@/shared/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Switch } from '@/shared/components/ui/switch';
import { cn } from '@/shared/lib/utils';
import type { Exam, Group, Option, Question } from '@prisma/client';
import { ArrowLeft, BookOpen, Flag, GripVertical, Loader2, Plus, Settings, Shuffle, Trash2, Upload, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
    questionType: 'UNICA' | 'MULTIPLE';
    options: OptionDraft[];
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
let keyCounter = 0;
const nextKey = (): string => `opt-${++keyCounter}`;

function defaultQuestionDraft(): QuestionDraft {
    return {
        text: '',
        points: 1,
        questionType: 'UNICA',
        options: [
            { _key: nextKey(), text: '', isCorrect: true },
            { _key: nextKey(), text: '', isCorrect: false },
            { _key: nextKey(), text: '', isCorrect: false },
            { _key: nextKey(), text: '', isCorrect: false },
        ],
    };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: legacy complex UI component
export function ExamEditorClient({ exam }: { exam: ExamWithAll }) {
    const router = useRouter();
    const { slug } = useParams<{ slug: string }>();
    const [isOpen, setIsOpen] = useState(false);
    const [isDelOpen, setIsDelOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);

    const [draft, setDraft] = useState<QuestionDraft | null>(null);
    const [draftOrder, setDraftOrder] = useState(0);
    const [toDeleteId, setToDeleteId] = useState<string | null>(null);
    const [qErrors, setQErrors] = useState<{
        text?: string;
        options?: string;
        general?: string;
    }>({});
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [randomizeQuestions, setRandomizeQuestions] = useState(exam.randomizeQuestions);
    const [isTogglePending, startToggleTransition] = useTransition();

    const handleToggleRandomize = (value: boolean): void => {
        setRandomizeQuestions(value);
        startToggleTransition(async () => {
            try {
                await updateExam(slug, exam.id, {
                    title: exam.title,
                    timeLimit: exam.timeLimit,
                    active: exam.active,
                    antiCheatEnabled: exam.antiCheatEnabled,
                    randomizeQuestions: value,
                    maxGrade: exam.maxGrade,
                    passingGrade: exam.passingGrade,
                    passingPercentage: exam.passingPercentage,
                    groupIds: exam.groups.map((g) => g.id),
                });
            } catch {
                setRandomizeQuestions(!value);
            }
        });
    };

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
            questionType: q.questionType as 'UNICA' | 'MULTIPLE',
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
        setDeleteError(null);
        setIsDelOpen(true);
    };

    const setDraftText = (text: string): void => {
        setDraft((d) => (d ? { ...d, text } : d));
        setQErrors((e) => ({ ...e, text: undefined }));
    };

    const setDraftPoints = (points: number): void => {
        setDraft((d) => (d ? { ...d, points } : d));
    };

    const setDraftType = (type: 'UNICA' | 'MULTIPLE'): void => {
        setDraft((d) => {
            if (!d || d.questionType === type) return d;
            let options = d.options;
            if (type === 'UNICA') {
                // Keep only first correct option to maintain validity
                let foundFirst = false;
                options = d.options.map((o) => {
                    if (o.isCorrect && !foundFirst) {
                        foundFirst = true;
                        return o;
                    }
                    return { ...o, isCorrect: false };
                });
                if (!options.some((o) => o.isCorrect) && options[0]) {
                    options = options.map((o, i) => (i === 0 ? { ...o, isCorrect: true } : o));
                }
            }
            return { ...d, questionType: type, options };
        });
        setQErrors((e) => ({ ...e, options: undefined }));
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

    const toggleCorrect = (i: number): void => {
        setDraft((d) => {
            if (!d) return d;
            return {
                ...d,
                options: d.options.map((o, idx) =>
                    idx === i ? { ...o, isCorrect: !o.isCorrect } : o,
                ),
            };
        });
        setQErrors((e) => ({ ...e, options: undefined }));
    };

    const handleCorrectClick = (i: number): void => {
        if (draft?.questionType === 'MULTIPLE') {
            toggleCorrect(i);
        } else {
            setCorrect(i);
        }
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
        if (!draft) return false;
        // Misma fuente de verdad que el servidor: validar con el schema Zod.
        const parsed = questionSchema.safeParse(draft);
        if (parsed.success) {
            setQErrors({});
            return true;
        }
        const errs: { text?: string; options?: string } = {};
        for (const issue of parsed.error.issues) {
            const key = issue.path[0];
            if (key === 'text' && !errs.text) errs.text = issue.message;
            else if (key === 'options' && !errs.options) errs.options = issue.message;
        }
        setQErrors(errs);
        return false;
    };

    const handleSaveQ = (): void => {
        if (!validate() || !draft) return;
        startTransition(async () => {
            try {
                await upsertQuestion(slug, exam.id, draft, draftOrder);
                setIsOpen(false);
                toast.success('Pregunta guardada');
                router.refresh();
            } catch {
                setQErrors({ general: 'Ocurrió un error. Intentá de nuevo.' });
            }
        });
    };

    const handleDeleteQ = (): void => {
        if (!toDeleteId) return;
        startTransition(async () => {
            try {
                await deleteQuestion(slug, toDeleteId, exam.id);
                setIsDelOpen(false);
                toast.success('Pregunta eliminada');
                router.refresh();
            } catch {
                setDeleteError('Ocurrió un error al eliminar. Intentá de nuevo.');
            }
        });
    };

    const isMultiple = draft?.questionType === 'MULTIPLE';

    const totalPoints = exam.questions.reduce((s, q) => s + q.points, 0);

    return (
        <div className="flex flex-col min-h-screen bg-paper">
            <AdminTopBar
                breadcrumb={['Exámenes', exam.title]}
                title={exam.title}
                subtitle={`${exam.groups.map((g) => g.name).join(' · ')} · ${exam.timeLimit} min · ${exam.questions.length} pregunta${exam.questions.length !== 1 ? 's' : ''} · ${totalPoints} pts`}
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="md" onClick={() => setIsImportOpen(true)} className="gap-2">
                            <Upload size={15} />
                            Importar
                        </Button>
                        <Button variant="ink" size="md" onClick={openNew} className="gap-2">
                            <Plus size={15} />
                            Agregar pregunta
                        </Button>
                        <Button variant="ghost" size="icon-sm" asChild>
                            <Link href={`/${slug}/exams`}>
                                <ArrowLeft size={16} />
                            </Link>
                        </Button>
                    </div>
                }
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Left sidebar: question map */}
                <aside className="w-[260px] shrink-0 flex flex-col border-r border-border bg-white overflow-y-auto">
                    <div className="px-4 py-3 border-b border-border">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-mute">
                            Preguntas · {exam.questions.length}
                        </p>
                    </div>
                    <div className="flex flex-col gap-1 p-3 flex-1">
                        {exam.questions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2">
                                <BookOpen size={28} className="text-mute/20" />
                                <p className="text-[12px] text-mute text-center">Sin preguntas</p>
                            </div>
                        ) : (
                            exam.questions.map((q, idx) => {
                                const hasIssue = !q.options.some((o) => o.isCorrect);
                                return (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => openEdit(q, idx)}
                                        className="group flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-primary-wash/60"
                                    >
                                        <GripVertical size={12} className="text-mute/40 shrink-0" />
                                        <div className={cn(
                                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] text-[11px] font-bold",
                                            hasIssue ? "bg-warning-wash text-warning" : "bg-paper-warm text-ink-dim"
                                        )}>
                                            {String(idx + 1).padStart(2, '0')}
                                        </div>
                                        <p className="text-[12px] font-medium text-ink-dim truncate flex-1">
                                            {q.text || 'Sin texto'}
                                        </p>
                                        {hasIssue && (
                                            <Flag size={11} className="text-warning shrink-0" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                    <div className="p-3 border-t border-border">
                        <Button variant="ghost" size="sm" onClick={openNew} className="w-full gap-2 text-primary font-bold border border-dashed border-primary/20 hover:bg-primary-wash/40">
                            <Plus size={14} />
                            Nueva pregunta
                        </Button>
                    </div>
                </aside>

                {/* Center: question list canvas */}
                <main className="flex-1 overflow-y-auto p-8">
                    {exam.questions.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center border-dashed py-24">
                            <BookOpen size={48} className="mb-4 text-mute/20" />
                            <p className="text-lg font-bold text-ink">Este examen no tiene preguntas</p>
                            <p className="mt-1 text-sm text-mute">Agregá la primera o importalas en masa.</p>
                            <div className="mt-6 flex gap-3">
                                <Button variant="ink" size="md" onClick={openNew} className="gap-2">
                                    <Plus size={16} />
                                    Agregar pregunta
                                </Button>
                                <Button variant="ghost" size="md" onClick={() => setIsImportOpen(true)} className="gap-2">
                                    <Upload size={16} />
                                    Importar
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-4 max-w-[780px]">
                            {exam.questions.map((q, idx) => (
                                <Card
                                    key={q.id}
                                    className="bg-white border-border shadow-sm overflow-hidden p-0"
                                >
                                    {/* Card header */}
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-paper">
                                        <div className="flex items-center gap-3">
                                            <Tag tone="primary" className="font-mono text-[10px] h-6 px-2.5">
                                                P {String(idx + 1).padStart(2, '0')}
                                            </Tag>
                                            <Tag tone={q.questionType === 'MULTIPLE' ? 'outline' : 'default'} className="font-mono text-[10px] h-6 px-2.5">
                                                {q.questionType === 'MULTIPLE' ? 'Múltiple' : 'Única'}
                                            </Tag>
                                            <span className="font-mono text-[10px] font-bold text-mute uppercase">
                                                {q.points} {q.points === 1 ? 'PTO' : 'PTOS'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1.5 text-primary font-bold hover:bg-primary-wash"
                                                onClick={() => openEdit(q, idx)}
                                            >
                                                <Settings size={13} />
                                                Editar
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                className="text-mute hover:text-destructive hover:bg-danger-wash"
                                                onClick={() => confirmDelete(q.id)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Card body */}
                                    <div className="px-6 py-5">
                                        <p className="font-display text-[18px] font-medium text-ink leading-snug">
                                            {q.text}
                                        </p>
                                        <div className="mt-4 space-y-2">
                                            {q.options.map((o, oi) => (
                                                <div
                                                    key={o.id}
                                                    className={cn(
                                                        "flex items-center gap-3 rounded-[10px] border px-4 py-2.5 transition-colors",
                                                        o.isCorrect
                                                            ? "bg-success/5 border-success/20"
                                                            : "bg-paper border-border"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold border",
                                                        o.isCorrect
                                                            ? "bg-success border-success/30 text-white"
                                                            : "bg-white border-border text-mute"
                                                    )}>
                                                        {LETTERS[oi]}
                                                    </div>
                                                    <span className={cn(
                                                        "text-[13.5px] font-medium",
                                                        o.isCorrect ? "text-success" : "text-ink-dim"
                                                    )}>
                                                        {o.text || <span className="italic opacity-40">Sin texto</span>}
                                                    </span>
                                                    {o.isCorrect && (
                                                        <span className="ml-auto font-mono text-[10px] font-bold text-success uppercase">✓ Correcta</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </main>

                {/* Right inspector */}
                <aside className="w-[280px] shrink-0 flex flex-col border-l border-border bg-white overflow-y-auto">
                    <div className="px-4 py-3 border-b border-border">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-mute">
                            Inspector
                        </p>
                    </div>
                    <div className="flex flex-col gap-4 p-4">
                        {/* Exam metadata */}
                        <Card className="border-border bg-paper shadow-none p-4">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-mute mb-3">Examen</p>
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[12px] text-mute">Tiempo</span>
                                    <span className="font-mono text-[12px] font-bold text-ink">{exam.timeLimit} min</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[12px] text-mute">Preguntas</span>
                                    <span className="font-mono text-[12px] font-bold text-ink">{exam.questions.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[12px] text-mute">Total pts</span>
                                    <span className="font-mono text-[12px] font-bold text-ink">{totalPoints}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[12px] text-mute">Nota máx.</span>
                                    <span className="font-mono text-[12px] font-bold text-ink">{exam.maxGrade}</span>
                                </div>
                            </div>
                        </Card>

                        {/* Groups */}
                        <Card className="border-border bg-paper shadow-none p-4">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-mute mb-3">Grupos asignados</p>
                            {exam.groups.length === 0 ? (
                                <p className="text-[12px] text-mute italic">Sin grupos</p>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {exam.groups.map((g) => (
                                        <Tag key={g.id} tone="outline" className="font-mono text-[10px] h-5 bg-white">
                                            {g.name}
                                        </Tag>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Randomization toggle */}
                        <Card className="border-border bg-paper shadow-none p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Shuffle size={14} className="text-primary" />
                                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-mute">Aleatorización</p>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] font-bold text-ink-dim">Orden de preguntas</span>
                                    <span className="text-[10px] text-mute leading-snug">Cada estudiante ve un orden distinto.</span>
                                </div>
                                <Switch
                                    checked={randomizeQuestions}
                                    onCheckedChange={handleToggleRandomize}
                                    disabled={isTogglePending}
                                    className="data-[state=checked]:bg-primary shrink-0"
                                />
                            </div>
                        </Card>

                        {/* Anti-cheat status */}
                        <Card className="border-border bg-ink text-white shadow-none p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap size={14} className="text-lime" />
                                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-white/60">Anti-copia</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-white/60">Vigilancia</span>
                                    <span className={cn(
                                        "font-mono text-[10px] font-bold",
                                        exam.antiCheatEnabled ? "text-lime" : "text-white/30"
                                    )}>
                                        {!exam.antiCheatEnabled
                                            ? 'Libre'
                                            : exam.lockTabSwitch
                                                ? 'Restric. total'
                                                : 'Anti-trampa'}
                                    </span>
                                </div>
                                {[
                                    { label: 'Un intento', value: exam.oneAttempt },
                                    { label: 'IP única', value: exam.uniqueIp },
                                ].map((item) => (
                                    <div key={item.label} className="flex justify-between items-center">
                                        <span className="text-[11px] text-white/60">{item.label}</span>
                                        <span className={cn(
                                            "font-mono text-[10px] font-bold",
                                            item.value ? "text-lime" : "text-white/30"
                                        )}>
                                            {item.value ? 'ON' : 'OFF'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Validation */}
                        {exam.questions.some((q) => !q.options.some((o) => o.isCorrect)) && (
                            <Card className="border-warning/20 bg-warning-wash shadow-none p-4">
                                <div className="flex items-start gap-2">
                                    <Flag size={14} className="text-warning shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[12px] font-bold text-warning">Antes de publicar</p>
                                        <p className="text-[11px] text-warning/80 mt-1">
                                            Hay preguntas sin respuesta correcta marcada.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </aside>
            </div>

            {/* Import dialog */}
            <ImportQuestionsDialog
                slug={slug}
                examId={exam.id}
                open={isImportOpen}
                onOpenChange={setIsImportOpen}
            />

            {/* Question create/edit dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl rounded-[22px] border-border shadow-2xl overflow-hidden p-0">
                    <div className="px-6 py-5 border-b border-border bg-paper">
                        <DialogTitle className="font-display text-2xl text-ink">
                            {draft?.id ? 'Editar pregunta' : 'Nueva pregunta'}
                        </DialogTitle>
                    </div>
                    <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                        {qErrors.general && (
                            <p className="rounded-[10px] bg-danger-wash border border-destructive/10 px-4 py-3 text-sm text-destructive font-bold">
                                {qErrors.general}
                            </p>
                        )}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="question-text" className="text-[13px] font-bold text-ink">
                                Enunciado
                            </label>
                            <Input
                                id="question-text"
                                placeholder="Ej: ¿Cuál es la capital de Chile?"
                                value={draft?.text ?? ''}
                                onChange={(e) => setDraftText(e.target.value)}
                                className={cn("h-11 rounded-[10px] bg-white border-border", qErrors.text && 'border-destructive')}
                                autoFocus
                            />
                            {qErrors.text && (
                                <p className="text-destructive text-xs font-medium">{qErrors.text}</p>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="question-points" className="text-[13px] font-bold text-ink">Puntos</label>
                                <Input
                                    id="question-points"
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={String(draft?.points ?? 1)}
                                    onChange={(e) => setDraftPoints(Number(e.target.value) || 1)}
                                    className="h-11 w-[100px] rounded-[10px] bg-white border-border text-center font-bold"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[13px] font-bold text-ink">Tipo</span>
                                <div className="flex overflow-hidden rounded-[10px] border border-border h-11">
                                    {(['UNICA', 'MULTIPLE'] as const).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setDraftType(t)}
                                            className={cn(
                                                'px-5 text-[13px] font-bold transition-colors',
                                                draft?.questionType === t
                                                    ? 'bg-ink text-white'
                                                    : 'text-mute hover:bg-paper-warm',
                                                t === 'MULTIPLE' && 'border-l border-border',
                                            )}
                                        >
                                            {t === 'UNICA' ? 'Única' : 'Múltiple'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-[13px] font-bold text-ink">
                                    Opciones{' '}
                                    <span className="text-mute font-normal text-[12px]">
                                        {isMultiple ? '— marcá las correctas' : '— marcá la correcta'}
                                    </span>
                                </p>
                                {(draft?.options.length ?? 0) < 6 && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="gap-1.5 text-primary font-bold"
                                        onClick={addOption}
                                    >
                                        <Plus size={12} />
                                        Opción
                                    </Button>
                                )}
                            </div>
                            {qErrors.options && (
                                <p className="text-destructive mb-2 text-[12px] font-bold">{qErrors.options}</p>
                            )}
                            <div className="space-y-2">
                                {draft?.options.map((opt, i) => (
                                    <div key={opt._key} className="flex items-center gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => handleCorrectClick(i)}
                                            className={cn(
                                                'flex h-7 w-7 shrink-0 items-center justify-center border-2 text-[11px] font-bold transition-all',
                                                isMultiple ? 'rounded-[6px]' : 'rounded-full',
                                                opt.isCorrect
                                                    ? 'border-success bg-success text-white'
                                                    : 'border-border text-mute hover:border-success/60 hover:text-success',
                                            )}
                                        >
                                            {LETTERS[i]}
                                        </button>
                                        <Input
                                            placeholder={`Opción ${LETTERS[i]}`}
                                            value={opt.text}
                                            onChange={(e) => setOptionText(i, e.target.value)}
                                            className={cn(
                                                "flex-1 h-10 rounded-[8px] border-border bg-white",
                                                opt.isCorrect && "bg-success/5 border-success/20"
                                            )}
                                        />
                                        {(draft?.options.length ?? 0) > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeOption(i)}
                                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-mute transition-colors hover:bg-danger-wash hover:text-destructive"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-border flex justify-end gap-2 bg-white">
                        <Button variant="ghost" size="md" onClick={() => setIsOpen(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button variant="ink" size="md" disabled={isPending} onClick={handleSaveQ} className="min-w-[140px]">
                            {isPending && <Loader2 className="animate-spin mr-2" />}
                            Guardar pregunta
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete question dialog */}
            <Dialog open={isDelOpen} onOpenChange={setIsDelOpen}>
                <DialogContent className="sm:max-w-sm rounded-[22px] border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl text-destructive">Eliminar pregunta</DialogTitle>
                    </DialogHeader>
                    <p className="text-[14px] leading-relaxed text-ink-dim py-2">
                        ¿Estás seguro de eliminar esta pregunta? Esta acción no se puede deshacer.
                    </p>
                    {deleteError && (
                        <p className="rounded-[10px] bg-danger-wash border border-destructive/10 px-4 py-2 text-sm text-destructive font-bold">
                            {deleteError}
                        </p>
                    )}
                    <DialogFooter className="gap-2 sm:justify-end mt-2">
                        <Button variant="ghost" size="md" onClick={() => setIsDelOpen(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button variant="danger" size="md" disabled={isPending} onClick={handleDeleteQ}>
                            {isPending && <Loader2 className="animate-spin mr-2" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
