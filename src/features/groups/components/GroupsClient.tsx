'use client';

import { deleteGroup } from '@/features/groups/actions/mutations';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Tag } from '@/shared/components/ui/badge';
import { formatRut } from '@/shared/lib/rut';
import { cn } from '@/shared/lib/utils';
import { GroupForm } from '@/features/groups/components/GroupForm';
import type { Group } from '@prisma/client';
import { Edit2, GraduationCap, Loader2, MoreHorizontal, Plus, Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';
import { useState, useTransition } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface StudentInGroup {
    id: string;
    name: string;
    lastname: string;
    rut: string;
    active: boolean;
}

interface TutorInfo {
    id: string;
    name: string;
    lastname: string;
}

interface ProgramInfo {
    id: string;
    name: string;
}

interface PeriodInfo {
    id: string;
    name: string;
}

interface CourseOption {
    id: string;
    name: string;
    programId: string | null;
    periodId: string;
}

interface GroupWithCount extends Group {
    _count: { users: number; exams: number };
    users: StudentInGroup[];
    tutor: TutorInfo | null;
    program: ProgramInfo | null;
    period: PeriodInfo | null;
    courseSections: { id: string; name: string }[];
    avgGrade: number | null;
}

interface ProfessorOption {
    id: string;
    name: string;
    lastname: string;
}

interface Props {
    slug: string;
    groups: GroupWithCount[];
    professors: ProfessorOption[];
    programs: ProgramInfo[];
    periods: PeriodInfo[];
    courseSections: CourseOption[];
    canMutate: boolean;
    isDemo?: boolean;
}

const CARD_COLORS = ['#1F2EFF', '#7C5CFF', '#22C55E', '#FF5A4D', '#F59E0B'];

const AVATAR_COLORS = ['#1F2EFF', '#7C5CFF', '#22C55E', '#FF5A4D', '#F59E0B', '#06B6D4', '#EC4899'];

function getAvatarColor(str: string): string {
    let hash = 0;
    for (const char of str) hash = char.charCodeAt(0) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? '#1F2EFF';
}

function getInitials(name: string, lastname: string): string {
    return `${name.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
}

function InitialsAvatar({
    name,
    lastname,
    size = 'sm',
}: {
    name: string;
    lastname: string;
    size?: 'sm' | 'md';
}) {
    const color = getAvatarColor(name + lastname);
    const initials = getInitials(name, lastname);
    return (
        <div
            className={cn(
                'flex shrink-0 items-center justify-center rounded-full [background-color:var(--g-bg)] font-bold text-white ring-2 ring-white',
                size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-[12px]',
            )}
            style={{ '--g-bg': color } as CSSProperties}
        >
            {initials}
        </div>
    );
}

function GroupAcademicTags({
    group,
}: {
    group: {
        program: ProgramInfo | null;
        period: PeriodInfo | null;
        courseSections: { id: string; name: string }[];
    };
}) {
    const { program, period, courseSections } = group;
    if (!program && !period && courseSections.length === 0) return null;
    return (
        <div className="mt-2 flex flex-wrap gap-1.5">
            {program && (
                <Tag tone="default" className="border-border h-5 text-[10px] font-bold">
                    {program.name}
                </Tag>
            )}
            {period && (
                <Tag tone="outline" className="border-border h-5 text-[10px] font-bold">
                    {period.name}
                </Tag>
            )}
            {courseSections.map((cs) => (
                <Tag
                    key={cs.id}
                    tone="outline"
                    className="border-border h-5 text-[10px] font-medium"
                >
                    {cs.name}
                </Tag>
            ))}
        </div>
    );
}

export function GroupsClient({
    slug,
    groups,
    professors,
    programs,
    periods,
    courseSections,
    canMutate,
    isDemo,
}: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isDelOpen, setIsDelOpen] = useState(false);
    const [studentsGroup, setStudentsGroup] = useState<GroupWithCount | null>(null);
    const [editing, setEditing] = useState<GroupWithCount | null>(null);
    const [toDelete, setToDelete] = useState<GroupWithCount | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const openCreate = (): void => {
        setEditing(null);
        setIsOpen(true);
    };
    const openEdit = (g: GroupWithCount): void => {
        setEditing(g);
        setIsOpen(true);
    };
    const openDelete = (g: GroupWithCount): void => {
        setToDelete(g);
        setDeleteError(null);
        setIsDelOpen(true);
    };

    const handleDelete = (): void => {
        if (!toDelete) return;
        startTransition(async () => {
            const result = await deleteGroup(slug, toDelete.id);
            if (result.error) {
                setDeleteError(result.error);
                return;
            }
            setIsDelOpen(false);
            toast.success('Grupo eliminado');
            router.refresh();
        });
    };

    return (
        <>
            {/* ── Subheader ── */}
            <div
                data-tour="groups-header"
                className="border-border flex items-center gap-3 border-b bg-white px-8 py-4"
            >
                <span className="text-mute font-mono text-[11px] font-bold tracking-wider uppercase">
                    {groups.length} grupo{groups.length !== 1 ? 's' : ''}
                </span>
                <div className="flex-1" />
                {canMutate && (
                    <Button variant="ink" size="md" onClick={openCreate} className="gap-2">
                        <Plus size={16} />
                        Crear grupo
                    </Button>
                )}
            </div>
            <main className="flex-1 overflow-auto p-8">
                {groups.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <Users size={48} className="text-mute/20 mb-4" />
                        <p className="text-ink text-lg font-medium">Todavía no hay grupos</p>
                        <p className="text-mute mt-1 text-sm">
                            Crea el primero para empezar a organizar alumnos.
                        </p>
                    </Card>
                ) : (
                    <div
                        data-tour="groups-list"
                        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {groups.map((g, idx) => {
                            const color = CARD_COLORS[idx % CARD_COLORS.length];
                            const visibleStudents = g.users.slice(0, 5);
                            const extraStudents = g._count.users - visibleStudents.length;

                            return (
                                <Card
                                    key={g.id}
                                    className="border-border relative flex flex-col overflow-hidden border-t-[4px] [border-top-color:var(--g-accent)] bg-white shadow-sm"
                                    style={{ '--g-accent': color } as CSSProperties}
                                >
                                    <div className="flex flex-col p-5">
                                        {/* Header: name + menu */}
                                        <div className="mb-1 flex items-start justify-between">
                                            <div>
                                                <h3 className="font-display text-ink text-[30px] leading-none font-bold tracking-tight">
                                                    {g.name}
                                                </h3>
                                                {g.stream && (
                                                    <p className="text-mute mt-1.5 font-mono text-[10px] font-bold tracking-[0.12em] uppercase">
                                                        {g.stream}
                                                    </p>
                                                )}
                                                <GroupAcademicTags group={g} />
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="text-mute h-8 w-8 border-0"
                                                    >
                                                        <MoreHorizontal size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="border-border rounded-xl shadow-xl"
                                                >
                                                    <DropdownMenuItem
                                                        onClick={() => setStudentsGroup(g)}
                                                        className="cursor-pointer gap-2 py-2"
                                                    >
                                                        <GraduationCap size={14} /> Ver estudiantes
                                                    </DropdownMenuItem>
                                                    {canMutate && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => openEdit(g)}
                                                                className="cursor-pointer gap-2 py-2"
                                                            >
                                                                <Edit2 size={14} /> Editar nombre
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => openDelete(g)}
                                                                className="text-destructive cursor-pointer gap-2 py-2"
                                                            >
                                                                <Trash2 size={14} /> Eliminar grupo
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Tutor */}
                                        <div className="border-border my-3 flex items-center gap-3 border-y py-3">
                                            {g.tutor ? (
                                                <>
                                                    <InitialsAvatar
                                                        name={g.tutor.name}
                                                        lastname={g.tutor.lastname}
                                                        size="md"
                                                    />
                                                    <div>
                                                        <p className="text-ink text-[13px] leading-tight font-semibold">
                                                            {g.tutor.name} {g.tutor.lastname}
                                                        </p>
                                                        <p className="text-mute text-[11px]">
                                                            Profesor/a tutor/a
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-mute text-[12px] italic">
                                                    Sin tutor asignado
                                                </p>
                                            )}
                                        </div>

                                        {/* Stats */}
                                        <div className="mb-4 grid grid-cols-3 gap-3">
                                            <div>
                                                <p className="font-display text-ink text-[22px] leading-none font-bold">
                                                    {g._count.users}
                                                </p>
                                                <p className="text-mute mt-1 font-mono text-[9px] font-bold tracking-[0.1em] uppercase">
                                                    Estudiantes
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-display text-ink text-[22px] leading-none font-bold">
                                                    {g._count.exams}
                                                </p>
                                                <p className="text-mute mt-1 font-mono text-[9px] font-bold tracking-[0.1em] uppercase">
                                                    Exámenes
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-display text-ink text-[22px] leading-none font-bold">
                                                    {g.avgGrade !== null
                                                        ? g.avgGrade.toFixed(1)
                                                        : '—'}
                                                </p>
                                                <p className="text-mute mt-1 font-mono text-[9px] font-bold tracking-[0.1em] uppercase">
                                                    Promedio
                                                </p>
                                            </div>
                                        </div>

                                        {/* Student avatar stack */}
                                        <div className="flex items-center gap-2">
                                            {visibleStudents.length > 0 ? (
                                                <>
                                                    <div className="flex -space-x-2">
                                                        {visibleStudents.map((s) => (
                                                            <InitialsAvatar
                                                                key={s.id}
                                                                name={s.name}
                                                                lastname={s.lastname}
                                                            />
                                                        ))}
                                                    </div>
                                                    {extraStudents > 0 && (
                                                        <span className="text-mute text-[12px] font-medium">
                                                            +{extraStudents} más
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-mute text-[12px] italic">
                                                    Sin estudiantes
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Students modal */}
            <Dialog
                open={studentsGroup !== null}
                onOpenChange={(o) => !o && setStudentsGroup(null)}
            >
                <DialogContent className="border-border overflow-hidden rounded-[22px] p-0 shadow-2xl sm:max-w-xl">
                    <div className="border-border bg-paper border-b px-6 py-5">
                        <DialogTitle className="font-display text-ink text-2xl">
                            Estudiantes — {studentsGroup?.name}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Listado de estudiantes asignados al grupo.
                        </DialogDescription>
                    </div>
                    {studentsGroup && studentsGroup.users.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-16 text-center">
                            <GraduationCap size={40} className="text-mute/20" />
                            <p className="text-mute text-sm font-medium">
                                Este grupo no tiene alumnos asignados.
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-[60vh] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="border-border sticky top-0 z-10 border-b bg-white">
                                    <tr>
                                        <th className="text-mute px-6 py-3 text-left font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                            Estudiante
                                        </th>
                                        <th className="text-mute px-6 py-3 text-left font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                            RUT
                                        </th>
                                        <th className="text-mute px-6 py-3 text-center font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                            Estado
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-border divide-y">
                                    {studentsGroup?.users.map((s) => (
                                        <tr
                                            key={s.id}
                                            className="hover:bg-paper-warm/30 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <p
                                                    className={cn(
                                                        'text-[13.5px] font-bold',
                                                        s.active
                                                            ? 'text-ink'
                                                            : 'text-mute opacity-50',
                                                    )}
                                                >
                                                    {s.lastname}, {s.name}
                                                </p>
                                            </td>
                                            <td className="text-mute px-6 py-4 font-mono text-[12px]">
                                                {formatRut(s.rut)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Tag
                                                    tone={s.active ? 'success' : 'default'}
                                                    className="h-5 text-[10px] font-bold"
                                                >
                                                    {s.active ? 'Activa' : 'Inactiva'}
                                                </Tag>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="border-border flex justify-end border-t bg-white px-6 py-4">
                        <Button variant="ink" size="md" onClick={() => setStudentsGroup(null)}>
                            Cerrar lista
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create/Edit dialog (compartido con NewGroupButton) */}
            <GroupForm
                slug={slug}
                open={isOpen}
                onOpenChange={setIsOpen}
                editing={editing}
                professors={professors}
                programs={programs}
                periods={periods}
                courseSections={courseSections}
                disabled={isDemo}
            />

            {/* Delete confirm */}
            <AlertDialog open={isDelOpen} onOpenChange={setIsDelOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">
                            Eliminar grupo
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de eliminar{' '}
                            <strong className="text-ink">{toDelete?.name}</strong>?{' '}
                            {toDelete && toDelete._count.users > 0
                                ? `Los ${toDelete._count.users} alumno(s) de este grupo quedarán sin grupo asignado.`
                                : 'Este grupo no tiene alumnos asignados.'}
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
                            disabled={isPending || isDemo}
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
