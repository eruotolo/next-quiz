'use client';

import {
    createExam,
    deleteExam,
    toggleExamActive,
    updateExam,
} from '@/features/exams/actions/mutations';
import { toast } from 'sonner';
import { examSchema } from '@/features/exams/schemas/exam.schemas';
import {
    ExamAcademicPicker,
    NO_COURSE,
    NO_PERIOD,
    NO_PROGRAM,
    type CourseOption,
} from '@/features/exams/components/ExamAcademicPicker';
import { generateExcelTemplate, generateMarkdownTemplate } from '@/features/exams/lib/templates';
import dynamic from 'next/dynamic';

const ImportQuestionsDialog = dynamic(
    () =>
        import('@/features/exams/components/ImportQuestionsDialog').then(
            (m) => m.ImportQuestionsDialog,
        ),
    { ssr: false },
);
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
import { Input } from '@/shared/components/ui/input';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Switch } from '@/shared/components/ui/switch';
import { TablePaginator } from '@/shared/components/ui/table-paginator';
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
import { useState, useTransition, useMemo } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

interface ExamWithCount extends Exam {
    groups: Group[];
    courseSection: {
        id: string;
        name: string;
        programId: string | null;
        periodId: string;
    } | null;
    _count: { questions: number; results: number };
    avgGrade: number | null;
    passRate: number | null;
    totalStudents: number;
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

    programId: string;
    periodId: string;
    courseSectionId: string;
    scheduledAt: string;
    closesAt: string;
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

    programId: NO_PROGRAM,
    periodId: NO_PERIOD,
    courseSectionId: NO_COURSE,
    scheduledAt: '',
    closesAt: '',
};

// Date -> valor para <input type="datetime-local"> (hora local "YYYY-MM-DDTHH:mm").
function toDatetimeLocal(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const pad = (n: number): string => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type TabMode = 'libre' | 'antitrampa' | 'total';

const TAB_MODES: { value: TabMode; label: string; desc: string }[] = [
    {
        value: 'libre',
        label: 'Libre',
        desc: 'El alumno puede cambiar de pestaña sin restricciones.',
    },
    {
        value: 'antitrampa',
        label: 'Anti-trampa',
        desc: '3 salidas permitidas, a la 3ª el examen se envía.',
    },
    {
        value: 'total',
        label: 'Restricción total',
        desc: 'Cualquier salida envía el examen automáticamente.',
    },
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
    // Only treat a passed closesAt as "corregido" when the exam was actually published
    // or already has results; unpublished drafts with an expired window stay as borradores.
    const hasClosed = !!(exam.closesAt && new Date(exam.closesAt) < now);
    if (hasClosed && (exam.active || exam._count.results > 0)) return 'corregidos';
    if (exam.scheduledAt && new Date(exam.scheduledAt) > now) return 'programados';
    if (exam.active) return 'en-curso';
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
    programados: { tone: 'warning', label: 'Programado' },
    corregidos: { tone: 'success', label: 'Corregido' },
    borradores: { tone: 'default', label: 'Borrador' },
};

function formatCountdown(target: Date | string | null): string {
    if (!target) return 'Sin fecha';
    const now = new Date();
    const t = new Date(target);
    const diffMs = t.getTime() - now.getTime();
    if (diffMs <= 0) return 'Próximamente';
    const totalMin = Math.floor(diffMs / 60000);
    const totalH = Math.floor(totalMin / 60);
    const days = Math.floor(totalH / 24);
    const remH = totalH % 24;
    if (days >= 1) return `${days}d ${remH}h`;
    if (totalH >= 1) return `${totalH}h ${totalMin % 60}m`;
    return `${totalMin}m`;
}

function formatExamDate(exam: ExamWithCount): string {
    const status = deriveExamStatus(exam);
    if (status === 'borradores') return 'Sin publicar';
    if (status === 'programados') return `Abre en ${formatCountdown(exam.scheduledAt)}`;
    if (status === 'corregidos') {
        const d = exam.closesAt ?? exam.scheduledAt;
        if (!d) return '—';
        return new Date(d).toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    }
    // en-curso
    const date = exam.closesAt ?? exam.scheduledAt;
    if (!date) return 'Sin cierre';
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

function getParticipantsText(exam: ExamWithCount, status: Exclude<TabFilter, 'todos'>): string {
    if (status === 'en-curso') {
        return exam.totalStudents > 0
            ? `${exam._count.results}/${exam.totalStudents}`
            : `${exam._count.results}`;
    }
    if (status === 'corregidos') return `${exam._count.results}`;
    return '—';
}

function getInfoText(exam: ExamWithCount, status: Exclude<TabFilter, 'todos'>): string {
    if (status === 'corregidos' && exam.avgGrade !== null) {
        return `Prom. ${exam.avgGrade.toFixed(1)}${exam.passRate !== null ? ` · ${exam.passRate}% apr.` : ''}`;
    }
    return formatExamDate(exam);
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex UI component with multiple dialogs
export function ExamsClient({
    exams,
    groups,
    courseSections,
    isProfesor: _isProfesor,
    isDemo,
}: {
    exams: ExamWithCount[];
    groups: Group[];
    courseSections: CourseOption[];
    isProfesor: boolean;
    isDemo?: boolean;
}) {
    const router = useRouter();
    const { slug } = useParams<{ slug: string }>();
    const [tab, setTab] = useState<TabFilter>('todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [courseFilter, setCourseFilter] = useState<string>('all');
    const [groupFilter, setGroupFilter] = useState<string>('all');
    const [isOpen, setIsOpen] = useState(false);
    const [isDelOpen, setIsDelOpen] = useState(false);
    const [isToggleOpen, setIsToggleOpen] = useState(false);
    const [editing, setEditing] = useState<ExamWithCount | null>(null);
    const [toDelete, setToDelete] = useState<ExamWithCount | null>(null);
    const [toToggle, setToToggle] = useState<ExamWithCount | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'general', string>>>({});
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [importExamId, setImportExamId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    const filteredGroups = useMemo(() => {
        // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: multiple interdependent filter conditions
        return groups.filter((g) => {
            if (form.programId !== NO_PROGRAM && g.programId !== form.programId) return false;
            if (form.periodId !== NO_PERIOD && g.periodId !== form.periodId) return false;
            if (form.courseSectionId !== NO_COURSE) {
                const course = courseSections.find((c) => c.id === form.courseSectionId);
                // N:M: si la materia tiene grupos asignados, FILTRAMOS para mostrar
                // solo los grupos donde está (más los grupos ya seleccionados).
                if (course?.groups.length) {
                    const allowed = new Set([
                        ...course.groups.map((cg) => cg.id),
                        ...form.groupIds,
                    ]);
                    return allowed.has(g.id);
                }
            }
            return true;
        });
    }, [groups, form.programId, form.periodId, form.courseSectionId, form.groupIds, courseSections]);

    const setField = <K extends keyof FormState>(field: K, value: FormState[K]): void => {
        setForm((f) => ({ ...f, [field]: value }));
        setErrors((e) => ({ ...e, [field]: undefined }));
    };

    const toggleGroup = (id: string): void => {
        if (isDemo) return;
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

            programId: exam.courseSection?.programId ?? NO_PROGRAM,
            periodId: exam.courseSection?.periodId ?? NO_PERIOD,
            courseSectionId: exam.courseSection?.id ?? NO_COURSE,
            scheduledAt: toDatetimeLocal(exam.scheduledAt),
            closesAt: toDatetimeLocal(exam.closesAt),
        });
        setErrors({});
        setIsOpen(true);
    };

    const openDelete = (exam: ExamWithCount): void => {
        setToDelete(exam);
        setDeleteError(null);
        setIsDelOpen(true);
    };

    const openToggle = (exam: ExamWithCount): void => {
        setToToggle(exam);
        setIsToggleOpen(true);
    };

    const validate = (): boolean => {
        // Misma fuente de verdad que el servidor: validar con el schema Zod.
        // Normalizamos el sentinel de "sin asignatura" a null antes de validar.
        const formForValidation = {
            ...form,
            courseSectionId: form.courseSectionId === NO_COURSE ? null : form.courseSectionId,
        };
        const parsed = examSchema.safeParse(formForValidation);
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
                // Convert datetime-local strings (local browser time) to UTC ISO before
                // sending to the server, which always runs in UTC and would otherwise
                // misinterpret the naive string as UTC instead of the user's local time.
                const toUTC = (v: string): string => (v ? new Date(v).toISOString() : '');
                const data = {
                    ...form,
                    timeLimit: Number(form.timeLimit),
                    maxGrade: Number(form.maxGrade),
                    passingGrade: Number(form.passingGrade),
                    passingPercentage: Number(form.passingPercentage),
                    courseSectionId:
                        form.courseSectionId === NO_COURSE ? null : form.courseSectionId,
                    scheduledAt: toUTC(form.scheduledAt),
                    closesAt: toUTC(form.closesAt),
                };
                if (editing) await updateExam(slug, editing.id, data);
                else await createExam(slug, data);
                setIsOpen(false);
                toast.success(editing ? 'Examen actualizado' : 'Examen creado');
                router.refresh();
            } catch {
                setErrors({ general: 'Ocurrió un error. Intenta de nuevo.' });
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
                setDeleteError('Ocurrió un error al eliminar. Intenta de nuevo.');
            }
        });
    };

    const handleTogglePublish = (): void => {
        if (!toToggle) return;
        startTransition(async () => {
            const result = await toggleExamActive(slug, toToggle.id, !toToggle.active);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success(toToggle.active ? 'Examen despublicado' : 'Examen publicado');
            setIsToggleOpen(false);
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

    const filtered = exams.filter((e) => {
        const matchesTab = tab === 'todos' || deriveExamStatus(e) === tab;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            !q ||
            e.title.toLowerCase().includes(q) ||
            (e.subject?.toLowerCase().includes(q) ?? false);
        const matchesCourse = courseFilter === 'all' || e.courseSection?.id === courseFilter;
        const matchesGroup = groupFilter === 'all' || e.groups.some((g) => g.id === groupFilter);
        return matchesTab && matchesSearch && matchesCourse && matchesGroup;
    });

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const pagedExams = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <>
            {/* Filter + Search bar */}
            <div className="border-border flex items-center justify-between gap-4 border-b bg-white px-8 py-3">
                <div data-tour="exam-status-tabs" className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => {
                            setTab('todos');
                            setPage(1);
                        }}
                        className={cn(
                            'rounded-full px-4 py-1.5 text-[13px] font-medium whitespace-nowrap transition-all',
                            tab === 'todos'
                                ? 'bg-ink text-white'
                                : 'text-ink-dim hover:bg-paper-warm',
                        )}
                    >
                        Todos · {counts.todos}
                    </button>
                    {(
                        [
                            {
                                id: 'borradores' as TabFilter,
                                label: 'Borrador',
                                dot: 'bg-gray-400',
                                activeBg: 'bg-gray-100',
                                activeText: 'text-gray-700',
                            },
                            {
                                id: 'programados' as TabFilter,
                                label: 'Programado',
                                dot: 'bg-amber-400',
                                activeBg: 'bg-amber-50',
                                activeText: 'text-amber-700',
                            },
                            {
                                id: 'en-curso' as TabFilter,
                                label: 'En curso',
                                dot: 'bg-blue-400',
                                activeBg: 'bg-blue-50',
                                activeText: 'text-blue-700',
                            },
                            {
                                id: 'corregidos' as TabFilter,
                                label: 'Corregido',
                                dot: 'bg-emerald-500',
                                activeBg: 'bg-emerald-50',
                                activeText: 'text-emerald-700',
                            },
                        ] as const
                    ).map(({ id, label, dot, activeBg, activeText }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => {
                                setTab(id);
                                setPage(1);
                            }}
                            className={cn(
                                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-all',
                                tab === id
                                    ? cn(activeBg, activeText)
                                    : 'text-ink-dim hover:bg-paper-warm',
                            )}
                        >
                            <span className={cn('h-2 w-2 shrink-0 rounded-full', dot)} />
                            {label} · {counts[id]}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    {groups.length > 1 && (
                        <SearchableSelect
                            size="sm"
                            value={groupFilter}
                            onChange={(v) => {
                                setGroupFilter(v);
                                setPage(1);
                            }}
                            className="w-44"
                            options={[
                                { value: 'all', label: 'Todos los grupos' },
                                ...groups.map((g) => ({ value: g.id, label: g.name })),
                            ]}
                        />
                    )}
                    {courseSections.length > 0 && (
                        <SearchableSelect
                            size="sm"
                            value={courseFilter}
                            onChange={(v) => {
                                setCourseFilter(v);
                                setPage(1);
                            }}
                            className="w-48"
                            options={[
                                { value: 'all', label: 'Todas las asignaturas' },
                                ...courseSections.map((c) => ({ value: c.id, label: c.name })),
                            ]}
                        />
                    )}
                    <div className="relative shrink-0">
                        <Search
                            size={14}
                            className="text-mute pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                        />
                        <Input
                            placeholder="Buscar examen..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            className="bg-paper border-border h-9 w-52 rounded-full pl-9 text-[13px]"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="md" className="gap-2">
                                <LayoutTemplate size={16} />
                                Plantillas
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="border-border w-52 rounded-xl shadow-xl"
                        >
                            <DropdownMenuItem
                                onClick={() => generateExcelTemplate()}
                                className="cursor-pointer gap-2 py-2.5"
                            >
                                <FileSpreadsheet size={14} />
                                Descargar Excel (.xlsx)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => generateMarkdownTemplate()}
                                className="cursor-pointer gap-2 py-2.5"
                            >
                                <FileText size={14} />
                                Descargar Markdown (.md)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        data-tour="exam-new-btn"
                        variant="ink"
                        size="md"
                        onClick={openCreate}
                        className="gap-2"
                    >
                        <Plus size={16} />
                        Nuevo examen
                    </Button>
                </div>
            </div>

            {/* List */}
            <main className="flex-1 overflow-auto p-8">
                {/* Stats tiles */}
                <div data-tour="exam-stats" className="mb-6 grid grid-cols-4 gap-3">
                    {(
                        [
                            {
                                id: 'borradores' as TabFilter,
                                label: 'Borrador',
                                bg: 'bg-gray-50',
                                border: 'border-gray-200',
                                ring: 'ring-gray-400',
                                num: 'text-gray-700',
                                dot: 'bg-gray-400',
                            },
                            {
                                id: 'programados' as TabFilter,
                                label: 'Programado',
                                bg: 'bg-amber-50/60',
                                border: 'border-amber-200',
                                ring: 'ring-amber-400',
                                num: 'text-amber-700',
                                dot: 'bg-amber-400',
                            },
                            {
                                id: 'en-curso' as TabFilter,
                                label: 'En curso',
                                bg: 'bg-blue-50/60',
                                border: 'border-blue-200',
                                ring: 'ring-blue-400',
                                num: 'text-blue-700',
                                dot: 'bg-blue-400',
                            },
                            {
                                id: 'corregidos' as TabFilter,
                                label: 'Corregido',
                                bg: 'bg-emerald-50/60',
                                border: 'border-emerald-200',
                                ring: 'ring-emerald-500',
                                num: 'text-emerald-700',
                                dot: 'bg-emerald-500',
                            },
                        ] as const
                    ).map(({ id, label, bg, border, ring, num, dot }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => {
                                setTab(tab === id ? 'todos' : id);
                                setPage(1);
                            }}
                            className={cn(
                                'cursor-pointer rounded-xl border px-5 py-4 text-left transition-all hover:shadow-sm',
                                bg,
                                border,
                                tab === id && cn('ring-2 ring-offset-1', ring),
                            )}
                        >
                            <div className={cn('text-3xl font-bold tracking-tight', num)}>
                                {counts[id]}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5">
                                <span className={cn('h-2 w-2 shrink-0 rounded-full', dot)} />
                                <span className="text-[12px] font-medium text-gray-400">
                                    {label}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <BookOpen size={48} className="text-mute/20 mb-4" />
                        <p className="text-ink text-lg font-medium">
                            {tab === 'todos' && !searchQuery
                                ? 'Todavía no hay exámenes'
                                : 'Sin resultados'}
                        </p>
                        {tab === 'todos' && !searchQuery && (
                            <>
                                <p className="text-mute mt-1 text-sm">
                                    Crea el primero y luego añádele preguntas.
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
                    <div data-tour="exam-list" className="flex flex-col gap-2">
                        {pagedExams.map((exam) => {
                            const status = deriveExamStatus(exam);
                            const { tone, label: statusLabel } = STATUS_BADGE_CONFIG[status];
                            const accentColor = getAccentColor(exam);
                            const groupNames =
                                exam.groups.length > 0
                                    ? exam.groups.map((g) => g.name).join(', ')
                                    : '—';
                            const participantsText = getParticipantsText(exam, status);
                            const infoText = getInfoText(exam, status);
                            const showParticipants =
                                status === 'en-curso' || status === 'corregidos';

                            return (
                                <div
                                    key={exam.id}
                                    className="group border-border flex items-stretch overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
                                >
                                    {/* Accent bar */}
                                    <div className={cn('w-[4px] shrink-0', accentColor)} />

                                    {/* Content */}
                                    <div className="flex min-w-0 flex-1 items-center gap-4 px-6 py-4">
                                        {/* Title + Subtitle */}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-ink truncate text-[15px] leading-snug font-semibold">
                                                {exam.title}
                                            </p>
                                            <p className="text-mute mt-0.5 truncate text-[12px]">
                                                {exam.courseSection && (
                                                    <>{exam.courseSection.name} · </>
                                                )}
                                                {groupNames}
                                            </p>
                                        </div>

                                        {/* Status badge */}
                                        <div className="flex w-[110px] shrink-0 justify-center">
                                            <Tag tone={tone} size="md">
                                                {statusLabel}
                                            </Tag>
                                        </div>

                                        {/* Question count */}
                                        <div className="text-ink-dim flex w-[80px] shrink-0 items-center gap-1.5 text-[13px]">
                                            <FileText size={14} className="text-mute/60 shrink-0" />
                                            <span>{exam._count.questions} preg.</span>
                                        </div>

                                        {/* Participation */}
                                        <div className="text-ink-dim flex w-[72px] shrink-0 items-center gap-1.5 text-[13px]">
                                            <Users size={14} className="text-mute/60 shrink-0" />
                                            <span
                                                className={cn(
                                                    showParticipants ? 'font-medium' : 'text-mute',
                                                )}
                                            >
                                                {participantsText}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="text-ink-dim flex w-[148px] shrink-0 items-center gap-1.5 text-[13px]">
                                            <Calendar size={14} className="text-mute/60 shrink-0" />
                                            <span
                                                className={cn(
                                                    'truncate',
                                                    status === 'corregidos' &&
                                                        exam.avgGrade !== null &&
                                                        'font-medium text-emerald-700',
                                                )}
                                            >
                                                {infoText}
                                            </span>
                                        </div>

                                        {/* Three-dot menu */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="h-8 w-8 shrink-0 opacity-70 transition-opacity hover:opacity-100"
                                                >
                                                    <MoreHorizontal
                                                        size={16}
                                                        className="text-mute"
                                                    />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="border-border w-48 rounded-xl shadow-xl"
                                            >
                                                <DropdownMenuItem
                                                    asChild
                                                    className="cursor-pointer gap-2 py-2.5"
                                                >
                                                    <Link href={`/${slug}/exams/${exam.id}/edit`}>
                                                        <Settings size={14} />
                                                        Editar contenido
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setImportExamId(exam.id)}
                                                    className="cursor-pointer gap-2 py-2.5"
                                                    disabled={isDemo}
                                                >
                                                    <Upload size={14} />
                                                    Importar preguntas
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => openEdit(exam)}
                                                    className="cursor-pointer gap-2 py-2.5"
                                                >
                                                    <Edit2 size={14} />
                                                    Ajustes de examen
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => openToggle(exam)}
                                                    className="cursor-pointer gap-2 py-2.5"
                                                    disabled={isDemo}
                                                >
                                                    <Power size={14} />
                                                    {exam.active ? 'Despublicar' : 'Publicar'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => openDelete(exam)}
                                                    className="text-destructive focus:bg-danger-wash focus:text-destructive cursor-pointer gap-2 py-2.5"
                                                    disabled={isDemo}
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
                        {filtered.length > PAGE_SIZE && (
                            <div className="border-border overflow-hidden rounded-xl border">
                                <TablePaginator
                                    page={currentPage}
                                    perPage={PAGE_SIZE}
                                    total={filtered.length}
                                    onPageChange={setPage}
                                />
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Create/Edit dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="border-border flex max-h-[95vh] flex-col overflow-hidden rounded-[22px] p-0 shadow-2xl sm:max-w-2xl">
                    <div className="border-border bg-paper border-b px-6 py-5">
                        <DialogTitle className="font-display text-ink text-2xl">
                            {editing ? 'Ajustes del examen' : 'Nuevo examen'}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulario para crear o configurar un examen.
                        </DialogDescription>
                    </div>

                    <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                        {errors.general && (
                            <p className="bg-danger-wash text-destructive border-destructive/10 rounded-[10px] border px-4 py-3 text-sm font-bold">
                                {errors.general}
                            </p>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="exam-form-title"
                                className="text-ink text-[13px] font-bold"
                            >
                                Título del examen
                            </label>
                            <Input
                                id="exam-form-title"
                                placeholder="Ej: Matemáticas — Unidad 3"
                                value={form.title}
                                onChange={(e) => setField('title', e.target.value)}
                                className={cn(
                                    'border-border h-11 rounded-[10px] bg-white',
                                    errors.title && 'border-destructive',
                                )}
                                autoFocus
                                disabled={isDemo}
                            />
                            {errors.title && (
                                <p className="text-destructive text-xs font-medium">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        <ExamAcademicPicker
                            courseSections={courseSections}
                            value={{
                                programId: form.programId,
                                periodId: form.periodId,
                                courseSectionId: form.courseSectionId,
                            }}
                            onChange={(patch) => {
                                if (isDemo) return;
                                setForm((f) => {
                                    const next = { ...f, ...patch };
                                    // Auto-selección del grupo asociado al ramo
                                    if (
                                        patch.courseSectionId &&
                                        patch.courseSectionId !== NO_COURSE
                                    ) {
                                        const course = courseSections.find(
                                            (c) => c.id === patch.courseSectionId,
                                        );
                                        if (course?.groups.length) {
                                            const newIds = course.groups
                                                .map((cg) => cg.id)
                                                .filter((id) => !next.groupIds.includes(id));
                                            if (newIds.length > 0) {
                                                next.groupIds = [...next.groupIds, ...newIds];
                                            }
                                        }
                                    }
                                    return next;
                                });
                            }}
                        />

                        <div className="flex flex-col gap-2">
                            <span className="text-ink text-[13px] font-bold">Grupos asignados</span>
                            <div
                                className={cn(
                                    'border-border bg-paper-warm/20 max-h-[160px] overflow-y-auto rounded-[12px] border p-2',
                                    errors.groupIds && 'border-destructive',
                                )}
                            >
                                {filteredGroups.length === 0 ? (
                                    <p className="text-mute px-3 py-4 text-center text-[13px]">
                                        {groups.length === 0
                                            ? 'No hay grupos creados'
                                            : 'No hay grupos para esta selección'}
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                                        {filteredGroups.map((g) => (
                                            <label
                                                key={g.id}
                                                className="flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5 transition-colors hover:bg-white"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={form.groupIds.includes(g.id)}
                                                    onChange={() => toggleGroup(g.id)}
                                                    className="accent-primary border-border h-4 w-4 rounded"
                                                />
                                                <span
                                                    className="text-ink truncate text-[13.5px] font-medium"
                                                    title={g.name}
                                                >
                                                    {g.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {errors.groupIds && (
                                <p className="text-destructive text-xs font-medium">
                                    {errors.groupIds}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="exam-form-scheduledAt"
                                    className="text-ink text-[13px] font-bold"
                                >
                                    Fecha de inicio
                                </label>
                                <Input
                                    id="exam-form-scheduledAt"
                                    type="datetime-local"
                                    value={form.scheduledAt}
                                    onChange={(e) => setField('scheduledAt', e.target.value)}
                                    className="border-border h-11 rounded-[10px] bg-white"
                                    disabled={isDemo}
                                />
                                <p className="text-mute text-[11px] leading-snug">
                                    Antes de esta fecha el examen no se puede rendir. Dejá vacío
                                    para disponibilidad inmediata.
                                </p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="exam-form-closesAt"
                                    className="text-ink text-[13px] font-bold"
                                >
                                    Fecha de cierre
                                </label>
                                <Input
                                    id="exam-form-closesAt"
                                    type="datetime-local"
                                    value={form.closesAt}
                                    onChange={(e) => setField('closesAt', e.target.value)}
                                    className={cn(
                                        'border-border h-11 rounded-[10px] bg-white',
                                        errors.closesAt && 'border-destructive',
                                    )}
                                    disabled={isDemo}
                                />
                                {errors.closesAt ? (
                                    <p className="text-destructive text-xs font-medium">
                                        {errors.closesAt}
                                    </p>
                                ) : (
                                    <p className="text-mute text-[11px] leading-snug">
                                        Después de esta fecha ya no se puede rendir. Dejá vacío para
                                        sin límite.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="exam-form-timelimit"
                                className="text-ink text-[13px] font-bold"
                            >
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
                                        'border-border h-11 rounded-[10px] bg-white pr-12',
                                        errors.timeLimit && 'border-destructive',
                                    )}
                                    disabled={isDemo}
                                />
                                <span className="text-mute absolute top-1/2 right-4 -translate-y-1/2 text-[11px] font-bold uppercase">
                                    MIN
                                </span>
                            </div>
                            {errors.timeLimit && (
                                <p className="text-destructive text-xs font-medium">
                                    {errors.timeLimit}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-ink text-[13px] font-bold">
                                Vigilancia del examen
                            </span>
                            <div className="border-border divide-border divide-y overflow-hidden rounded-[10px] border">
                                {TAB_MODES.map((mode) => {
                                    const active =
                                        getTabMode(form.antiCheatEnabled, form.lockTabSwitch) ===
                                        mode.value;
                                    return (
                                        <button
                                            key={mode.value}
                                            type="button"
                                            onClick={() => {
                                                if (isDemo) return;
                                                const flags = tabModeToFlags(mode.value);
                                                setForm((f) => ({ ...f, ...flags }));
                                            }}
                                            className={cn(
                                                'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                                                active
                                                    ? 'bg-primary-wash/40'
                                                    : 'hover:bg-paper-warm/50 bg-white',
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'h-3.5 w-3.5 shrink-0 rounded-full border-2 transition-colors',
                                                    active
                                                        ? 'border-primary bg-primary'
                                                        : 'border-border bg-white',
                                                )}
                                            />
                                            <div className="min-w-0">
                                                <p
                                                    className={cn(
                                                        'text-[12px] font-bold',
                                                        active ? 'text-primary' : 'text-ink',
                                                    )}
                                                >
                                                    {mode.label}
                                                </p>
                                                <p className="text-mute text-[11px] leading-snug">
                                                    {mode.desc}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-ink text-[13px] font-bold">Aleatorización</span>
                            <div
                                className={cn(
                                    'border-border bg-paper-warm/30 flex items-center justify-between gap-4 rounded-[10px] border px-4 py-3 transition-colors',
                                    form.randomizeQuestions &&
                                        'bg-primary-wash/30 border-primary/20',
                                )}
                            >
                                <div className="flex min-w-0 flex-col gap-0.5">
                                    <span className="text-ink-dim text-[12px] font-bold">
                                        Aleatorizar preguntas
                                    </span>
                                    <span className="text-mute text-[11px] leading-snug">
                                        Cada estudiante verá las preguntas en un orden distinto.
                                    </span>
                                </div>
                                <Switch
                                    checked={form.randomizeQuestions}
                                    onCheckedChange={(v) => setField('randomizeQuestions', v)}
                                    className="data-[state=checked]:bg-primary shrink-0"
                                    disabled={isDemo}
                                />
                            </div>
                        </div>

                        <div className="bg-paper border-border flex flex-col gap-3 rounded-[14px] border p-5">
                            <span className="text-ink text-[13px] font-bold">
                                Escala de evaluación
                            </span>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="exam-grade-max"
                                        className="text-mute text-[11px] font-bold uppercase"
                                    >
                                        Máxima
                                    </label>
                                    <Input
                                        id="exam-grade-max"
                                        type="number"
                                        step={0.1}
                                        value={form.maxGrade}
                                        onChange={(e) => setField('maxGrade', e.target.value)}
                                        className="h-10 rounded-[8px] text-center font-bold"
                                        disabled={isDemo}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="exam-grade-pass"
                                        className="text-mute text-[11px] font-bold uppercase"
                                    >
                                        Aprobación
                                    </label>
                                    <Input
                                        id="exam-grade-pass"
                                        type="number"
                                        step={0.1}
                                        value={form.passingGrade}
                                        onChange={(e) => setField('passingGrade', e.target.value)}
                                        className="h-10 rounded-[8px] text-center font-bold"
                                        disabled={isDemo}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label
                                        htmlFor="exam-grade-pct"
                                        className="text-mute text-[11px] font-bold uppercase"
                                    >
                                        % Exigencia
                                    </label>
                                    <Input
                                        id="exam-grade-pct"
                                        type="number"
                                        value={form.passingPercentage}
                                        onChange={(e) =>
                                            setField('passingPercentage', e.target.value)
                                        }
                                        className="h-10 rounded-[8px] text-center font-bold"
                                        disabled={isDemo}
                                    />
                                </div>
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
                                onClick={handleSave}
                                className="min-w-[140px]"
                            >
                                {isPending && <Loader2 className="mr-2 animate-spin" />}
                                {editing ? 'Guardar cambios' : 'Crear examen'}
                            </Button>
                        </div>
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

            {/* Publish/Unpublish confirm */}
            <AlertDialog open={isToggleOpen} onOpenChange={setIsToggleOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {toToggle?.active ? 'Despublicar examen' : 'Publicar examen'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {toToggle?.active
                                ? `Los estudiantes ya no podrán acceder a "${toToggle?.title}".`
                                : `"${toToggle?.title}" quedará visible para los estudiantes asignados.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isPending}
                            onClick={handleTogglePublish}
                            className={
                                toToggle?.active ? 'bg-destructive hover:bg-destructive/90' : ''
                            }
                        >
                            {isPending && <Loader2 className="mr-2 animate-spin" size={14} />}
                            {toToggle?.active ? 'Despublicar' : 'Publicar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete confirm */}
            <AlertDialog open={isDelOpen} onOpenChange={setIsDelOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">
                            Eliminar examen
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de eliminar{' '}
                            <strong className="text-ink">&ldquo;{toDelete?.title}&rdquo;</strong>?
                            Esta acción es irreversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && (
                        <p className="bg-danger-wash text-destructive rounded-[10px] px-4 py-2 text-sm font-medium">
                            {deleteError}
                        </p>
                    )}
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
        </>
    );
}
