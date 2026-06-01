'use client';

import {
    createExam,
    deleteExam,
    toggleExamActive,
    updateExam,
} from '@/features/exams/actions/mutations';
import { toast } from 'sonner';
import { examSchema } from '@/features/exams/schemas/exam.schemas';
import { generateExcelTemplate, generateMarkdownTemplate } from '@/features/exams/lib/templates';
import dynamic from 'next/dynamic';

const ImportQuestionsDialog = dynamic(
    () => import('@/features/exams/components/ImportQuestionsDialog').then((m) => m.ImportQuestionsDialog),
    { ssr: false }
);
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
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
import { Tag } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { Exam, Group } from '@prisma/client';
import {
    BookOpen,
    Calendar,
    Edit2,
    FileSpreadsheet,
    FileText,
    LayoutTemplate,
    Loader2,
    MoreHorizontal,
    Plus,
    Power,
    Search,
    Settings,
    Trash2,
    Upload,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

interface ExamWithCount extends Exam {
    groups: Group[];
    _count: { questions: number; results: number };
}

interface FormState {
    title: string;
    timeLimit: string;
    groupIds: string[];
    active: boolean;
    antiCheatEnabled: boolean;
    lockTabSwitch: boolean;
    randomizeQuestions: boolean;
    maxGrade: string;
    passingGrade: string;
    passingPercentage: string;
}

const emptyForm: FormState = {
    title: '',
    timeLimit: '30',
    groupIds: [],
    active: false,
    antiCheatEnabled: false,
    lockTabSwitch: false,
    randomizeQuestions: false,
    maxGrade: '7',
    passingGrade: '4',
    passingPercentage: '60',
};

type TabMode = 'libre' | 'antitrampa' | 'total';

const TAB_MODES: { value: TabMode; label: string; desc: string }[] = [
    { value: 'libre', label: 'Libre', desc: 'El alumno puede cambiar de pestaña sin restricciones.' },
    { value: 'antitrampa', label: 'Anti-trampa', desc: '3 salidas permitidas, a la 3ª el examen se envía.' },
    { value: 'total', label: 'Restricción total', desc: 'Cualquier salida envía el examen automáticamente.' },
];

function getTabMode(antiCheatEnabled: boolean, lockTabSwitch: boolean): TabMode {
    if (!antiCheatEnabled) return 'libre';
    return lockTabSwitch ? 'total' : 'antitrampa';
}

function tabModeToFlags(mode: TabMode): Pick<FormState, 'antiCheatEnabled' | 'lockTabSwitch'> {
    if (mode === 'total') return { antiCheatEnabled: true, lockTabSwitch: true };
    if (mode === 'antitrampa') return { antiCheatEnabled: true, lockTabSwitch: false };
    return { antiCheatEnabled: false, lockTabSwitch: false };
}

type TabFilter = 'todos' | 'en-curso' | 'programados' | 'corregidos' | 'borradores';

const tabLabels: { id: TabFilter; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'en-curso', label: 'En curso' },
    { id: 'programados', label: 'Programados' },
    { id: 'corregidos', label: 'Corregidos' },
    { id: 'borradores', label: 'Borradores' },
];

const EN_CURSO_ACCENT_COLORS = [
    'bg-blue-400',
    'bg-rose-400',
    'bg-violet-500',
    'bg-cyan-500',
    'bg-orange-400',
    'bg-indigo-400',
    'bg-teal-400',
    'bg-pink-400',
];

function deriveExamStatus(exam: ExamWithCount): Exclude<TabFilter, 'todos'> {
    const now = new Date();
    if (exam.closesAt && new Date(exam.closesAt) < now) return 'corregidos';
    if (exam.active) return 'en-curso';
    if (exam.scheduledAt && new Date(exam.scheduledAt) > now) return 'programados';
    return 'borradores';
}

function getAccentColor(exam: ExamWithCount): string {
    const status = deriveExamStatus(exam);
    if (status === 'borradores') return 'bg-gray-200';
    if (status === 'corregidos') return 'bg-emerald-500';
    if (status === 'programados') return 'bg-amber-400';
    const charSum = exam.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return EN_CURSO_ACCENT_COLORS[charSum % EN_CURSO_ACCENT_COLORS.length] ?? 'bg-blue-400';
}

const STATUS_BADGE_CONFIG: Record<
    Exclude<TabFilter, 'todos'>,
    { tone: 'success' | 'primary' | 'warning' | 'default'; label: string }
> = {
    'en-curso': { tone: 'primary', label: 'En curso' },
    'programados': { tone: 'warning', label: 'Programado' },
    'corregidos': { tone: 'success', label: 'Corregido' },
    'borradores': { tone: 'default', label: 'Borrador' },
};

function formatExamDate(exam: ExamWithCount): string {
    const status = deriveExamStatus(exam);
    if (status === 'borradores') return 'Sin programar';
    const date = exam.closesAt ?? exam.scheduledAt;
    if (!date) return 'Sin programar';
    const d = new Date(date);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (Math.abs(diffMs) < 1000 * 60 * 60 * 12) {
        return `Hoy ${d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays === -1) return 'Ayer';
    if (diffDays < -1 && diffDays >= -6) return `${Math.abs(diffDays)} días`;
    if (diffDays === 1) return 'Mañana';
    return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' });
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex UI component with multiple dialogs
export function ExamsClient({ exams, groups }: { exams: ExamWithCount[]; groups: Group[] }): React.JSX.Element {
    const router = useRouter();
    const { slug } = useParams<{ slug: string }>();
    const [tab, setTab] = useState<TabFilter>('todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isDelOpen, setIsDelOpen] = useState(false);
    const [editing, setEditing] = useState<ExamWithCount | null>(null);
    const [toDelete, setToDelete] = useState<ExamWithCount | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'general', string>>>({});
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [importExamId, setImportExamId] = useState<string | null>(null);

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
            antiCheatEnabled: exam.antiCheatEnabled,
            lockTabSwitch: exam.lockTabSwitch,
            randomizeQuestions: exam.randomizeQuestions,
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
        // Misma fuente de verdad que el servidor: validar con el schema Zod.
        const parsed = examSchema.safeParse(form);
        if (parsed.success) {
            setErrors({});
            return true;
        }
        const next: Partial<Record<keyof FormState, string>> = {};
        for (const issue of parsed.error.issues) {
            const key = issue.path[0] as keyof FormState | undefined;
            if (key && !next[key]) next[key] = issue.message;
        }
        setErrors(next);
        return false;
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
                if (editing) await updateExam(slug, editing.id, data);
                else await createExam(slug, data);
                setIsOpen(false);
                toast.success(editing ? 'Examen actualizado' : 'Examen creado');
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
                await deleteExam(slug, toDelete.id);
                setIsDelOpen(false);
                toast.success('Examen eliminado');
                router.refresh();
            } catch {
                setDeleteError('Ocurrió un error al eliminar. Intentá de nuevo.');
            }
        });
    };

    const handleTogglePublish = (exam: { id: string; active: boolean }): void => {
        startTransition(async () => {
            const result = await toggleExamActive(slug, exam.id, !exam.active);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success(exam.active ? 'Examen despublicado' : 'Examen publicado');
            router.refresh();
        });
    };

    const counts: Record<TabFilter, number> = {
        todos: exams.length,
        'en-curso': exams.filter((e) => deriveExamStatus(e) === 'en-curso').length,
        programados: exams.filter((e) => deriveExamStatus(e) === 'programados').length,
        corregidos: exams.filter((e) => deriveExamStatus(e) === 'corregidos').length,
        borradores: exams.filter((e) => deriveExamStatus(e) === 'borradores').length,
    };

    const statsSubtitle = [
        `${exams.length} totales`,
        counts['en-curso'] > 0 && `${counts['en-curso']} en curso`,
        counts.programados > 0 && `${counts.programados} programados`,
        counts.borradores > 0 && `${counts.borradores} borradores`,
    ]
        .filter(Boolean)
        .join(' · ');

    const filtered = exams.filter((e) => {
        const matchesTab = tab === 'todos' || deriveExamStatus(e) === tab;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            !q ||
            e.title.toLowerCase().includes(q) ||
            (e.subject?.toLowerCase().includes(q) ?? false);
        return matchesTab && matchesSearch;
    });

    return (
        <div className="flex flex-col min-h-screen bg-paper">
            {/* Header */}
            <AdminTopBar
                breadcrumb={['Institución', 'Exámenes']}
                title="Exámenes"
                subtitle={statsSubtitle || undefined}
                actions={
                    <>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="md" className="gap-2">
                                    <LayoutTemplate size={16} />
                                    Plantillas
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="rounded-xl border-border shadow-xl w-52"
                            >
                                <DropdownMenuItem
                                    onClick={() => generateExcelTemplate()}
                                    className="gap-2 py-2.5 cursor-pointer"
                                >
                                    <FileSpreadsheet size={14} />
                                    Descargar Excel (.xlsx)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => generateMarkdownTemplate()}
                                    className="gap-2 py-2.5 cursor-pointer"
                                >
                                    <FileText size={14} />
                                    Descargar Markdown (.md)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ink" size="md" onClick={openCreate} className="gap-2">
                            <Plus size={16} />
                            Nuevo examen
                        </Button>
                    </>
                }
            />

            {/* Filter + Search bar */}
            <div className="flex items-center justify-between border-b border-border bg-white px-8 py-3 gap-4">
                <div className="flex items-center gap-1">
                    {tabLabels.map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setTab(id)}
                            className={cn(
                                'px-4 py-1.5 rounded-full text-[13px] font-medium transition-all whitespace-nowrap',
                                tab === id
                                    ? 'bg-ink text-white'
                                    : 'text-ink-dim hover:bg-paper-warm',
                            )}
                        >
                            {label} · {counts[id]}
                        </button>
                    ))}
                </div>
                <div className="relative shrink-0">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-mute pointer-events-none"
                    />
                    <Input
                        placeholder="Buscar examen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 w-52 rounded-full bg-paper text-[13px] border-border"
                    />
                </div>
            </div>

            {/* List */}
            <main className="flex-1 p-8 overflow-auto">
                {filtered.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <BookOpen size={48} className="mb-4 text-mute/20" />
                        <p className="text-lg font-medium text-ink">
                            {tab === 'todos' && !searchQuery
                                ? 'Todavía no hay exámenes'
                                : "Sin resultados"}
                        </p>
                        {tab === 'todos' && !searchQuery && (
                            <>
                                <p className="mt-1 text-sm text-mute">
                                    Creá el primero y luego añadile preguntas.
                                </p>
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={openCreate}
                                    className="mt-6"
                                >
                                    <Plus size={16} />
                                    Crear examen
                                </Button>
                            </>
                        )}
                    </Card>
                ) : (
                    <div className="flex flex-col gap-2">
                        {filtered.map((exam) => {
                            const status = deriveExamStatus(exam);
                            const { tone, label: statusLabel } = STATUS_BADGE_CONFIG[status];
                            const accentColor = getAccentColor(exam);
                            const examTitle = exam.subject
                                ? `${exam.subject} · ${exam.title}`
                                : exam.title;
                            const groupNames =
                                exam.groups.length > 0
                                    ? exam.groups.map((g) => g.name).join(', ')
                                    : '—';
                            const dateText = formatExamDate(exam);
                            const showResults =
                                status === 'en-curso' || status === 'corregidos';

                            return (
                                <div
                                    key={exam.id}
                                    className="group flex items-stretch overflow-hidden rounded-xl border border-border bg-white shadow-sm hover:shadow-md transition-shadow"
                                >
                                    {/* Accent bar */}
                                    <div className={cn('w-[4px] shrink-0', accentColor)} />

                                    {/* Content */}
                                    <div className="flex flex-1 items-center gap-4 px-6 py-4 min-w-0">
                                        {/* Title + Groups */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[15px] font-semibold text-ink truncate leading-snug">
                                                {examTitle}
                                            </p>
                                            <p className="text-[12px] text-mute mt-0.5 truncate">
                                                Grupos · {groupNames}
                                            </p>
                                        </div>

                                        {/* Status badge */}
                                        <div className="w-[110px] flex justify-center shrink-0">
                                            <Tag tone={tone} size="md">
                                                {statusLabel}
                                            </Tag>
                                        </div>

                                        {/* Question count */}
                                        <div className="w-[72px] flex items-center gap-1.5 text-[13px] text-ink-dim shrink-0">
                                            <FileText size={14} className="text-mute/60 shrink-0" />
                                            <span>{exam._count.questions} q.</span>
                                        </div>

                                        {/* Participation */}
                                        <div className="w-[56px] flex items-center gap-1.5 text-[13px] text-ink-dim shrink-0">
                                            <Users size={14} className="text-mute/60 shrink-0" />
                                            <span>
                                                {showResults ? exam._count.results : '—'}
                                            </span>
                                        </div>

                                        {/* Date */}
                                        <div className="w-[112px] flex items-center gap-1.5 text-[13px] text-ink-dim shrink-0">
                                            <Calendar size={14} className="text-mute/60 shrink-0" />
                                            <span className="truncate">{dateText}</span>
                                        </div>

                                        {/* Three-dot menu */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <MoreHorizontal size={16} className="text-mute" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="rounded-xl border-border shadow-xl w-48"
                                            >
                                                <DropdownMenuItem
                                                    asChild
                                                    className="gap-2 py-2.5 cursor-pointer"
                                                >
                                                    <Link href={`/${slug}/exams/${exam.id}/edit`}>
                                                        <Settings size={14} />
                                                        Editar contenido
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setImportExamId(exam.id)}
                                                    className="gap-2 py-2.5 cursor-pointer"
                                                >
                                                    <Upload size={14} />
                                                    Importar preguntas
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => openEdit(exam)}
                                                    className="gap-2 py-2.5 cursor-pointer"
                                                >
                                                    <Edit2 size={14} />
                                                    Ajustes de examen
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleTogglePublish(exam)}
                                                    className="gap-2 py-2.5 cursor-pointer"
                                                >
                                                    <Power size={14} />
                                                    {exam.active ? 'Despublicar' : 'Publicar'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => openDelete(exam)}
                                                    className="text-destructive gap-2 py-2.5 cursor-pointer focus:bg-danger-wash focus:text-destructive"
                                                >
                                                    <Trash2 size={14} />
                                                    Eliminar evaluación
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Create/Edit dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg rounded-[22px] border-border shadow-2xl overflow-hidden p-0">
                    <div className="px-6 py-5 border-b border-border bg-paper">
                        <DialogTitle className="font-display text-2xl text-ink">
                            {editing ? 'Ajustes del examen' : 'Nuevo examen'}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Formulario para crear o configurar un examen.</DialogDescription>
                    </div>

                    <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                        {errors.general && (
                            <p className="rounded-[10px] bg-danger-wash px-4 py-3 text-sm text-destructive font-bold border border-destructive/10">
                                {errors.general}
                            </p>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="exam-form-title" className="text-[13px] font-bold text-ink">
                                Título del examen
                            </label>
                            <Input
                                id="exam-form-title"
                                placeholder="Ej: Matemáticas — Unidad 3"
                                value={form.title}
                                onChange={(e) => setField('title', e.target.value)}
                                className={cn(
                                    'h-11 rounded-[10px] bg-white border-border',
                                    errors.title && 'border-destructive',
                                )}
                                autoFocus
                            />
                            {errors.title && (
                                <p className="text-xs text-destructive font-medium">{errors.title}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="exam-form-timelimit" className="text-[13px] font-bold text-ink">
                                Tiempo límite
                            </label>
                            <div className="relative w-1/2">
                                <Input
                                    id="exam-form-timelimit"
                                    type="number"
                                    min={1}
                                    max={180}
                                    value={form.timeLimit}
                                    onChange={(e) => setField('timeLimit', e.target.value)}
                                    className={cn(
                                        'h-11 rounded-[10px] bg-white border-border pr-12',
                                        errors.timeLimit && 'border-destructive',
                                    )}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-mute uppercase">
                                    MIN
                                </span>
                            </div>
                            {errors.timeLimit && (
                                <p className="text-xs text-destructive font-medium">{errors.timeLimit}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-[13px] font-bold text-ink">Vigilancia del examen</span>
                            <div className="rounded-[10px] border border-border overflow-hidden divide-y divide-border">
                                {TAB_MODES.map((mode) => {
                                    const active = getTabMode(form.antiCheatEnabled, form.lockTabSwitch) === mode.value;
                                    return (
                                        <button
                                            key={mode.value}
                                            type="button"
                                            onClick={() => {
                                                const flags = tabModeToFlags(mode.value);
                                                setForm((f) => ({ ...f, ...flags }));
                                            }}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                                                active ? 'bg-primary-wash/40' : 'bg-white hover:bg-paper-warm/50',
                                            )}
                                        >
                                            <div className={cn(
                                                'h-3.5 w-3.5 shrink-0 rounded-full border-2 transition-colors',
                                                active ? 'border-primary bg-primary' : 'border-border bg-white',
                                            )} />
                                            <div className="min-w-0">
                                                <p className={cn('text-[12px] font-bold', active ? 'text-primary' : 'text-ink')}>
                                                    {mode.label}
                                                </p>
                                                <p className="text-[11px] text-mute leading-snug">{mode.desc}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-[13px] font-bold text-ink">Aleatorización</span>
                            <div
                                className={cn(
                                    'flex items-center justify-between px-4 py-3 rounded-[10px] border border-border bg-paper-warm/30 transition-colors gap-4',
                                    form.randomizeQuestions && 'bg-primary-wash/30 border-primary/20',
                                )}
                            >
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="text-[12px] font-bold text-ink-dim">Aleatorizar preguntas</span>
                                    <span className="text-[11px] text-mute leading-snug">Cada estudiante verá las preguntas en un orden distinto.</span>
                                </div>
                                <Switch
                                    checked={form.randomizeQuestions}
                                    onCheckedChange={(v) => setField('randomizeQuestions', v)}
                                    className="data-[state=checked]:bg-primary shrink-0"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-[13px] font-bold text-ink">Grupos asignados</span>
                            <div
                                className={cn(
                                    'max-h-[160px] overflow-y-auto rounded-[12px] border border-border bg-paper-warm/20 p-2',
                                    errors.groupIds && 'border-destructive',
                                )}
                            >
                                {groups.length === 0 ? (
                                    <p className="px-3 py-4 text-center text-[13px] text-mute">
                                        No hay grupos creados
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-1">
                                        {groups.map((g) => (
                                            <label
                                                key={g.id}
                                                className="flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5 transition-colors hover:bg-white"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={form.groupIds.includes(g.id)}
                                                    onChange={() => toggleGroup(g.id)}
                                                    className="accent-primary h-4 w-4 rounded border-border"
                                                />
                                                <span className="text-[13.5px] font-medium text-ink">
                                                    {g.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {errors.groupIds && (
                                <p className="text-xs text-destructive font-medium">{errors.groupIds}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 p-5 rounded-[14px] bg-paper border border-border">
                            <span className="text-[13px] font-bold text-ink">Escala de evaluación</span>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="exam-grade-max" className="text-[11px] font-bold text-mute uppercase">
                                        Máxima
                                    </label>
                                    <Input
                                        id="exam-grade-max"
                                        type="number"
                                        step={0.1}
                                        value={form.maxGrade}
                                        onChange={(e) => setField('maxGrade', e.target.value)}
                                        className="h-10 rounded-[8px] text-center font-bold"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="exam-grade-pass" className="text-[11px] font-bold text-mute uppercase">
                                        Aprobación
                                    </label>
                                    <Input
                                        id="exam-grade-pass"
                                        type="number"
                                        step={0.1}
                                        value={form.passingGrade}
                                        onChange={(e) => setField('passingGrade', e.target.value)}
                                        className="h-10 rounded-[8px] text-center font-bold"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="exam-grade-pct" className="text-[11px] font-bold text-mute uppercase">
                                        % Exigencia
                                    </label>
                                    <Input
                                        id="exam-grade-pct"
                                        type="number"
                                        value={form.passingPercentage}
                                        onChange={(e) => setField('passingPercentage', e.target.value)}
                                        className="h-10 rounded-[8px] text-center font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-border flex justify-end gap-2 bg-white">
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
                            disabled={isPending}
                            onClick={handleSave}
                            className="min-w-[140px]"
                        >
                            {isPending && <Loader2 className="animate-spin mr-2" />}
                            {editing ? 'Guardar cambios' : 'Crear examen'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Import questions dialog */}
            <ImportQuestionsDialog
                slug={slug}
                examId={importExamId ?? ''}
                open={!!importExamId}
                onOpenChange={(o) => !o && setImportExamId(null)}
            />

            {/* Delete dialog */}
            <Dialog open={isDelOpen} onOpenChange={setIsDelOpen}>
                <DialogContent className="sm:max-w-sm rounded-[22px] border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl text-destructive">
                            Eliminar examen
                        </DialogTitle>
                        <DialogDescription className="sr-only">Confirmación para eliminar el examen.</DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-[14px] leading-relaxed text-ink-dim">
                            ¿Estás seguro de eliminar{' '}
                            <strong className="text-ink">&ldquo;{toDelete?.title}&rdquo;</strong>? Esta
                            acción es irreversible.
                        </p>
                    </div>
                    {deleteError && (
                        <p className="bg-danger-wash text-destructive rounded-[10px] px-4 py-2 text-sm font-medium">
                            {deleteError}
                        </p>
                    )}
                    <DialogFooter className="gap-2 sm:justify-end mt-2">
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
                            onClick={handleDelete}
                        >
                            {isPending && <Loader2 className="animate-spin mr-2" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
