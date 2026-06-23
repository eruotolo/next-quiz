'use client';

import { createExam } from '@/features/exams/actions/mutations';
import { createGroup } from '@/features/groups/actions/mutations';
import { createStudent } from '@/features/students/actions/mutations';
import { RutField } from '@/shared/components/ui/rut-field';
import { toast } from 'sonner';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/lib/utils';
import { isValidRut, normalizeRut } from '@/shared/lib/rut';
import type { Group } from '@prisma/client';
import {
    AlertCircle,
    ArrowRight,
    BookOpen,
    Calendar,
    CheckCircle2,
    ChevronRight,
    GraduationCap,
    Loader2,
    Plus,
    TrendingUp,
    UserX,
    Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

interface Stats {
    students: number;
    activeExams: number;
    totalExams: number;
    results: number;
}

interface ActiveExamInfo {
    id: string;
    title: string;
    subject: string | null;
    unit: string | null;
    closesAt: string | null;
    groupNames: string;
    totalStudents: number;
    submittedCount: number;
}

interface RecentResultInfo {
    id: string;
    studentName: string;
    examTitle: string;
    examSubject: string | null;
    grade: number;
    maxGrade: number;
    passingGrade: number;
    completedAt: string;
}

interface Props {
    firstName: string;
    greeting: string;
    institutionName: string;
    slug: string;
    groups: Group[];
    stats: Stats;
    activeExams: ActiveExamInfo[];
    recentResults: RecentResultInfo[];
    avgGrade: number | null;
    attendancePct: number;
    uniqueStudentsWithResults: number;
    ungroupedStudents: number;
}

type ModalType = 'grupo' | 'alumno' | 'examen' | null;

// ── Countdown timer ────────────────────────────────────────────────────────

function useCountdown(closesAt: string | null): string {
    const [remaining, setRemaining] = useState('');

    useEffect(() => {
        if (!closesAt) return;

        function compute(): void {
            const diff = new Date(closesAt as string).getTime() - Date.now();
            if (diff <= 0) {
                setRemaining('00:00:00');
                return;
            }
            const h = Math.floor(diff / 3_600_000);
            const m = Math.floor((diff % 3_600_000) / 60_000);
            const s = Math.floor((diff % 60_000) / 1_000);
            setRemaining(
                `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
            );
        }

        compute();
        const id = setInterval(compute, 1_000);
        return () => clearInterval(id);
    }, [closesAt]);

    return remaining;
}

function ExamRowTimer({ closesAt }: { closesAt: string | null }) {
    const remaining = useCountdown(closesAt);
    if (!closesAt) return <span className="text-mute font-mono text-[11px]">Sin límite</span>;
    return <span className="text-mute font-mono text-[11px]">cierra en {remaining}</span>;
}

// ── Grade color helper ─────────────────────────────────────────────────────

function gradeColor(grade: number, passingGrade: number): string {
    if (grade >= passingGrade + 1) return 'text-[#0f7c4a]';
    if (grade >= passingGrade) return 'text-[#b7791f]';
    return 'text-[#d5301f]';
}

function progressColor(pct: number): string {
    if (pct >= 0.8) return 'bg-[#1f2eff]';
    if (pct >= 0.5) return 'bg-[#b7791f]';
    return 'bg-[#d5301f]';
}

// ── Avatar initials ────────────────────────────────────────────────────────

const AVATAR_COLORS = [
    'bg-[#e8eaff] text-[#1f2eff]',
    'bg-[#e6f4ed] text-[#0f7c4a]',
    'bg-[#fff2d4] text-[#b7791f]',
    'bg-[#fce4e1] text-[#d5301f]',
    'bg-[#efebe0] text-[#3c3d45]',
];

function initials(name: string): string {
    const parts = name.trim().split(' ');
    return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

function avatarColor(name: string): string {
    const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx] ?? (AVATAR_COLORS[0] as string);
}

// ── Current month label ────────────────────────────────────────────────────

function currentMonthLabel(): string {
    return new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
}

// ── Validation helpers (extracted to reduce component complexity) ──────────

interface StudentFormState {
    name: string;
    lastname: string;
    email: string;
    rut: string;
    groupId: string;
}

function validateStudentForm(form: StudentFormState): Record<string, string> {
    const errs: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.name.trim()) errs.name = 'Nombre requerido';
    if (!form.lastname.trim()) errs.lastname = 'Apellido requerido';
    if (!emailRegex.test(form.email)) errs.email = 'Email inválido';
    if (!form.rut.trim()) {
        errs.rut = 'RUT requerido';
    } else if (!isValidRut(normalizeRut(form.rut))) {
        errs.rut = 'RUT inválido';
    }
    if (!form.groupId) errs.groupId = 'Seleccioná un grupo';
    return errs;
}

interface ExamFormState {
    title: string;
    timeLimit: string;
    groupIds: string[];
    maxGrade: string;
    passingGrade: string;
    passingPercentage: string;
}

function validateExamForm(form: ExamFormState): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Título requerido';
    const tl = Number(form.timeLimit);
    if (!form.timeLimit || Number.isNaN(tl) || tl < 1 || tl > 180)
        errs.timeLimit = 'Entre 1 y 180 minutos';
    if (form.groupIds.length === 0) errs.groupIds = 'Seleccioná al menos un grupo';
    const mg = Number(form.maxGrade);
    const pg = Number(form.passingGrade);
    const pp = Number(form.passingPercentage);
    if (Number.isNaN(mg) || mg < 1 || mg > 10) errs.maxGrade = 'Entre 1 y 10';
    if (Number.isNaN(pg) || pg < 1 || pg >= mg)
        errs.passingGrade = `Entre 1 y ${form.maxGrade} (exclusivo)`;
    if (Number.isNaN(pp) || pp < 1 || pp > 99) errs.passingPercentage = 'Entre 1 y 99';
    return errs;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ExamRow({
    exam,
    onView,
}: {
    exam: ActiveExamInfo;
    onView: () => void;
}) {
    const pct = exam.totalStudents > 0 ? exam.submittedCount / exam.totalStudents : 0;
    return (
        <div className="flex items-center gap-4 px-6 py-4">
            <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] leading-tight font-semibold text-[#0b0b11]">
                    {exam.groupNames ? `${exam.groupNames} · ` : ''}
                    {exam.subject ?? exam.title}
                    {exam.unit ? ` · ${exam.unit}` : ''}
                </p>
                <p className="mt-0.5 text-[11.5px] text-[#75716b]">{exam.title}</p>
            </div>
            <div className="w-16 shrink-0 text-center">
                <p className="text-[12.5px] font-bold text-[#0b0b11]">
                    {exam.submittedCount}/{exam.totalStudents}
                </p>
                <p className="text-[10px] text-[#75716b]">rinden</p>
            </div>
            <div className="w-28 shrink-0 space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e5e2dc]">
                    <div
                        className={cn('h-full w-[var(--bar-w)] rounded-full transition-all', progressColor(pct))}
                        style={{ '--bar-w': `${Math.round(pct * 100)}%` } as React.CSSProperties}
                    />
                </div>
                <ExamRowTimer closesAt={exam.closesAt} />
            </div>
            <button
                type="button"
                onClick={onView}
                className="flex shrink-0 items-center gap-1 rounded-[8px] border border-[#e5e2dc] px-3 py-1.5 text-[12px] font-medium text-[#0b0b11] transition-colors hover:bg-[#fafaf7]"
            >
                Ver <ChevronRight size={12} />
            </button>
        </div>
    );
}

function ResultRow({ r }: { r: RecentResultInfo }) {
    return (
        <div className="grid grid-cols-[1fr_1fr_60px] items-center gap-2 px-6 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
                <div
                    className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase',
                        avatarColor(r.studentName),
                    )}
                >
                    {initials(r.studentName)}
                </div>
                <span className="truncate text-[12.5px] font-medium text-[#0b0b11]">
                    {r.studentName}
                </span>
            </div>
            <span className="truncate text-[12px] text-[#75716b]">
                {r.examSubject ?? r.examTitle}
            </span>
            <div className="flex items-center justify-end gap-1">
                <span className={cn('text-[13px] font-bold', gradeColor(r.grade, r.passingGrade))}>
                    {r.grade.toFixed(1).replace('.', ',')}
                </span>
                <ChevronRight size={12} className="text-[#e5e2dc]" />
            </div>
        </div>
    );
}

// ── Grade distribution bars (static placeholder) ──────────────────────────

const GRADE_BARS = [
    { id: 'g1', val: 0.15 },
    { id: 'g2', val: 0.25 },
    { id: 'g3', val: 0.45 },
    { id: 'g4', val: 0.35 },
    { id: 'g5', val: 0.6 },
    { id: 'g6', val: 0.55 },
    { id: 'g7', val: 0.8 },
    { id: 'g8', val: 0.9 },
    { id: 'g9', val: 0.75 },
    { id: 'g10', val: 0.65 },
    { id: 'g11', val: 0.5 },
    { id: 'g12', val: 0.4 },
] as const;

// ── Notification item builder ───────────────────────────────────────────────

interface TodayItem {
    key: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    iconClass: string;
    title: string;
    desc: string;
    time: string;
}

function buildTodayItems(
    ungroupedStudents: number,
    recentResultsCount: number,
    activeExamsCount: number,
): TodayItem[] {
    const items: TodayItem[] = [];
    if (ungroupedStudents > 0) {
        items.push({
            key: 'ungrouped',
            icon: UserX,
            iconClass: 'text-[#b7791f] bg-[#fff2d4]',
            title: `${ungroupedStudents} estudiante${ungroupedStudents > 1 ? 's' : ''} sin grupo`,
            desc: 'Fueron importados pero quedaron sin curso asignado.',
            time: 'Pendiente',
        });
    }
    if (recentResultsCount > 0) {
        items.push({
            key: 'results',
            icon: CheckCircle2,
            iconClass: 'text-[#0f7c4a] bg-[#e6f4ed]',
            title: `${recentResultsCount} resultado${recentResultsCount > 1 ? 's' : ''} recientes`,
            desc: 'Hay resultados listos para revisar en el panel.',
            time: 'Hoy',
        });
    }
    if (activeExamsCount > 0) {
        items.push({
            key: 'active-exams',
            icon: AlertCircle,
            iconClass: 'text-[#1f2eff] bg-[#e8eaff]',
            title: `${activeExamsCount} examen${activeExamsCount > 1 ? 'es' : ''} en curso`,
            desc: 'Hay exámenes activos respondiendo ahora mismo.',
            time: 'En vivo',
        });
    }
    if (items.length === 0) {
        items.push({
            key: 'all-good',
            icon: CheckCircle2,
            iconClass: 'text-[#0f7c4a] bg-[#e6f4ed]',
            title: 'Todo al día',
            desc: 'No hay alertas pendientes para hoy.',
            time: 'Ahora',
        });
    }
    return items;
}

// ── Self-contained dialog components ───────────────────────────────────────

function CreateGroupDialog({
    open,
    onOpenChange,
    slug,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    slug: string;
    onSuccess: () => void;
}) {
    const [groupName, setGroupName] = useState('');
    const [groupError, setGroupError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleCreate = (): void => {
        if (!groupName.trim()) {
            setGroupError('El nombre es requerido.');
            return;
        }
        startTransition(async () => {
            const result = await createGroup(slug, { name: groupName });
            if (result.error) {
                setGroupError(result.error);
                return;
            }
            onOpenChange(false);
            toast.success('Grupo creado');
            onSuccess();
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-[22px]">
                <DialogHeader>
                    <DialogTitle className="font-display text-2xl">Nuevo grupo</DialogTitle>
                    <DialogDescription className="sr-only">
                        Formulario para crear un nuevo grupo.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2 py-4">
                    <label htmlFor="group-name" className="text-[13px] font-bold text-[#0b0b11]">
                        Nombre del grupo
                    </label>
                    <Input
                        id="group-name"
                        placeholder="Ej: 4to Año B"
                        value={groupName}
                        onChange={(e) => {
                            setGroupName(e.target.value);
                            setGroupError(null);
                        }}
                        className={cn('h-11 rounded-[10px]', groupError && 'border-destructive')}
                        autoFocus
                    />
                    {groupError && (
                        <p className="text-destructive text-xs font-medium">{groupError}</p>
                    )}
                </div>
                <DialogFooter className="gap-2">
                    <Button
                        variant="ghost"
                        size="md"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancelar
                    </Button>
                    <Button variant="ink" size="md" disabled={isPending} onClick={handleCreate}>
                        {isPending && <Loader2 className="mr-2 animate-spin" />}
                        Crear grupo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CreateStudentDialog({
    open,
    onOpenChange,
    groups,
    slug,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    groups: Group[];
    slug: string;
    onSuccess: () => void;
}) {
    const [form, setForm] = useState({ name: '', lastname: '', email: '', rut: '', groupId: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isPending, startTransition] = useTransition();

    const handleCreate = (): void => {
        const errs = validateStudentForm(form);
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }
        startTransition(async () => {
            const result = await createStudent(slug, form);
            if (result.error) {
                setErrors({ general: result.error });
                return;
            }
            onOpenChange(false);
            toast.success('Estudiante creado');
            onSuccess();
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-[22px] sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-display text-2xl">Nuevo estudiante</DialogTitle>
                    <DialogDescription className="sr-only">
                        Formulario para crear un nuevo estudiante.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="s-name"
                                className="text-[12.5px] font-bold text-[#0b0b11]"
                            >
                                Nombre
                            </label>
                            <Input
                                id="s-name"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                className="h-11 rounded-[10px]"
                                autoFocus
                            />
                            {errors.name && (
                                <p className="text-destructive text-xs">{errors.name}</p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="s-lastname"
                                className="text-[12.5px] font-bold text-[#0b0b11]"
                            >
                                Apellido
                            </label>
                            <Input
                                id="s-lastname"
                                value={form.lastname}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, lastname: e.target.value }))
                                }
                                className="h-11 rounded-[10px]"
                            />
                            {errors.lastname && (
                                <p className="text-destructive text-xs">{errors.lastname}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="s-email" className="text-[12.5px] font-bold text-[#0b0b11]">
                            Email
                        </label>
                        <Input
                            id="s-email"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            className="h-11 rounded-[10px]"
                        />
                        {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[12.5px] font-bold text-[#0b0b11]">RUT</span>
                        <RutField
                            value={form.rut}
                            onChange={(v) => setForm((f) => ({ ...f, rut: v }))}
                            className="border-border h-11 rounded-[10px] bg-white"
                        />
                        {errors.rut && <p className="text-destructive text-xs">{errors.rut}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[12.5px] font-bold text-[#0b0b11]">Grupo</span>
                        <Select
                            value={form.groupId}
                            onValueChange={(v) => setForm((f) => ({ ...f, groupId: v }))}
                        >
                            <SelectTrigger className="h-11 rounded-[10px]">
                                <SelectValue placeholder="Seleccioná un grupo" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {groups.map((g) => (
                                    <SelectItem key={g.id} value={g.id}>
                                        {g.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.groupId && (
                            <p className="text-destructive text-xs">{errors.groupId}</p>
                        )}
                    </div>
                    {errors.general && <p className="text-destructive text-xs">{errors.general}</p>}
                </div>
                <DialogFooter className="gap-2">
                    <Button
                        variant="ghost"
                        size="md"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancelar
                    </Button>
                    <Button variant="ink" size="md" disabled={isPending} onClick={handleCreate}>
                        {isPending && <Loader2 className="mr-2 animate-spin" />}
                        Crear estudiante
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CreateExamDialog({
    open,
    onOpenChange,
    groups,
    slug,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    groups: Group[];
    slug: string;
    onSuccess: () => void;
}) {
    const [form, setForm] = useState({
        title: '',
        timeLimit: '30',
        groupIds: [] as string[],
        active: false,
        maxGrade: '7',
        passingGrade: '4',
        passingPercentage: '60',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isPending, startTransition] = useTransition();

    const toggleGroup = (id: string): void => {
        setForm((f) => ({
            ...f,
            groupIds: f.groupIds.includes(id)
                ? f.groupIds.filter((g) => g !== id)
                : [...f.groupIds, id],
        }));
    };

    const handleCreate = (): void => {
        const errs = validateExamForm(form);
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }
        startTransition(async () => {
            try {
                await createExam(slug, {
                    ...form,
                    timeLimit: Number(form.timeLimit),
                    maxGrade: Number(form.maxGrade),
                    passingGrade: Number(form.passingGrade),
                    passingPercentage: Number(form.passingPercentage),
                });
                onOpenChange(false);
                onSuccess();
            } catch (err: unknown) {
                setErrors({
                    general:
                        err instanceof Error ? err.message : 'Ocurrió un error. Intenta de nuevo.',
                });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-[22px]">
                <DialogHeader>
                    <DialogTitle className="font-display text-2xl">Nuevo examen</DialogTitle>
                    <DialogDescription className="sr-only">
                        Formulario para crear un nuevo examen.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="e-title" className="text-[13px] font-bold text-[#0b0b11]">
                            Título del examen
                        </label>
                        <Input
                            id="e-title"
                            placeholder="Ej: Matemáticas — Unidad 3"
                            value={form.title}
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                            className="h-11 rounded-[10px]"
                            autoFocus
                        />
                        {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="e-time" className="text-[13px] font-bold text-[#0b0b11]">
                            Tiempo límite (minutos)
                        </label>
                        <Input
                            id="e-time"
                            type="number"
                            value={form.timeLimit}
                            onChange={(e) => setForm((f) => ({ ...f, timeLimit: e.target.value }))}
                            className="h-11 rounded-[10px]"
                        />
                        {errors.timeLimit && (
                            <p className="text-destructive text-xs">{errors.timeLimit}</p>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-bold text-[#0b0b11]">
                            Grupos asignados
                        </span>
                        <div className="max-h-[140px] overflow-y-auto rounded-[12px] border border-[#e5e2dc] bg-[#fafaf7]/30 p-2">
                            {groups.map((g) => (
                                <label
                                    key={g.id}
                                    className="flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2 transition-colors hover:bg-white"
                                >
                                    <input
                                        type="checkbox"
                                        checked={form.groupIds.includes(g.id)}
                                        onChange={() => toggleGroup(g.id)}
                                        className="accent-primary h-4 w-4"
                                    />
                                    <span className="text-sm font-medium text-[#0b0b11]">
                                        {g.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                        {errors.groupIds && (
                            <p className="text-destructive text-xs">{errors.groupIds}</p>
                        )}
                    </div>
                    {errors.general && <p className="text-destructive text-xs">{errors.general}</p>}
                </div>
                <DialogFooter className="gap-2">
                    <Button
                        variant="ghost"
                        size="md"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancelar
                    </Button>
                    <Button variant="ink" size="md" disabled={isPending} onClick={handleCreate}>
                        {isPending && <Loader2 className="mr-2 animate-spin" />}
                        Crear examen
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Main component ─────────────────────────────────────────────────────────

export function DashboardClient({
    firstName,
    greeting,
    institutionName,
    slug,
    groups,
    stats,
    activeExams,
    recentResults,
    avgGrade,
    attendancePct,
    uniqueStudentsWithResults,
    ungroupedStudents,
}: Props) {
    const router = useRouter();
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [grupoOpen, setGrupoOpen] = useState(false);
    const [alumnoOpen, setAlumnoOpen] = useState(false);
    const [examenOpen, setExamenOpen] = useState(false);

    useEffect(() => {
        const handler = (e: MouseEvent): void => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const openModal = (type: ModalType): void => {
        setMenuOpen(false);
        if (type === 'grupo') setGrupoOpen(true);
        if (type === 'alumno') setAlumnoOpen(true);
        if (type === 'examen') setExamenOpen(true);
    };

    const todayItems = buildTodayItems(ungroupedStudents, recentResults.length, stats.activeExams);

    const subtitle =
        stats.activeExams > 0
            ? `Tenés ${stats.activeExams} examen${stats.activeExams > 1 ? 'es' : ''} activo${stats.activeExams > 1 ? 's' : ''} y ${stats.students} estudiantes registrados.`
            : `Tenés ${stats.students} estudiantes registrados y ${stats.totalExams} exámenes creados.`;

    const avgGradeLabel = avgGrade !== null ? avgGrade.toFixed(1).replace('.', ',') : '—';
    const avgGradeDesc = avgGrade !== null ? 'nota promedio general' : 'sin resultados aún';
    const activeExamDesc = stats.activeExams > 0 ? 'activos ahora' : 'sin exámenes activos';

    return (
        <div className="min-h-screen bg-[#fafaf7]">
            {/* ── Header ── */}
            <header className="flex items-start justify-between gap-6 border-b border-[#e5e2dc] bg-white px-8 py-6">
                <div>
                    <p className="mb-1 font-mono text-[10.5px] font-bold tracking-[0.1em] text-[#75716b] uppercase">
                        {institutionName}
                    </p>
                    <h1 className="font-display text-[36px] leading-none font-bold tracking-[-0.03em] text-[#0b0b11]">
                        {greeting}, {firstName} 👋
                    </h1>
                    <p className="mt-2 text-[13.5px] text-[#3c3d45]">{subtitle}</p>
                </div>

                <div className="flex shrink-0 items-center gap-3 pt-1">
                    <div className="flex items-center gap-2 rounded-[10px] border border-[#e5e2dc] bg-[#fafaf7] px-3.5 py-2">
                        <Calendar size={13} className="text-[#75716b]" />
                        <span className="text-[12.5px] font-medium text-[#3c3d45] capitalize">
                            {currentMonthLabel()}
                        </span>
                    </div>
                    <div ref={menuRef} className="relative">
                        <Button
                            variant="ink"
                            size="md"
                            onClick={() => setMenuOpen((v) => !v)}
                            className="gap-2"
                        >
                            <Plus size={15} />
                            Nuevo examen
                        </Button>
                        {menuOpen && (
                            <div className="animate-in fade-in slide-in-from-top-2 absolute top-full right-0 z-50 mt-2 min-w-[220px] rounded-[18px] border border-[#e5e2dc] bg-white p-2 shadow-xl">
                                {(
                                    [
                                        {
                                            label: 'Nuevo examen',
                                            icon: BookOpen,
                                            modal: 'examen' as ModalType,
                                        },
                                        {
                                            label: 'Nuevo estudiante',
                                            icon: GraduationCap,
                                            modal: 'alumno' as ModalType,
                                        },
                                        {
                                            label: 'Nuevo grupo',
                                            icon: Users,
                                            modal: 'grupo' as ModalType,
                                        },
                                    ] as const
                                ).map(({ label, icon: Icon, modal }) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => openModal(modal)}
                                        className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-[#fafaf7]"
                                    >
                                        <Icon size={15} className="text-[#75716b]" />
                                        <span className="text-[13px] font-medium text-[#0b0b11]">
                                            {label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="space-y-6 p-8">
                {/* ── Stat cards ── */}
                <div className="grid grid-cols-4 gap-4">
                    <Card className="border-[#e5e2dc] bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <p className="font-mono text-[10px] font-bold tracking-[0.1em] text-[#75716b] uppercase">
                                Estudiantes activos
                            </p>
                            <Users size={16} className="text-[#75716b]" />
                        </div>
                        <p className="font-display mt-3 text-[40px] leading-none font-bold tracking-[-0.03em] text-[#0b0b11]">
                            {stats.students}
                        </p>
                        <p className="mt-3 flex items-center gap-1 text-[11.5px] text-[#0f7c4a]">
                            <TrendingUp size={12} />
                            <span>Total registrados</span>
                        </p>
                    </Card>

                    <Card className="border-[#1f2eff] bg-[#1f2eff] p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <p className="font-mono text-[10px] font-bold tracking-[0.1em] text-white/60 uppercase">
                                Exámenes abiertos
                            </p>
                            <BookOpen size={16} className="text-white/60" />
                        </div>
                        <p className="font-display mt-3 text-[40px] leading-none font-bold tracking-[-0.03em] text-white">
                            {stats.activeExams}
                        </p>
                        <p className="mt-3 text-[11.5px] text-white/60">{activeExamDesc}</p>
                    </Card>

                    <Card className="border-[#e5e2dc] bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <p className="font-mono text-[10px] font-bold tracking-[0.1em] text-[#75716b] uppercase">
                                Promedio institución
                            </p>
                            <TrendingUp size={16} className="text-[#75716b]" />
                        </div>
                        <p className="font-display mt-3 text-[40px] leading-none font-bold tracking-[-0.03em] text-[#0b0b11]">
                            {avgGradeLabel}
                        </p>
                        <p className="mt-3 text-[11.5px] text-[#75716b]">{avgGradeDesc}</p>
                    </Card>

                    <Card className="border-[#0b0b11] bg-[#0b0b11] p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <p className="font-mono text-[10px] font-bold tracking-[0.1em] text-white/40 uppercase">
                                Asistencia eval.
                            </p>
                            <GraduationCap size={16} className="text-white/40" />
                        </div>
                        <p className="font-display mt-3 text-[40px] leading-none font-bold tracking-[-0.03em] text-white">
                            {attendancePct}%
                        </p>
                        <p className="mt-3 text-[11.5px] text-white/40">
                            {uniqueStudentsWithResults} de {stats.students} rinden
                        </p>
                    </Card>
                </div>

                {/* ── Middle row ── */}
                <div className="grid grid-cols-[1fr_340px] gap-4">
                    <Card className="border-[#e5e2dc] bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-[#e5e2dc] px-6 py-4">
                            <div>
                                <h2 className="text-[16px] font-bold text-[#0b0b11]">
                                    Exámenes en curso
                                </h2>
                                <p className="text-[12px] text-[#75716b]">
                                    Tablero pregunta a pregunta · {stats.activeExams} activos
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.push(`/${slug}/liveresults`)}
                                className="flex items-center gap-1 text-[12.5px] font-semibold text-[#1f2eff] hover:underline"
                            >
                                Ver todos <ArrowRight size={13} />
                            </button>
                        </div>
                        <div className="divide-y divide-[#e5e2dc]">
                            {activeExams.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <BookOpen size={28} className="mb-3 text-[#e5e2dc]" />
                                    <p className="text-[13px] font-medium text-[#75716b]">
                                        No hay exámenes activos ahora
                                    </p>
                                    <p className="mt-1 text-[11.5px] text-[#75716b]">
                                        Activá un examen para verlo aquí en tiempo real
                                    </p>
                                </div>
                            ) : (
                                activeExams.map((exam) => (
                                    <ExamRow
                                        key={exam.id}
                                        exam={exam}
                                        onView={() => router.push(`/${slug}/liveresults`)}
                                    />
                                ))
                            )}
                        </div>
                    </Card>

                    <Card className="border-[#e5e2dc] bg-white shadow-sm">
                        <div className="border-b border-[#e5e2dc] px-5 py-4">
                            <h2 className="text-[16px] font-bold text-[#0b0b11]">Hoy</h2>
                            <p className="text-[12px] text-[#75716b]">
                                {todayItems.length} cosa{todayItems.length !== 1 ? 's' : ''} que
                                mirar
                            </p>
                        </div>
                        <div className="divide-y divide-[#e5e2dc]">
                            {todayItems.map((item) => (
                                <div key={item.key} className="flex items-start gap-3 px-5 py-4">
                                    <div
                                        className={cn(
                                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                            item.iconClass,
                                        )}
                                    >
                                        <item.icon size={14} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[12.5px] leading-tight font-semibold text-[#0b0b11]">
                                            {item.title}
                                        </p>
                                        <p className="mt-0.5 text-[11.5px] leading-snug text-[#75716b]">
                                            {item.desc}
                                        </p>
                                    </div>
                                    <span className="shrink-0 font-mono text-[10px] text-[#75716b]">
                                        {item.time}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* ── Bottom row ── */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="border-[#e5e2dc] bg-white shadow-sm">
                        <div className="border-b border-[#e5e2dc] px-6 py-4">
                            <h2 className="text-[16px] font-bold text-[#0b0b11]">
                                Distribución de notas · ciclo
                            </h2>
                            <p className="text-[12px] text-[#75716b]">
                                Mes en curso · todas las asignaturas
                            </p>
                        </div>
                        <div className="flex h-[200px] items-end gap-1 px-6 pt-4 pb-6">
                            {GRADE_BARS.map(({ id, val }, i) => (
                                <div
                                    key={id}
                                    className="flex-1 rounded-t-[4px] [height:var(--bar-h)] [background-color:var(--bar-bg)] transition-all hover:opacity-80"
                                    style={
                                        {
                                            '--bar-h': `${val * 100}%`,
                                            '--bar-bg':
                                                i > 8 ? '#1f2eff' : i > 4 ? '#0f7c4a' : '#e5e2dc',
                                        } as React.CSSProperties
                                    }
                                />
                            ))}
                        </div>
                        <div className="flex justify-between px-6 pb-4 font-mono text-[10px] text-[#75716b]">
                            <span>2,0</span>
                            <span>3,5</span>
                            <span>5,0</span>
                            <span>5,8+</span>
                            <span>6,5</span>
                        </div>
                    </Card>

                    <Card className="border-[#e5e2dc] bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-[#e5e2dc] px-6 py-4">
                            <h2 className="text-[16px] font-bold text-[#0b0b11]">
                                Últimos resultados
                            </h2>
                            <button
                                type="button"
                                onClick={() => router.push(`/${slug}/results`)}
                                className="flex items-center gap-1 text-[12.5px] font-semibold text-[#1f2eff] hover:underline"
                            >
                                Ver todos <ArrowRight size={13} />
                            </button>
                        </div>
                        {recentResults.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <p className="text-[13px] text-[#75716b]">Sin resultados aún</p>
                            </div>
                        ) : (
                            <div>
                                <div className="grid grid-cols-[1fr_1fr_60px] gap-2 px-6 py-2 font-mono text-[10px] font-bold tracking-[0.08em] text-[#75716b] uppercase">
                                    <span>Estudiante</span>
                                    <span>Examen</span>
                                    <span className="text-right">Nota</span>
                                </div>
                                <div className="divide-y divide-[#e5e2dc]">
                                    {recentResults.map((r) => (
                                        <ResultRow key={r.id} r={r} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </main>

            <CreateGroupDialog
                open={grupoOpen}
                onOpenChange={setGrupoOpen}
                slug={slug}
                onSuccess={() => router.refresh()}
            />
            <CreateStudentDialog
                open={alumnoOpen}
                onOpenChange={setAlumnoOpen}
                groups={groups}
                slug={slug}
                onSuccess={() => router.refresh()}
            />
            <CreateExamDialog
                open={examenOpen}
                onOpenChange={setExamenOpen}
                groups={groups}
                slug={slug}
                onSuccess={() => router.refresh()}
            />
        </div>
    );
}
