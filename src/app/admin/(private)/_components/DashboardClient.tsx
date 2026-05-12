'use client';

import { createExam } from '@/actions/exams';
import { createGroup } from '@/actions/groups';
import { createStudent } from '@/actions/students';
import { RutInput } from '@/components/inputs/RutInput';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { Group } from '@prisma/client';
import {
    BarChart3,
    BookOpen,
    ChevronDown,
    GraduationCap,
    Loader2,
    Plus,
    Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isValidRut, normalizeRut } from '@/lib/rut';
import { useEffect, useRef, useState, useTransition } from 'react';

interface Stats {
    groups: number;
    students: number;
    exams: number;
    results: number;
    activeExams: number;
}

interface Props {
    firstName: string;
    stats: Stats;
    groups: Group[];
}

type ModalType = 'grupo' | 'alumno' | 'examen' | null;

const statCards = [
    {
        label: 'Grupos',
        key: 'groups' as keyof Stats,
        icon: Users,
        bg: '#dbeafe',
        fg: '#1d4ed8',
        modal: 'grupo' as ModalType,
    },
    {
        label: 'Alumnos',
        key: 'students' as keyof Stats,
        icon: GraduationCap,
        bg: '#ede9fe',
        fg: '#6d28d9',
        modal: 'alumno' as ModalType,
    },
    {
        label: 'Exámenes',
        key: 'exams' as keyof Stats,
        icon: BookOpen,
        bg: '#fef3c7',
        fg: '#b45309',
        modal: 'examen' as ModalType,
    },
    {
        label: 'Resultados',
        key: 'results' as keyof Stats,
        icon: BarChart3,
        bg: '#d1fae5',
        fg: '#047857',
        modal: null,
    },
] as const;

const quickActions = [
    {
        label: 'Nuevo examen',
        desc: 'Crear y activar exámenes',
        stripe: '#fbbf24',
        icon: BookOpen,
        iconBg: '#fef3c7',
        iconFg: '#b45309',
        modal: 'examen' as ModalType,
    },
    {
        label: 'Nuevo alumno',
        desc: 'Agregar un alumno a un grupo',
        stripe: '#a78bfa',
        icon: GraduationCap,
        iconBg: '#ede9fe',
        iconFg: '#6d28d9',
        modal: 'alumno' as ModalType,
    },
    {
        label: 'Nuevo grupo',
        desc: 'Organizar alumnos en grupos',
        stripe: '#60a5fa',
        icon: Users,
        iconBg: '#dbeafe',
        iconFg: '#1d4ed8',
        modal: 'grupo' as ModalType,
    },
] as const;

export function DashboardClient({ firstName, stats, groups }: Props) {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [isPending, startTransition] = useTransition();

    const [grupoOpen, setGrupoOpen] = useState(false);
    const [alumnoOpen, setAlumnoOpen] = useState(false);
    const [examenOpen, setExamenOpen] = useState(false);

    const [groupName, setGroupName] = useState('');
    const [groupError, setGroupError] = useState<string | null>(null);

    const [studentForm, setStudentForm] = useState({
        name: '',
        lastname: '',
        email: '',
        rut: '',
        groupId: '',
    });
    const [studentErrors, setStudentErrors] = useState<Record<string, string>>({});

    const [examForm, setExamForm] = useState({
        title: '',
        timeLimit: '30',
        groupIds: [] as string[],
        active: false,
        maxGrade: '7',
        passingGrade: '4',
        passingPercentage: '60',
    });
    const [examErrors, setExamErrors] = useState<Record<string, string>>({});

    const openModal = (type: ModalType): void => {
        setMenuOpen(false);
        if (type === 'grupo') {
            setGroupName('');
            setGroupError(null);
            setGrupoOpen(true);
        }
        if (type === 'alumno') {
            setStudentForm({ name: '', lastname: '', email: '', rut: '', groupId: '' });
            setStudentErrors({});
            setAlumnoOpen(true);
        }
        if (type === 'examen') {
            setExamForm({ title: '', timeLimit: '30', groupIds: [], active: false, maxGrade: '7', passingGrade: '4', passingPercentage: '60' });
            setExamErrors({});
            setExamenOpen(true);
        }
    };

    useEffect(() => {
        const handler = (e: MouseEvent): void => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleCreateGroup = (): void => {
        if (!groupName.trim()) {
            setGroupError('El nombre es requerido.');
            return;
        }
        startTransition(async () => {
            try {
                await createGroup({ name: groupName });
                setGrupoOpen(false);
                router.refresh();
            } catch {
                setGroupError('Ocurrió un error. Intentá de nuevo.');
            }
        });
    };

    const handleCreateStudent = (): void => {
        const errs: Record<string, string> = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!studentForm.name.trim()) errs.name = 'Nombre requerido';
        if (!studentForm.lastname.trim()) errs.lastname = 'Apellido requerido';
        if (!emailRegex.test(studentForm.email)) errs.email = 'Email inválido';
        if (!studentForm.rut.trim()) {
            errs.rut = 'RUT requerido';
        } else if (!isValidRut(normalizeRut(studentForm.rut))) {
            errs.rut = 'RUT inválido';
        }
        if (!studentForm.groupId) errs.groupId = 'Seleccioná un grupo';
        if (Object.keys(errs).length) {
            setStudentErrors(errs);
            return;
        }
        startTransition(async () => {
            try {
                await createStudent(studentForm);
                setAlumnoOpen(false);
                router.refresh();
            } catch (err: unknown) {
                const msg =
                    err instanceof Error && err.message.includes('Unique constraint')
                        ? 'Ya existe un alumno con ese email o RUT.'
                        : 'Ocurrió un error. Intentá de nuevo.';
                setStudentErrors({ general: msg });
            }
        });
    };

    const toggleExamGroup = (id: string): void => {
        setExamForm((f) => ({
            ...f,
            groupIds: f.groupIds.includes(id)
                ? f.groupIds.filter((g) => g !== id)
                : [...f.groupIds, id],
        }));
        setExamErrors((e) => ({ ...e, groupIds: undefined as unknown as string }));
    };

    const handleCreateExam = (): void => {
        const errs: Record<string, string> = {};
        if (!examForm.title.trim()) errs.title = 'Título requerido';
        const tl = Number(examForm.timeLimit);
        if (!examForm.timeLimit || Number.isNaN(tl) || tl < 1 || tl > 180)
            errs.timeLimit = 'Entre 1 y 180 minutos';
        if (examForm.groupIds.length === 0) errs.groupIds = 'Seleccioná al menos un grupo';
        const mg = Number(examForm.maxGrade);
        const pg = Number(examForm.passingGrade);
        const pp = Number(examForm.passingPercentage);
        if (Number.isNaN(mg) || mg < 1 || mg > 10) errs.maxGrade = 'Entre 1 y 10';
        if (Number.isNaN(pg) || pg < 1 || pg >= mg) errs.passingGrade = `Entre 1 y ${examForm.maxGrade} (exclusivo)`;
        if (Number.isNaN(pp) || pp < 1 || pp > 99) errs.passingPercentage = 'Entre 1 y 99';
        if (Object.keys(errs).length) {
            setExamErrors(errs);
            return;
        }
        startTransition(async () => {
            try {
                await createExam({
                    ...examForm,
                    timeLimit: Number(examForm.timeLimit),
                    maxGrade: Number(examForm.maxGrade),
                    passingGrade: Number(examForm.passingGrade),
                    passingPercentage: Number(examForm.passingPercentage),
                });
                setExamenOpen(false);
                router.refresh();
            } catch {
                setExamErrors({ general: 'Ocurrió un error. Intentá de nuevo.' });
            }
        });
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-extrabold tracking-tight text-foreground">
                        Hola, {firstName} <span className="inline-block -rotate-[10deg]">👋</span>
                    </h1>
                    <p className="mt-1 text-[14px] text-muted-foreground">
                        Aquí está el resumen de tu plataforma de exámenes.
                    </p>
                </div>

                {/* Dropdown Crear */}
                <div ref={menuRef} className="relative">
                    <Button
                        className="rounded-full"
                        onClick={() => setMenuOpen((v) => !v)}
                    >
                        <Plus size={15} />
                        Crear
                        <ChevronDown size={14} />
                    </Button>
                    {menuOpen && (
                        <div className="absolute right-0 top-full z-50 mt-2 min-w-[240px] rounded-[14px] border border-border bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
                            {[
                                {
                                    label: 'Nuevo examen',
                                    desc: 'Crear y activar exámenes',
                                    icon: BookOpen,
                                    modal: 'examen' as ModalType,
                                },
                                {
                                    label: 'Nuevo alumno',
                                    desc: 'Agregar un alumno a un grupo',
                                    icon: GraduationCap,
                                    modal: 'alumno' as ModalType,
                                },
                                {
                                    label: 'Nuevo grupo',
                                    desc: 'Organizar alumnos en grupos',
                                    icon: Users,
                                    modal: 'grupo' as ModalType,
                                },
                            ].map(({ label, desc, icon: Icon, modal }) => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => openModal(modal)}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors first:rounded-t-[14px] last:rounded-b-[14px] hover:bg-muted/50"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <Icon size={15} className="text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-[13.5px] font-semibold text-foreground">
                                            {label}
                                        </p>
                                        <p className="text-[11.5px] text-muted-foreground">{desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {statCards.map(({ label, key, icon: Icon, bg, fg, modal }) => (
                    <div
                        key={key}
                        className="relative rounded-2xl border border-border bg-white p-[22px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    >
                        {modal && (
                            <button
                                type="button"
                                onClick={() => openModal(modal)}
                                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-[9px] border border-border bg-white text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-white"
                                title={`Nuevo ${label.slice(0, -1).toLowerCase()}`}
                            >
                                <Plus size={13} />
                            </button>
                        )}
                        <div
                            className="mb-4 flex h-[44px] w-[44px] items-center justify-center rounded-xl"
                            style={{ backgroundColor: bg }}
                        >
                            <Icon size={20} style={{ color: fg }} />
                        </div>
                        <p className="text-[30px] font-extrabold leading-none tracking-tight text-foreground">
                            {stats[key]}
                        </p>
                        <p className="mt-1 text-[13px] font-medium text-muted-foreground">{label}</p>
                    </div>
                ))}
            </div>

            {/* Active exams banner */}
            {stats.activeExams > 0 && (
                <div className="flex items-center gap-4 rounded-[14px] border border-success/30 bg-success/10 px-5 py-[14px]">
                    <div className="h-[10px] w-[10px] shrink-0 animate-pulse rounded-full bg-success" />
                    <p className="text-[14px] font-medium text-success">
                        {stats.activeExams} examen{stats.activeExams > 1 ? 'es' : ''} activo
                        {stats.activeExams > 1 ? 's' : ''} en este momento.
                    </p>
                </div>
            )}

            {/* Quick access */}
            <div>
                <h2 className="mb-3.5 text-[16px] font-bold text-foreground">Acceso rápido</h2>
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                    {quickActions.map(({ label, desc, stripe, icon: Icon, iconBg, iconFg, modal }) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => openModal(modal)}
                            className="flex items-center gap-4 rounded-2xl border border-border bg-white p-[18px] text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md"
                            style={{ borderLeftWidth: 4, borderLeftColor: stripe }}
                        >
                            <div
                                className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[11px]"
                                style={{ backgroundColor: iconBg }}
                            >
                                <Icon size={18} style={{ color: iconFg }} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[14px] font-semibold text-foreground">{label}</p>
                                <p className="mt-0.5 text-[12.5px] text-muted-foreground">{desc}</p>
                            </div>
                            <Plus size={16} className="shrink-0 text-muted-foreground" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Dialog — Nuevo grupo */}
            <Dialog open={grupoOpen} onOpenChange={setGrupoOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nuevo grupo</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-1.5 py-2">
                        <label className="text-sm font-medium text-foreground">
                            Nombre del grupo
                        </label>
                        <Input
                            placeholder="Ej: 4to Año B"
                            value={groupName}
                            onChange={(e) => {
                                setGroupName(e.target.value);
                                setGroupError(null);
                            }}
                            className={groupError ? 'border-destructive' : ''}
                            autoFocus
                        />
                        {groupError && <p className="text-sm text-destructive">{groupError}</p>}
                        <p className="text-[12.5px] text-muted-foreground">
                            Luego podrás asignar alumnos y exámenes a este grupo.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setGrupoOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="rounded-full"
                            disabled={isPending}
                            onClick={handleCreateGroup}
                        >
                            {isPending && <Loader2 className="animate-spin" />}
                            Crear grupo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog — Nuevo alumno */}
            <Dialog open={alumnoOpen} onOpenChange={setAlumnoOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Nuevo alumno</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                        {studentErrors.general && (
                            <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                                {studentErrors.general}
                            </p>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">Nombre</label>
                                <Input
                                    value={studentForm.name}
                                    onChange={(e) =>
                                        setStudentForm((f) => ({ ...f, name: e.target.value }))
                                    }
                                    className={studentErrors.name ? 'border-destructive' : ''}
                                    autoFocus
                                />
                                {studentErrors.name && (
                                    <p className="text-xs text-destructive">{studentErrors.name}</p>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">Apellido</label>
                                <Input
                                    value={studentForm.lastname}
                                    onChange={(e) =>
                                        setStudentForm((f) => ({ ...f, lastname: e.target.value }))
                                    }
                                    className={studentErrors.lastname ? 'border-destructive' : ''}
                                />
                                {studentErrors.lastname && (
                                    <p className="text-xs text-destructive">
                                        {studentErrors.lastname}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Email</label>
                            <Input
                                type="email"
                                value={studentForm.email}
                                onChange={(e) =>
                                    setStudentForm((f) => ({ ...f, email: e.target.value }))
                                }
                                className={studentErrors.email ? 'border-destructive' : ''}
                            />
                            {studentErrors.email && (
                                <p className="text-xs text-destructive">{studentErrors.email}</p>
                            )}
                        </div>
                        <RutInput
                            label="RUT"
                            value={studentForm.rut}
                            onChange={(v) => setStudentForm((f) => ({ ...f, rut: v }))}
                            error={studentErrors.rut}
                        />
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Grupo</label>
                            <Select
                                value={studentForm.groupId}
                                onValueChange={(v) =>
                                    setStudentForm((f) => ({ ...f, groupId: v }))
                                }
                            >
                                <SelectTrigger
                                    className={studentErrors.groupId ? 'border-destructive' : ''}
                                >
                                    <SelectValue placeholder="Seleccioná un grupo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {groups.map((g) => (
                                        <SelectItem key={g.id} value={g.id}>
                                            {g.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {studentErrors.groupId && (
                                <p className="text-xs text-destructive">{studentErrors.groupId}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setAlumnoOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="rounded-full"
                            disabled={isPending}
                            onClick={handleCreateStudent}
                        >
                            {isPending && <Loader2 className="animate-spin" />}
                            Crear alumno
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog — Nuevo examen */}
            <Dialog open={examenOpen} onOpenChange={setExamenOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nuevo examen</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                        {examErrors.general && (
                            <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                                {examErrors.general}
                            </p>
                        )}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">
                                Título del examen
                            </label>
                            <Input
                                placeholder="Ej: Matemáticas — Unidad 3"
                                value={examForm.title}
                                onChange={(e) =>
                                    setExamForm((f) => ({ ...f, title: e.target.value }))
                                }
                                className={examErrors.title ? 'border-destructive' : ''}
                                autoFocus
                            />
                            {examErrors.title && (
                                <p className="text-xs text-destructive">{examErrors.title}</p>
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
                                value={examForm.timeLimit}
                                onChange={(e) =>
                                    setExamForm((f) => ({ ...f, timeLimit: e.target.value }))
                                }
                                className={examErrors.timeLimit ? 'border-destructive' : ''}
                            />
                            {examErrors.timeLimit && (
                                <p className="text-xs text-destructive">{examErrors.timeLimit}</p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Grupos</label>
                            <div
                                className={`max-h-[140px] overflow-y-auto rounded-lg border ${examErrors.groupIds ? 'border-destructive' : 'border-border'}`}
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
                                                checked={examForm.groupIds.includes(g.id)}
                                                onChange={() => toggleExamGroup(g.id)}
                                                className="h-4 w-4 accent-primary"
                                            />
                                            <span className="text-sm text-foreground">{g.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                            {examErrors.groupIds && (
                                <p className="text-xs text-destructive">{examErrors.groupIds}</p>
                            )}
                        </div>
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
                                        value={examForm.maxGrade}
                                        onChange={(e) =>
                                            setExamForm((f) => ({ ...f, maxGrade: e.target.value }))
                                        }
                                        className="text-center"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">
                                        Aprobación
                                    </label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={10}
                                        step={0.1}
                                        value={examForm.passingGrade}
                                        onChange={(e) =>
                                            setExamForm((f) => ({
                                                ...f,
                                                passingGrade: e.target.value,
                                            }))
                                        }
                                        className="text-center"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">% mínimo</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={99}
                                        value={examForm.passingPercentage}
                                        onChange={(e) =>
                                            setExamForm((f) => ({
                                                ...f,
                                                passingPercentage: e.target.value,
                                            }))
                                        }
                                        className="text-center"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch
                                id="exam-active-new"
                                checked={examForm.active}
                                onCheckedChange={(v) =>
                                    setExamForm((f) => ({ ...f, active: v }))
                                }
                                className="data-[state=checked]:bg-success"
                            />
                            <label
                                htmlFor="exam-active-new"
                                className="cursor-pointer text-sm"
                            >
                                Activar examen al crearlo
                            </label>
                        </div>
                        <div className="rounded-[12px] bg-muted/50 px-4 py-3 text-[12.5px] text-muted-foreground">
                            Después de crearlo vas a poder agregarle preguntas desde el editor.
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setExamenOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="rounded-full"
                            disabled={isPending}
                            onClick={handleCreateExam}
                        >
                            {isPending && <Loader2 className="animate-spin" />}
                            Crear examen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
