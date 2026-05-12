'use client';

import { createGroup, deleteGroup, updateGroup } from '@/actions/groups';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Group } from '@prisma/client';
import { Edit2, Loader2, Plus, Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface GroupWithCount extends Group {
    _count: { users: number; exams: number };
}

export function GroupsClient({ groups }: { groups: GroupWithCount[] }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isDelOpen, setIsDelOpen] = useState(false);
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
                    <h1 className="text-2xl font-bold text-foreground">Grupos</h1>
                    <p className="text-sm text-muted-foreground">{groups.length} grupos registrados</p>
                </div>
                <Button className="rounded-full" onClick={openCreate}>
                    <Plus size={16} />
                    Nuevo grupo
                </Button>
            </div>

            {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-20">
                    <Users size={40} className="mb-3 text-muted-foreground/40" />
                    <p className="font-medium text-muted-foreground">Todavía no hay grupos</p>
                    <p className="mt-1 text-sm text-muted-foreground/70">
                        Creá el primero para empezar a organizar alumnos.
                    </p>
                    <Button className="mt-4 rounded-full" size="sm" onClick={openCreate}>
                        Crear grupo
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groups.map((g) => (
                        <div
                            key={g.id}
                            className="rounded-2xl border border-border bg-white p-6 shadow-sm"
                        >
                            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                                <Users size={20} className="text-primary" />
                            </div>
                            <h3 className="font-semibold text-foreground">{g.name}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {g._count.users} alumno{g._count.users !== 1 ? 's' : ''} ·{' '}
                                {g._count.exams} examen{g._count.exams !== 1 ? 'es' : ''}
                            </p>
                            <div className="mt-4 flex gap-2">
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
                                    className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => openDelete(g)}
                                >
                                    <Trash2 size={13} />
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar grupo' : 'Nuevo grupo'}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-1.5 py-2">
                        <label className="text-sm font-medium text-foreground">
                            Nombre del grupo
                        </label>
                        <Input
                            placeholder="Ej: 4to Año B"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError(null);
                            }}
                            className={error ? 'border-destructive' : ''}
                            autoFocus
                        />
                        {error && <p className="text-sm text-destructive">{error}</p>}
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
                        <Button
                            className="rounded-full"
                            disabled={isPending}
                            onClick={handleSave}
                        >
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
                    <p className="text-sm text-muted-foreground">
                        ¿Estás seguro de eliminar{' '}
                        <strong className="text-foreground">{toDelete?.name}</strong>? Los alumnos
                        del grupo quedarán sin asignación y los exámenes se desvincularán, pero no
                        se eliminarán.
                    </p>
                    {deleteError && (
                        <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
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
