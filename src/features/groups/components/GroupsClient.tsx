'use client';

import { createGroup, deleteGroup, updateGroup } from '@/features/groups/actions/mutations';
import { Button } from '@/shared/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { formatRut } from '@/shared/lib/rut';
import type { Group } from '@prisma/client';
import { Edit2, GraduationCap, Loader2, Plus, Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState, useTransition } from 'react';

interface StudentInGroup {
    id: string;
    name: string;
    lastname: string;
    rut: string;
    active: boolean;
}

interface GroupWithCount extends Group {
    _count: { users: number; exams: number };
    users: StudentInGroup[];
}

interface Props {
    groups: GroupWithCount[];
    canMutate: boolean;
}

export function GroupsClient({ groups, canMutate }: Props): React.JSX.Element {
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
            try {
                if (editing) await updateGroup(editing.id, { name });
                else await createGroup({ name });
                setIsOpen(false);
                router.refresh();
            } catch {
                setError('Ocurrió un error. Intentá de nuevo.');
            }
        });
    };

    const handleDelete = (): void => {
        if (!toDelete) return;
        startTransition(async () => {
            try {
                await deleteGroup(toDelete.id);
                setIsDelOpen(false);
                router.refresh();
            } catch {
                setDeleteError('Ocurrió un error al eliminar. Intentá de nuevo.');
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-foreground text-2xl font-bold">Grupos</h1>
                    <p className="text-muted-foreground text-sm">
                        {groups.length} grupos registrados
                    </p>
                </div>
                {canMutate && (
                    <Button className="rounded-full" onClick={openCreate}>
                        <Plus size={16} />
                        Nuevo grupo
                    </Button>
                )}
            </div>

            {groups.length === 0 ? (
                <div className="border-border flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white py-20">
                    <Users size={40} className="text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground font-medium">Todavía no hay grupos</p>
                    <p className="text-muted-foreground/70 mt-1 text-sm">
                        Creá el primero para empezar a organizar alumnos.
                    </p>
                    {canMutate && (
                        <Button className="mt-4 rounded-full" size="sm" onClick={openCreate}>
                            Crear grupo
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groups.map((g) => (
                        <div
                            key={g.id}
                            className="border-border rounded-2xl border bg-white p-6 shadow-sm"
                        >
                            <div className="bg-primary/10 mb-4 flex h-11 w-11 items-center justify-center rounded-xl">
                                <Users size={20} className="text-primary" />
                            </div>
                            <h3 className="text-foreground font-semibold">{g.name}</h3>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {g._count.users} alumno{g._count.users !== 1 ? 's' : ''} ·{' '}
                                {g._count.exams} examen{g._count.exams !== 1 ? 'es' : ''}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-lg"
                                    onClick={() => setStudentsGroup(g)}
                                >
                                    <GraduationCap size={13} />
                                    Ver alumnos
                                </Button>
                                {canMutate && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="rounded-lg"
                                            onClick={() => openEdit(g)}
                                        >
                                            <Edit2 size={13} />
                                            Editar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg"
                                            onClick={() => openDelete(g)}
                                        >
                                            <Trash2 size={13} />
                                            Eliminar
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Students modal */}
            <Dialog open={studentsGroup !== null} onOpenChange={(o) => !o && setStudentsGroup(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Alumnos — {studentsGroup?.name}
                        </DialogTitle>
                    </DialogHeader>
                    {studentsGroup && studentsGroup.users.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                            <GraduationCap size={36} className="text-muted-foreground/40" />
                            <p className="text-muted-foreground text-sm">
                                Este grupo no tiene alumnos asignados.
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-96 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="border-border bg-muted/50 sticky top-0 border-b">
                                    <tr>
                                        <th className="text-muted-foreground px-4 py-2 text-left text-xs font-semibold uppercase">
                                            Alumno
                                        </th>
                                        <th className="text-muted-foreground px-4 py-2 text-left text-xs font-semibold uppercase">
                                            RUT
                                        </th>
                                        <th className="text-muted-foreground px-4 py-2 text-center text-xs font-semibold uppercase">
                                            Estado
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-border divide-y">
                                    {studentsGroup?.users.map((s) => (
                                        <tr key={s.id} className="hover:bg-muted/20">
                                            <td className="px-4 py-3">
                                                <p
                                                    className={`font-medium ${s.active ? 'text-foreground' : 'text-muted-foreground line-through'}`}
                                                >
                                                    {s.lastname}, {s.name}
                                                </p>
                                            </td>
                                            <td className="text-muted-foreground px-4 py-3 font-mono text-xs">
                                                {formatRut(s.rut)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        s.active
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {s.active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setStudentsGroup(null)}
                        >
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create/Edit dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar grupo' : 'Nuevo grupo'}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-1.5 py-2">
                        <label htmlFor="group-name" className="text-foreground text-sm font-medium">
                            Nombre del grupo
                        </label>
                        <Input
                            id="group-name"
                            placeholder="Ej: 4to Año B"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError(null);
                            }}
                            className={error ? 'border-destructive' : ''}
                            autoFocus
                        />
                        {error && <p className="text-destructive text-sm">{error}</p>}
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
                        <Button className="rounded-full" disabled={isPending} onClick={handleSave}>
                            {isPending && <Loader2 className="animate-spin" />}
                            {editing ? 'Guardar cambios' : 'Crear grupo'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete dialog */}
            <Dialog open={isDelOpen} onOpenChange={setIsDelOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Eliminar grupo</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground text-sm">
                        ¿Estás seguro de eliminar{' '}
                        <strong className="text-foreground">{toDelete?.name}</strong>? Los alumnos
                        del grupo quedarán sin asignación y los exámenes se desvincularán, pero no
                        se eliminarán.
                    </p>
                    {deleteError && (
                        <p className="bg-destructive/10 text-destructive rounded-xl px-4 py-2 text-sm">
                            {deleteError}
                        </p>
                    )}
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
                            onClick={handleDelete}
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
