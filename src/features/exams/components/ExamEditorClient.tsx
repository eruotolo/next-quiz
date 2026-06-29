'use client';

import { deleteQuestion, updateExam, upsertQuestion } from '@/features/exams/actions/mutations';
import { copyBankQuestionToExam } from '@/features/questions/actions/mutations';
import { getBankQuestionsForPicker } from '@/features/questions/actions/queries';
import { questionSchema } from '@/features/exams/schemas/exam.schemas';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const ImportQuestionsDialog = dynamic(
    () =>
        import('@/features/exams/components/ImportQuestionsDialog').then(
            (m) => m.ImportQuestionsDialog,
        ),
    { ssr: false },
);

const GenerateQuestionsDialog = dynamic(
    () =>
        import('@/features/ai-question-gen/components/GenerateQuestionsDialog').then(
            (m) => m.GenerateQuestionsDialog,
        ),
    { ssr: false },
);
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Tag } from '@/shared/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Switch } from '@/shared/components/ui/switch';
import { cn } from '@/shared/lib/utils';
import type { Exam, Group, Option, Question } from '@prisma/client';
import {
    ArrowLeft,
    BookOpen,
    Flag,
    GripVertical,
    Library,
    Loader2,
    Plus,
    Search,
    Settings,
    Shuffle,
    Sparkles,
    Trash2,
    Upload,
    X,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

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
export function ExamEditorClient({
    exam,
    subjects = [],
    isDemo,
}: {
    exam: ExamWithAll;
    subjects?: string[];
    isDemo?: boolean;
}) {
    const router = useRouter();
    const { slug } = useParams<{ slug: string }>();
    const [isOpen, setIsOpen] = useState(false);
    const [isDelOpen, setIsDelOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);

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
        if (isDemo) return;
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
                setQErrors({ general: 'Ocurrió un error. Intenta de nuevo.' });
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
                setDeleteError('Ocurrió un error al eliminar. Intenta de nuevo.');
            }
        });
    };

    // ── Picker "Desde banco" ───────────────────────────────────────────────
    const [bankOpen, setBankOpen] = useState(false);
    const [bankSearch, setBankSearch] = useState('');
    const [bankResults, setBankResults] = useState<
        { id: string; text: string; subject: string | null; difficulty: string }[]
    >([]);
    const [bankPending, startBankTransition] = useTransition();

    useEffect(() => {
        if (!bankOpen) return;
        const q = bankSearch.trim();
        if (q.length > 0 && q.length < 2) return;
        const t = setTimeout(() => {
            startBankTransition(async () => {
                try {
                    const res = await getBankQuestionsForPicker(slug, q);
                    setBankResults(res);
                } catch {
                    setBankResults([]);
                }
            });
        }, 250);
        return () => clearTimeout(t);
    }, [bankOpen, bankSearch, slug]);

    function openBankPicker(): void {
        setBankSearch('');
        setBankResults([]);
        setBankOpen(true);
    }

    function handlePickFromBank(bankQuestionId: string): void {
        startBankTransition(async () => {
            try {
                await copyBankQuestionToExam(slug, bankQuestionId, exam.id);
                toast.success('Pregunta copiada del banco');
                setBankOpen(false);
                router.refresh();
            } catch {
                toast.error('No se pudo copiar la pregunta.');
            }
        });
    }

    const isMultiple = draft?.questionType === 'MULTIPLE';

    const totalPoints = exam.questions.reduce((s, q) => s + q.points, 0);

    return (
        <>
            {/* Toolbar */}
            <div className="border-border flex items-center gap-2 border-b bg-white px-8 py-3">
                <Button variant="ghost" size="icon-sm" asChild>
                    <Link href={`/${slug}/exams`}>
                        <ArrowLeft size={16} />
                    </Link>
                </Button>
                <div className="flex-1" />
                <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setIsAiOpen(true)}
                    className="text-primary hover:bg-primary-wash gap-2"
                    disabled={isDemo}
                >
                    <Sparkles size={15} />
                    Generar con IA
                </Button>
                <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setIsImportOpen(true)}
                    className="gap-2"
                    disabled={isDemo}
                >
                    <Upload size={15} />
                    Importar
                </Button>
                <Button variant="ghost" size="md" onClick={openBankPicker} className="gap-2" disabled={isDemo}>
                    <Library size={15} />
                    Desde banco
                </Button>
                <Button variant="ink" size="md" onClick={openNew} className="gap-2" disabled={isDemo}>
                    <Plus size={15} />
                    Agregar pregunta
                </Button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left sidebar: question map */}
                <aside className="border-border flex w-[260px] shrink-0 flex-col overflow-y-auto border-r bg-white">
                    <div className="border-border border-b px-4 py-3">
                        <p className="text-mute font-mono text-[10px] font-bold tracking-[0.12em] uppercase">
                            Preguntas · {exam.questions.length}
                        </p>
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-3">
                        {exam.questions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-10">
                                <BookOpen size={28} className="text-mute/20" />
                                <p className="text-mute text-center text-[12px]">Sin preguntas</p>
                            </div>
                        ) : (
                            exam.questions.map((q, idx) => {
                                const hasIssue = !q.options.some((o) => o.isCorrect);
                                return (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => openEdit(q, idx)}
                                        className="group hover:bg-primary-wash/60 flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left transition-colors"
                                    >
                                        <GripVertical size={12} className="text-mute/40 shrink-0" />
                                        <div
                                            className={cn(
                                                'flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] text-[11px] font-bold',
                                                hasIssue
                                                    ? 'bg-warning-wash text-warning'
                                                    : 'bg-paper-warm text-ink-dim',
                                            )}
                                        >
                                            {String(idx + 1).padStart(2, '0')}
                                        </div>
                                        <p className="text-ink-dim flex-1 truncate text-[12px] font-medium">
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
                    <div className="border-border border-t p-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={openNew}
                            className="text-primary border-primary/20 hover:bg-primary-wash/40 w-full gap-2 border border-dashed font-bold"
                            disabled={isDemo}
                        >
                            <Plus size={14} />
                            Nueva pregunta
                        </Button>
                    </div>
                </aside>

                {/* Center: question list canvas */}
                <main className="flex-1 overflow-y-auto p-8">
                    {exam.questions.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center border-dashed py-24">
                            <BookOpen size={48} className="text-mute/20 mb-4" />
                            <p className="text-ink text-lg font-bold">
                                Este examen no tiene preguntas
                            </p>
                            <p className="text-mute mt-1 text-sm">
                                Agrega la primera o impórtalas en masa.
                            </p>
                            <div className="mt-6 flex gap-3">
                                <Button variant="ink" size="md" onClick={openNew} className="gap-2" disabled={isDemo}>
                                    <Plus size={16} />
                                    Agregar pregunta
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="md"
                                    onClick={() => setIsAiOpen(true)}
                                    className="text-primary hover:bg-primary-wash gap-2"
                                    disabled={isDemo}
                                >
                                    <Sparkles size={16} />
                                    Generar con IA
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="md"
                                    onClick={openBankPicker}
                                    className="gap-2"
                                    disabled={isDemo}
                                >
                                    <Library size={16} />
                                    Desde banco
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="md"
                                    onClick={() => setIsImportOpen(true)}
                                    className="gap-2"
                                    disabled={isDemo}
                                >
                                    <Upload size={16} />
                                    Importar
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <div className="max-w-[780px] space-y-4">
                            {exam.questions.map((q, idx) => (
                                <Card
                                    key={q.id}
                                    className="border-border overflow-hidden bg-white p-0 shadow-sm"
                                >
                                    {/* Card header */}
                                    <div className="border-border bg-paper flex items-center justify-between border-b px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Tag
                                                tone="primary"
                                                className="h-6 px-2.5 font-mono text-[10px]"
                                            >
                                                P {String(idx + 1).padStart(2, '0')}
                                            </Tag>
                                            <Tag
                                                tone={
                                                    q.questionType === 'MULTIPLE'
                                                        ? 'outline'
                                                        : 'default'
                                                }
                                                className="h-6 px-2.5 font-mono text-[10px]"
                                            >
                                                {q.questionType === 'MULTIPLE'
                                                    ? 'Múltiple'
                                                    : 'Única'}
                                            </Tag>
                                            <span className="text-mute font-mono text-[10px] font-bold uppercase">
                                                {q.points} {q.points === 1 ? 'PTO' : 'PTOS'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-primary hover:bg-primary-wash gap-1.5 font-bold"
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
                                                disabled={isDemo}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Card body */}
                                    <div className="px-6 py-5">
                                        <p className="font-display text-ink text-[18px] leading-snug font-medium">
                                            {q.text}
                                        </p>
                                        <div className="mt-4 space-y-2">
                                            {q.options.map((o, oi) => (
                                                <div
                                                    key={o.id}
                                                    className={cn(
                                                        'flex items-center gap-3 rounded-[10px] border px-4 py-2.5 transition-colors',
                                                        o.isCorrect
                                                            ? 'bg-success/5 border-success/20'
                                                            : 'bg-paper border-border',
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold',
                                                            o.isCorrect
                                                                ? 'bg-success border-success/30 text-white'
                                                                : 'border-border text-mute bg-white',
                                                        )}
                                                    >
                                                        {LETTERS[oi]}
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            'text-[13.5px] font-medium',
                                                            o.isCorrect
                                                                ? 'text-success'
                                                                : 'text-ink-dim',
                                                        )}
                                                    >
                                                        {o.text || (
                                                            <span className="italic opacity-40">
                                                                Sin texto
                                                            </span>
                                                        )}
                                                    </span>
                                                    {o.isCorrect && (
                                                        <span className="text-success ml-auto font-mono text-[10px] font-bold uppercase">
                                                            ✓ Correcta
                                                        </span>
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
                <aside className="border-border flex w-[280px] shrink-0 flex-col overflow-y-auto border-l bg-white">
                    <div className="border-border border-b px-4 py-3">
                        <p className="text-mute font-mono text-[10px] font-bold tracking-[0.12em] uppercase">
                            Inspector
                        </p>
                    </div>
                    <div className="flex flex-col gap-4 p-4">
                        {/* Exam metadata */}
                        <Card className="border-border bg-paper p-4 shadow-none">
                            <p className="text-mute mb-3 font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                Examen
                            </p>
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-mute text-[12px]">Tiempo</span>
                                    <span className="text-ink font-mono text-[12px] font-bold">
                                        {exam.timeLimit} min
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-mute text-[12px]">Preguntas</span>
                                    <span className="text-ink font-mono text-[12px] font-bold">
                                        {exam.questions.length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-mute text-[12px]">Total pts</span>
                                    <span className="text-ink font-mono text-[12px] font-bold">
                                        {totalPoints}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-mute text-[12px]">Nota máx.</span>
                                    <span className="text-ink font-mono text-[12px] font-bold">
                                        {exam.maxGrade}
                                    </span>
                                </div>
                            </div>
                        </Card>

                        {/* Groups */}
                        <Card className="border-border bg-paper p-4 shadow-none">
                            <p className="text-mute mb-3 font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                Grupos asignados
                            </p>
                            {exam.groups.length === 0 ? (
                                <p className="text-mute text-[12px] italic">Sin grupos</p>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {exam.groups.map((g) => (
                                        <Tag
                                            key={g.id}
                                            tone="outline"
                                            className="h-5 bg-white font-mono text-[10px]"
                                        >
                                            {g.name}
                                        </Tag>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Randomization toggle */}
                        <Card className="border-border bg-paper p-4 shadow-none">
                            <div className="mb-3 flex items-center gap-2">
                                <Shuffle size={14} className="text-primary" />
                                <p className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                    Aleatorización
                                </p>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-ink-dim text-[11px] font-bold">
                                        Orden de preguntas
                                    </span>
                                    <span className="text-mute text-[10px] leading-snug">
                                        Cada estudiante ve un orden distinto.
                                    </span>
                                </div>
                                <Switch
                                    checked={randomizeQuestions}
                                    onCheckedChange={handleToggleRandomize}
                                    disabled={isTogglePending || isDemo}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </div>
                        </Card>

                        {/* Anti-cheat status */}
                        <Card className="border-border bg-ink p-4 text-white shadow-none">
                            <div className="mb-3 flex items-center gap-2">
                                <Zap size={14} className="text-lime" />
                                <p className="font-mono text-[10px] font-bold tracking-[0.1em] text-white/60 uppercase">
                                    Anti-copia
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-white/60">Vigilancia</span>
                                    <span
                                        className={cn(
                                            'font-mono text-[10px] font-bold',
                                            exam.antiCheatEnabled ? 'text-lime' : 'text-white/30',
                                        )}
                                    >
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
                                    <div
                                        key={item.label}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="text-[11px] text-white/60">
                                            {item.label}
                                        </span>
                                        <span
                                            className={cn(
                                                'font-mono text-[10px] font-bold',
                                                item.value ? 'text-lime' : 'text-white/30',
                                            )}
                                        >
                                            {item.value ? 'ON' : 'OFF'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Validation */}
                        {exam.questions.some((q) => !q.options.some((o) => o.isCorrect)) && (
                            <Card className="border-warning/20 bg-warning-wash p-4 shadow-none">
                                <div className="flex items-start gap-2">
                                    <Flag size={14} className="text-warning mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-warning text-[12px] font-bold">
                                            Antes de publicar
                                        </p>
                                        <p className="text-warning/80 mt-1 text-[11px]">
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

            {/* AI generation dialog */}
            <GenerateQuestionsDialog
                slug={slug}
                examId={exam.id}
                open={isAiOpen}
                onOpenChange={setIsAiOpen}
                subjects={subjects}
            />

            {/* From bank picker dialog */}
            <Dialog open={bankOpen} onOpenChange={setBankOpen}>
                <DialogContent className="border-border max-h-[80vh] max-w-[560px] overflow-hidden rounded-[22px] p-0 shadow-2xl">
                    <div className="border-border bg-paper border-b px-6 py-5">
                        <DialogTitle className="font-display text-ink text-xl">
                            Copiar del banco de preguntas
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Busca una pregunta del banco para copiarla a este examen.
                        </DialogDescription>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <div className="border-border relative border-b px-4 py-3">
                            <Search className="text-mute absolute top-1/2 left-7 size-4 -translate-y-1/2" />
                            <Input
                                value={bankSearch}
                                onChange={(e) => setBankSearch(e.target.value)}
                                placeholder="Buscar por texto o asignatura…"
                                className="border-border ml-6 h-10 rounded-[10px] bg-white pl-9"
                                autoFocus
                            />
                        </div>
                        <div className="max-h-[50vh] overflow-y-auto p-2">
                            {bankPending && bankResults.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="text-primary size-5 animate-spin" />
                                </div>
                            ) : bankResults.length === 0 ? (
                                <p className="text-mute py-12 text-center text-[13px]">
                                    {bankSearch.trim().length >= 2
                                        ? 'Sin resultados. Prueba con otro término.'
                                        : 'Escribe al menos 2 caracteres para buscar.'}
                                </p>
                            ) : (
                                bankResults.map((q) => (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => handlePickFromBank(q.id)}
                                        className="hover:bg-primary-wash flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-left transition-colors"
                                    >
                                        <Library className="text-mute size-4 shrink-0" />
                                        <span className="text-ink flex-1 truncate text-[13px] font-medium">
                                            {q.text}
                                        </span>
                                        {q.subject && (
                                            <Tag tone="default" size="sm">
                                                {q.subject}
                                            </Tag>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Question create/edit dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="border-border flex max-h-[90vh] flex-col overflow-hidden rounded-[22px] p-0 shadow-2xl sm:max-w-2xl"
                >
                    <div className="border-border bg-paper-warm border-b px-6 py-5">
                        <DialogTitle className="font-display text-ink text-2xl">
                            {draft?.id ? 'Editar pregunta' : 'Nueva pregunta'}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulario para crear o editar una pregunta del examen.
                        </DialogDescription>
                    </div>
                    <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                        {qErrors.general && (
                            <p className="bg-danger-wash border-destructive/10 text-destructive rounded-[10px] border px-4 py-3 text-sm font-bold">
                                {qErrors.general}
                            </p>
                        )}
                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="question-text"
                                className="text-ink text-[13px] font-bold"
                            >
                                Enunciado
                            </label>
                            <Input
                                id="question-text"
                                placeholder="Ej: ¿Cuál es la capital de Chile?"
                                value={draft?.text ?? ''}
                                onChange={(e) => setDraftText(e.target.value)}
                                className={cn(
                                    'border-border h-11 rounded-[10px] bg-white',
                                    qErrors.text && 'border-destructive',
                                )}
                                autoFocus
                                disabled={isDemo}
                            />
                            {qErrors.text && (
                                <p className="text-destructive text-xs font-medium">
                                    {qErrors.text}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="question-points"
                                    className="text-ink text-[13px] font-bold"
                                >
                                    Puntos
                                </label>
                                <Input
                                    id="question-points"
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={String(draft?.points ?? 1)}
                                    onChange={(e) => setDraftPoints(Number(e.target.value) || 1)}
                                    className="border-border h-11 w-[100px] rounded-[10px] bg-white text-center font-bold"
                                    disabled={isDemo}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-ink text-[13px] font-bold">Tipo</span>
                                <div className="border-border flex h-11 overflow-hidden rounded-[10px] border">
                                    {(['UNICA', 'MULTIPLE'] as const).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => {
                                                if (isDemo) return;
                                                setDraftType(t);
                                            }}
                                            className={cn(
                                                'px-5 text-[13px] font-bold transition-colors',
                                                draft?.questionType === t
                                                    ? 'bg-ink text-white'
                                                    : 'text-mute hover:bg-paper-warm',
                                                t === 'MULTIPLE' && 'border-border border-l',
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
                                <p className="text-ink text-[13px] font-bold">
                                    Opciones{' '}
                                    <span className="text-mute text-[12px] font-normal">
                                        {isMultiple
                                            ? '— marcá las correctas'
                                            : '— marcá la correcta'}
                                    </span>
                                </p>
                                {(draft?.options.length ?? 0) < 6 && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-primary gap-1.5 font-bold"
                                        onClick={addOption}
                                        disabled={isDemo}
                                    >
                                        <Plus size={12} />
                                        Opción
                                    </Button>
                                )}
                            </div>
                            {qErrors.options && (
                                <p className="text-destructive mb-2 text-[12px] font-bold">
                                    {qErrors.options}
                                </p>
                            )}
                            <div className="space-y-2">
                                {draft?.options.map((opt, i) => (
                                    <div key={opt._key} className="flex items-center gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (isDemo) return;
                                                handleCorrectClick(i);
                                            }}
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
                                                'border-border h-10 flex-1 rounded-[8px] bg-white',
                                                opt.isCorrect && 'bg-success/5 border-success/20',
                                            )}
                                            disabled={isDemo}
                                        />
                                        {(draft?.options.length ?? 0) > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeOption(i)}
                                                className="text-mute hover:bg-danger-wash hover:text-destructive disabled:opacity-50 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors"
                                                disabled={isDemo}
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="border-border flex items-center gap-2 border-t bg-white px-6 py-4">
                        {isDemo && (
                            <p className="text-muted-foreground mr-auto text-xs">
                                En modo demo no podés guardar cambios.
                            </p>
                        )}
                        <div className="ml-auto flex gap-2">
                            <Button
                                variant="ghost"
                                size="md"
                                onClick={() => setIsOpen(false)}
                                disabled={isPending}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="ink"
                                size="md"
                                disabled={isPending || isDemo}
                                onClick={handleSaveQ}
                                className="min-w-[140px]"
                            >
                                {isPending && <Loader2 className="mr-2 animate-spin" />}
                                Guardar pregunta
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete question dialog */}
            <Dialog open={isDelOpen} onOpenChange={setIsDelOpen}>
                <DialogContent className="border-border rounded-[22px] shadow-2xl sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="font-display text-destructive text-2xl">
                            Eliminar pregunta
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Confirmación para eliminar la pregunta.
                        </DialogDescription>
                    </DialogHeader>
                    <p className="text-ink-dim py-2 text-[14px] leading-relaxed">
                        ¿Estás seguro de eliminar esta pregunta? Esta acción no se puede deshacer.
                    </p>
                    {deleteError && (
                        <p className="bg-danger-wash border-destructive/10 text-destructive rounded-[10px] border px-4 py-2 text-sm font-bold">
                            {deleteError}
                        </p>
                    )}
                    <DialogFooter className="mt-2 gap-2 sm:justify-end">
                        <Button
                            variant="ghost"
                            size="md"
                            onClick={() => setIsDelOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            size="md"
                            disabled={isPending}
                            onClick={handleDeleteQ}
                        >
                            {isPending && <Loader2 className="mr-2 animate-spin" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
