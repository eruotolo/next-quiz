'use client';

import { createGroup, deleteGroup, updateGroup } from '@/features/groups/actions/mutations';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Tag } from '@/shared/components/ui/badge';
import { formatRut } from '@/shared/lib/rut';
import { cn } from '@/shared/lib/utils';
import type { Group } from '@prisma/client';
import { Edit2, GraduationCap, Loader2, MoreHorizontal, Plus, Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
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

interface GroupWithCount extends Group {
    _count: { users: number; exams: number };
    users: StudentInGroup[];
    tutor: TutorInfo | null;
}

interface Props {
    slug: string;
    institutionName: string;
    groups: GroupWithCount[];
    canMutate: boolean;
}

const CARD_COLORS = [
    '#1F2EFF',
    '#7C5CFF',
    '#22C55E',
    '#FF5A4D',
    '#F59E0B',
];

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
}): React.JSX.Element {
    const color = getAvatarColor(name + lastname);
    const initials = getInitials(name, lastname);
    return (
        <div
            className={cn(
                'rounded-full flex items-center justify-center text-white font-bold ring-2 ring-white shrink-0',
                size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-[12px]',
            )}
            style={{ backgroundColor: color }}
        >
            {initials}
        </div>
    );
}

export function GroupsClient({ slug, institutionName, groups, canMutate }: Props): React.JSX.Element {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isDelOpen, setIsDelOpen] = useState(false);
    const [studentsGroup, setStudentsGroup] = useState<GroupWithCount | null>(null);
    const [editing, setEditing] = useState<GroupWithCount | null>(null);
    const [toDelete, setToDelete] = useState<GroupWithCount | null>(null);
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const openCreate = (): void => {
        setEditing(null);
        setName('');
        setError(null);
        setIsOpen(true);
    };
    const openEdit = (g: GroupWithCount): void => {
        setEditing(g);
        setName(g.name);
        setError(null);
        setIsOpen(true);
    };
    const openDelete = (g: GroupWithCount): void => {
        setToDelete(g);
        setDeleteError(null);
        setIsDelOpen(true);
    };

    const handleSave = (): void => {
        if (!name.trim()) {
            setError('El nombre es requerido.');
            return;
        }
        startTransition(async () => {
            const result = editing
                ? await updateGroup(slug, editing.id, { name })
                : await createGroup(slug, { name });
            if (result.error) {
                setError(result.error);
                return;
            }
            setIsOpen(false);
            toast.success(editing ? 'Grupo actualizado' : 'Grupo creado');
            router.refresh();
        });
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

    const totalStudents = groups.reduce((sum, g) => sum + g._count.users, 0);
    const totalExams = groups.reduce((sum, g) => sum + g._count.exams, 0);

    return (
        <div className="flex flex-col min-h-screen bg-paper">
            <AdminTopBar
                breadcrumb={[institutionName, 'Grupos']}
                title="Grupos"
                subtitle={`${groups.length} grupos · ${totalStudents} estudiantes activos · ${totalExams} exámenes históricos`}
                actions={
                    canMutate && (
                        <Button variant="ink" size="md" onClick={openCreate} className="gap-2">
                            <Plus size={16} />
                            Nuevo grupo
                        </Button>
                    )
                }
            />

            <main className="flex-1 p-8 overflow-auto">
                {groups.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <Users size={48} className="mb-4 text-mute/20" />
                        <p className="text-lg font-medium text-ink">Todavía no hay grupos</p>
                        <p className="mt-1 text-sm text-mute">Creá el primero para empezar a organizar alumnos.</p>
                        {canMutate && (
                            <Button variant="primary" size="md" onClick={openCreate} className="mt-6">
                                <Plus size={16} />
                                Crear grupo
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {groups.map((g, idx) => {
                            const color = CARD_COLORS[idx % CARD_COLORS.length];
                            const visibleStudents = g.users.slice(0, 5);
                            const extraStudents = g._count.users - visibleStudents.length;

                            return (
                                <Card
                                    key={g.id}
                                    className="relative flex flex-col border-border bg-white shadow-sm overflow-hidden"
                                    style={{ borderTopWidth: 4, borderTopColor: color }}
                                >
                                    <div className="p-5 flex flex-col">
                                        {/* Header: name + menu */}
                                        <div className="flex items-start justify-between mb-1">
                                            <div>
                                                <h3 className="font-display text-[30px] font-bold leading-none tracking-tight text-ink">
                                                    {g.name}
                                                </h3>
                                                {g.stream && (
                                                    <p className="mt-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-mute">
                                                        {g.stream}
                                                    </p>
                                                )}
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-mute border-0">
                                                        <MoreHorizontal size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl border-border shadow-xl">
                                                    <DropdownMenuItem
                                                        onClick={() => setStudentsGroup(g)}
                                                        className="gap-2 py-2 cursor-pointer"
                                                    >
                                                        <GraduationCap size={14} /> Ver estudiantes
                                                    </DropdownMenuItem>
                                                    {canMutate && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => openEdit(g)}
                                                                className="gap-2 py-2 cursor-pointer"
                                                            >
                                                                <Edit2 size={14} /> Editar nombre
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => openDelete(g)}
                                                                className="text-destructive gap-2 py-2 cursor-pointer"
                                                            >
                                                                <Trash2 size={14} /> Eliminar grupo
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Tutor */}
                                        <div className="flex items-center gap-3 border-y border-border py-3 my-3">
                                            {g.tutor ? (
                                                <>
                                                    <InitialsAvatar name={g.tutor.name} lastname={g.tutor.lastname} size="md" />
                                                    <div>
                                                        <p className="text-[13px] font-semibold text-ink leading-tight">
                                                            {g.tutor.name} {g.tutor.lastname}
                                                        </p>
                                                        <p className="text-[11px] text-mute">Profesor/a tutor/a</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-[12px] text-mute italic">Sin tutor asignado</p>
                                            )}
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-3 gap-3 mb-4">
                                            <div>
                                                <p className="font-display text-[22px] font-bold text-ink leading-none">
                                                    {g._count.users}
                                                </p>
                                                <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-mute">
                                                    Estudiantes
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-display text-[22px] font-bold text-ink leading-none">
                                                    {g._count.exams}
                                                </p>
                                                <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-mute">
                                                    Exámenes
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-display text-[22px] font-bold text-ink leading-none">
                                                    —
                                                </p>
                                                <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-mute">
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
                                                            <InitialsAvatar key={s.id} name={s.name} lastname={s.lastname} />
                                                        ))}
                                                    </div>
                                                    {extraStudents > 0 && (
                                                        <span className="text-[12px] font-medium text-mute">
                                                            +{extraStudents} más
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-[12px] text-mute italic">Sin estudiantes</span>
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
            <Dialog open={studentsGroup !== null} onOpenChange={(o) => !o && setStudentsGroup(null)}>
                <DialogContent className="sm:max-w-xl rounded-[22px] border-border shadow-2xl overflow-hidden p-0">
                    <div className="px-6 py-5 border-b border-border bg-paper">
                        <DialogTitle className="font-display text-2xl text-ink">
                            Estudiantes — {studentsGroup?.name}
                        </DialogTitle>
                    </div>
                    {studentsGroup && studentsGroup.users.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-16 text-center">
                            <GraduationCap size={40} className="text-mute/20" />
                            <p className="text-sm font-medium text-mute">Este grupo no tiene alumnos asignados.</p>
                        </div>
                    ) : (
                        <div className="max-h-[60vh] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-white border-b border-border z-10">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-mute">
                                            Estudiante
                                        </th>
                                        <th className="px-6 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-mute">
                                            RUT
                                        </th>
                                        <th className="px-6 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-mute">
                                            Estado
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {studentsGroup?.users.map((s) => (
                                        <tr key={s.id} className="hover:bg-paper-warm/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className={cn('text-[13.5px] font-bold', s.active ? 'text-ink' : 'text-mute opacity-50')}>
                                                    {s.lastname}, {s.name}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-[12px] text-mute">
                                                {formatRut(s.rut)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Tag
                                                    tone={s.active ? 'success' : 'default'}
                                                    className="font-bold text-[10px] h-5"
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
                    <div className="px-6 py-4 border-t border-border flex justify-end bg-white">
                        <Button variant="ink" size="md" onClick={() => setStudentsGroup(null)}>
                            Cerrar lista
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create/Edit dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="rounded-[22px] border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl">
                            {editing ? 'Editar grupo' : 'Nuevo grupo'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 py-4">
                        <label htmlFor="group-form-name" className="text-[13px] font-bold text-ink">
                            Nombre del grupo
                        </label>
                        <Input
                            id="group-form-name"
                            placeholder="Ej: 4to Año B"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError(null);
                            }}
                            className={cn('h-11 rounded-[10px] border-border bg-white', error && 'border-destructive')}
                            autoFocus
                        />
                        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" size="md" onClick={() => setIsOpen(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button variant="ink" size="md" disabled={isPending} onClick={handleSave}>
                            {isPending && <Loader2 className="animate-spin mr-2" />}
                            {editing ? 'Guardar cambios' : 'Crear grupo'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete dialog */}
            <Dialog open={isDelOpen} onOpenChange={setIsDelOpen}>
                <DialogContent className="sm:max-w-sm rounded-[22px] border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl text-destructive">Eliminar grupo</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-[14px] leading-relaxed text-ink-dim">
                            ¿Estás seguro de eliminar <strong className="text-ink">{toDelete?.name}</strong>?
                            {toDelete && toDelete._count.users > 0
                                ? ` Los ${toDelete._count.users} alumno(s) de este grupo quedarán sin grupo asignado.`
                                : ' Este grupo no tiene alumnos asignados.'}
                        </p>
                    </div>
                    {deleteError && (
                        <p className="bg-danger-wash text-destructive rounded-[10px] px-4 py-2 text-sm font-medium">
                            {deleteError}
                        </p>
                    )}
                    <DialogFooter className="gap-2 sm:justify-end mt-2">
                        <Button variant="ghost" size="md" onClick={() => setIsDelOpen(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button variant="danger" size="md" disabled={isPending} onClick={handleDelete}>
                            {isPending && <Loader2 className="animate-spin mr-2" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
