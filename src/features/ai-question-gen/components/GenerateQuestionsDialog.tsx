'use client';

import { importQuestions } from '@/features/exams/actions/mutations';
import type { GeneratedQuestion } from '@/features/ai-question-gen/schemas/generation.schemas';
import { Button } from '@/shared/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/lib/utils';
import { AlertTriangle, CheckCircle, Loader2, Sparkles, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

interface Props {
    slug: string;
    examId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subjects: string[];
}

const DIFFICULTY_OPTIONS = [
    { value: 'FACIL', label: 'Básico' },
    { value: 'MEDIA', label: 'Intermedio' },
    { value: 'DIFICIL', label: 'Avanzado' },
] as const;

type Difficulty = 'FACIL' | 'MEDIA' | 'DIFICIL';

interface FormData {
    subject: string;
    topic: string;
    questionCount: number;
    optionsPerQuestion: number;
    correctAnswers: number;
    difficulty: Difficulty;
    points: number;
}

function defaultForm(): FormData {
    return {
        subject: '',
        topic: '',
        questionCount: 5,
        optionsPerQuestion: 4,
        correctAnswers: 1,
        difficulty: 'MEDIA',
        points: 1,
    };
}

function ConfigurationForm({
    form,
    subjects,
    generating,
    generationError,
    canGenerate,
    onUpdate,
    onGenerate,
}: {
    form: FormData;
    subjects: string[];
    generating: boolean;
    generationError: string | null;
    canGenerate: boolean;
    onUpdate: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
    onGenerate: () => void;
}) {
    const questionType: 'UNICA' | 'MULTIPLE' = form.correctAnswers === 1 ? 'UNICA' : 'MULTIPLE';

    return (
        <div className="space-y-4">
            <SubjectField form={form} subjects={subjects} onUpdate={onUpdate} />

            <div className="flex flex-col gap-1.5">
                <label htmlFor="ai-topic" className="text-ink text-[13px] font-bold">
                    Temática
                </label>
                <Input
                    id="ai-topic"
                    placeholder="Ej: Fuerza y movimiento en el plano inclinado"
                    value={form.topic}
                    onChange={(e) => onUpdate('topic', e.target.value)}
                    className="border-border h-10 rounded-[10px] bg-white"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <NumberField
                    id="ai-count"
                    label="Preguntas"
                    value={form.questionCount}
                    min={1}
                    max={20}
                    onChange={(v) => onUpdate('questionCount', v)}
                />
                <NumberField
                    id="ai-options"
                    label="Opciones / pregunta"
                    value={form.optionsPerQuestion}
                    min={2}
                    max={6}
                    onChange={(v) => onUpdate('optionsPerQuestion', v)}
                />
                <NumberField
                    id="ai-correct"
                    label="Correctas / pregunta"
                    value={form.correctAnswers}
                    min={1}
                    max={form.optionsPerQuestion}
                    onChange={(v) => onUpdate('correctAnswers', v)}
                    hint={
                        questionType === 'UNICA'
                            ? 'Única respuesta correcta'
                            : 'Múltiples respuestas correctas'
                    }
                />
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="ai-difficulty" className="text-ink text-[13px] font-bold">
                        Dificultad
                    </label>
                    <Select
                        value={form.difficulty}
                        onValueChange={(v) => onUpdate('difficulty', v as Difficulty)}
                    >
                        <SelectTrigger
                            id="ai-difficulty"
                            className="border-border h-10 w-full rounded-[10px] bg-white"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {DIFFICULTY_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <NumberField
                id="ai-points"
                label="Puntos por pregunta"
                value={form.points}
                min={1}
                max={100}
                onChange={(v) => onUpdate('points', v)}
                className="w-[100px]"
            />

            {generationError && (
                <div className="bg-danger-wash border-destructive/10 flex items-start gap-2 rounded-[10px] border px-4 py-3">
                    <AlertTriangle size={14} className="text-destructive mt-0.5 shrink-0" />
                    <p className="text-destructive text-[13px]">{generationError}</p>
                </div>
            )}

            <Button
                variant="ink"
                size="md"
                disabled={!canGenerate || generating}
                onClick={onGenerate}
                className="gap-2"
            >
                {generating ? (
                    <Loader2 size={15} className="animate-spin" />
                ) : (
                    <Sparkles size={15} />
                )}
                {generating ? 'Generando preguntas...' : 'Generar preguntas'}
            </Button>
        </div>
    );
}

function SubjectField({
    form,
    subjects,
    onUpdate,
}: {
    form: FormData;
    subjects: string[];
    onUpdate: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
    if (subjects.length === 0) {
        return (
            <div className="flex flex-col gap-1.5">
                <label htmlFor="ai-subject" className="text-ink text-[13px] font-bold">
                    Materia
                </label>
                <Input
                    id="ai-subject"
                    placeholder="Ej: Matemáticas, Biología..."
                    value={form.subject}
                    onChange={(e) => onUpdate('subject', e.target.value)}
                    className="border-border h-10 rounded-[10px] bg-white"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor="ai-subject" className="text-ink text-[13px] font-bold">
                Materia
            </label>
            <div className="flex gap-2">
                <Select
                    value={subjects.includes(form.subject) ? form.subject : undefined}
                    onValueChange={(v) => onUpdate('subject', v)}
                >
                    <SelectTrigger
                        id="ai-subject"
                        className="border-border h-10 w-full rounded-[10px] bg-white"
                    >
                        <SelectValue placeholder="Seleccioná o escribí..." />
                    </SelectTrigger>
                    <SelectContent>
                        {subjects.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    id="ai-subject-custom"
                    placeholder="O escribir..."
                    value={subjects.includes(form.subject) ? '' : form.subject}
                    onChange={(e) => onUpdate('subject', e.target.value)}
                    className="border-border h-10 w-[200px] rounded-[10px] bg-white"
                />
            </div>
        </div>
    );
}

function NumberField({
    id,
    label,
    value,
    min,
    max,
    onChange,
    hint,
    className,
}: {
    id: string;
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
    hint?: string;
    className?: string;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-ink text-[13px] font-bold">
                {label}
            </label>
            <Input
                id={id}
                type="number"
                min={min}
                max={max}
                value={String(value)}
                onChange={(e) =>
                    onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))
                }
                className={cn(
                    'border-border h-10 rounded-[10px] bg-white text-center font-bold',
                    className,
                )}
            />
            {hint && <p className="text-mute text-[10px]">{hint}</p>}
        </div>
    );
}

function PreviewSection({
    result,
    onBack,
}: {
    result: { ok: GeneratedQuestion[]; errors: string[] };
    onBack: () => void;
}) {
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-sm">
                <span className="text-success flex items-center gap-1 font-medium">
                    <CheckCircle size={14} />
                    {result.ok.length} pregunta
                    {result.ok.length !== 1 ? 's' : ''} generada
                    {result.ok.length !== 1 ? 's' : ''}
                </span>
                {result.errors.length > 0 && (
                    <span className="text-destructive flex items-center gap-1 font-medium">
                        <XCircle size={14} />
                        {result.errors.length} error
                        {result.errors.length !== 1 ? 'es' : ''}
                    </span>
                )}
            </div>

            {result.errors.length > 0 && (
                <div className="bg-destructive/5 border-destructive/20 space-y-1 rounded-lg border px-3 py-2.5">
                    {result.errors.map((err) => (
                        <p key={err} className="text-destructive text-[12.5px]">
                            {err}
                        </p>
                    ))}
                </div>
            )}

            {result.ok.length > 0 && (
                <div className="border-border overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-border border-b">
                                <th className="px-3 py-2 text-left text-xs font-semibold">#</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold">
                                    Pregunta
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-semibold">Tipo</th>
                                <th className="px-3 py-2 text-center text-xs font-semibold">
                                    Ptos
                                </th>
                                <th className="px-3 py-2 text-center text-xs font-semibold">Ops</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.ok.map((q, i) => (
                                <PreviewRow key={q.text} question={q} index={i} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
                ← Cambiar parámetros
            </Button>
        </div>
    );
}

function PreviewRow({ question, index }: { question: GeneratedQuestion; index: number }) {
    const correctCount = question.options.filter((o) => o.isCorrect).length;

    return (
        <tr className="border-border border-b last:border-0">
            <td className="text-muted-foreground px-3 py-2 text-xs">{index + 1}</td>
            <td className="px-3 py-2">
                <span className="line-clamp-2 text-[12.5px]" title={question.text}>
                    {question.text}
                </span>
            </td>
            <td className="px-3 py-2">
                <span
                    className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold',
                        question.questionType === 'MULTIPLE'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700',
                    )}
                >
                    {question.questionType === 'MULTIPLE' ? 'Múltiple' : 'Única'}
                </span>
            </td>
            <td className="text-muted-foreground px-3 py-2 text-center text-xs">
                {question.points}
            </td>
            <td className="text-muted-foreground px-3 py-2 text-center text-xs">
                {question.options.length} <span className="text-success">({correctCount}✓)</span>
            </td>
        </tr>
    );
}

export function GenerateQuestionsDialog({ slug, examId, open, onOpenChange, subjects }: Props) {
    const router = useRouter();
    const [form, setForm] = useState<FormData>(defaultForm());
    const [generating, setGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [result, setResult] = useState<{
        ok: GeneratedQuestion[];
        errors: string[];
    } | null>(null);
    const [isPending, startTransition] = useTransition();

    function reset(): void {
        setForm(defaultForm());
        setGenerationError(null);
        setResult(null);
    }

    function handleClose(): void {
        onOpenChange(false);
        reset();
    }

    function update<K extends keyof FormData>(key: K, value: FormData[K]): void {
        setForm((prev) => {
            const next = { ...prev, [key]: value };
            if (key === 'correctAnswers') {
                next.correctAnswers = Math.min(value as number, next.optionsPerQuestion);
                if ((value as number) > 1 && next.optionsPerQuestion < 3) {
                    next.optionsPerQuestion = 3;
                }
            }
            if (key === 'optionsPerQuestion') {
                next.correctAnswers = Math.min(next.correctAnswers, value as number);
            }
            return next;
        });
    }

    async function handleGenerate(): Promise<void> {
        if (!form.subject.trim() || !form.topic.trim()) return;

        setGenerating(true);
        setGenerationError(null);
        setResult(null);

        try {
            const res = await fetch('/api/ai/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, slug }),
            });

            const data = await res.json();

            if (!res.ok) {
                setGenerationError(data.error ?? 'Error al generar preguntas.');
                return;
            }

            setResult(data as { ok: GeneratedQuestion[]; errors: string[] });
        } catch {
            setGenerationError('Error de conexión. Intenta de nuevo.');
        } finally {
            setGenerating(false);
        }
    }

    function handleImport(): void {
        if (!result || result.ok.length === 0) return;
        startTransition(async () => {
            try {
                const questions = result.ok.map((q, i) => ({
                    text: q.text,
                    points: q.points,
                    order: i,
                    questionType: q.questionType,
                    options: q.options.map((o) => ({
                        text: o.text,
                        isCorrect: o.isCorrect,
                    })),
                }));
                const { count } = await importQuestions(slug, examId, questions);
                toast.success(
                    `${count} pregunta${count !== 1 ? 's' : ''} generada${count !== 1 ? 's' : ''} con IA`,
                );
                handleClose();
                router.refresh();
            } catch {
                toast.error('Error al importar las preguntas generadas.');
            }
        });
    }

    const canGenerate =
        form.subject.trim().length > 0 &&
        form.topic.trim().length > 0 &&
        form.questionCount >= 1 &&
        form.optionsPerQuestion >= 2 &&
        form.correctAnswers >= 1;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="border-border flex max-h-[85vh] flex-col sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles size={18} className="text-primary" />
                        Generar preguntas con IA
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Configura los parámetros y genera preguntas con IA
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 space-y-4 overflow-y-auto">
                    {!result ? (
                        <ConfigurationForm
                            form={form}
                            subjects={subjects}
                            generating={generating}
                            generationError={generationError}
                            canGenerate={canGenerate}
                            onUpdate={update}
                            onGenerate={handleGenerate}
                        />
                    ) : (
                        <PreviewSection result={result} onBack={() => setResult(null)} />
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={handleClose}
                        disabled={isPending}
                    >
                        Cancelar
                    </Button>
                    {result && result.ok.length > 0 && (
                        <Button
                            variant="ink"
                            className="gap-2"
                            disabled={isPending}
                            onClick={handleImport}
                        >
                            {isPending && <Loader2 className="animate-spin" />}
                            <Sparkles size={15} />
                            Agregar {result.ok.length} pregunta
                            {result.ok.length !== 1 ? 's' : ''}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
