'use client';

import { createGroup, deleteGroup, updateGroup } from '@/actions/groups';
import {
    Button,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    useDisclosure,
} from '@heroui/react';
import type { Group } from '@prisma/client';
import { Edit2, Plus, Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface GroupWithCount extends Group {
    _count: { users: number; exams: number };
}

export function GroupsClient({ groups }: { groups: GroupWithCount[] }) {
    const router = useRouter();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isDelOpen, onOpen: onDelOpen, onOpenChange: onDelOpenChange } = useDisclosure();
    const [editing, setEditing] = useState<GroupWithCount | null>(null);
    const [toDelete, setToDelete] = useState<GroupWithCount | null>(null);
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const openCreate = (): void => {
        setEditing(null);
        setName('');
        setError(null);
        onOpen();
    };
    const openEdit = (g: GroupWithCount): void => {
        setEditing(g);
        setName(g.name);
        setError(null);
        onOpen();
    };
    const openDelete = (g: GroupWithCount): void => {
        setToDelete(g);
        onDelOpen();
    };

    const handleSave = (close: () => void): void => {
        if (!name.trim()) {
            setError('El nombre es requerido.');
            return;
        }
        startTransition(async () => {
            try {
                if (editing) await updateGroup(editing.id, { name });
                else await createGroup({ name });
                close();
                router.refresh();
            } catch {
                setError('Ocurrió un error. Intentá de nuevo.');
            }
        });
    };

    const handleDelete = (close: () => void): void => {
        if (!toDelete) return;
        startTransition(async () => {
            await deleteGroup(toDelete.id);
            close();
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-default-900 text-2xl font-bold">Grupos</h1>
                    <p className="text-default-500 text-sm">{groups.length} grupos registrados</p>
                </div>
                <Button
                    color="primary"
                    radius="full"
                    startContent={<Plus size={16} />}
                    onPress={openCreate}
                >
                    Nuevo grupo
                </Button>
            </div>

            {groups.length === 0 ? (
                <div className="border-default-200 flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white py-20">
                    <Users size={40} className="text-default-300 mb-3" />
                    <p className="text-default-500 font-medium">Todavía no hay grupos</p>
                    <p className="text-default-400 mt-1 text-sm">
                        Creá el primero para empezar a organizar alumnos.
                    </p>
                    <Button
                        className="mt-4"
                        color="primary"
                        size="sm"
                        radius="full"
                        onPress={openCreate}
                    >
                        Crear grupo
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groups.map((g) => (
                        <div
                            key={g.id}
                            className="border-default-100 rounded-2xl border bg-white p-6 shadow-sm"
                        >
                            <div className="bg-primary/10 mb-4 flex h-11 w-11 items-center justify-center rounded-xl">
                                <Users size={20} className="text-primary" />
                            </div>
                            <h3 className="text-default-900 font-semibold">{g.name}</h3>
                            <p className="text-default-500 mt-1 text-sm">
                                {g._count.users} alumno{g._count.users !== 1 ? 's' : ''} ·{' '}
                                {g._count.exams} examen{g._count.exams !== 1 ? 'es' : ''}
                            </p>
                            <div className="mt-4 flex gap-2">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    radius="lg"
                                    startContent={<Edit2 size={13} />}
                                    onPress={() => openEdit(g)}
                                >
                                    Editar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="danger"
                                    radius="lg"
                                    startContent={<Trash2 size={13} />}
                                    onPress={() => openDelete(g)}
                                >
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit modal */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(close) => (
                        <>
                            <ModalHeader>{editing ? 'Editar grupo' : 'Nuevo grupo'}</ModalHeader>
                            <ModalBody>
                                <Input
                                    label="Nombre del grupo"
                                    placeholder="Ej: 4to Año B"
                                    value={name}
                                    onValueChange={(v) => {
                                        setName(v);
                                        setError(null);
                                    }}
                                    variant="bordered"
                                    radius="lg"
                                    isInvalid={!!error}
                                    errorMessage={error ?? undefined}
                                    autoFocus
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    variant="flat"
                                    radius="full"
                                    onPress={close}
                                    isDisabled={isPending}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    radius="full"
                                    isLoading={isPending}
                                    onPress={() => handleSave(close)}
                                >
                                    {editing ? 'Guardar cambios' : 'Crear grupo'}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Delete modal */}
            <Modal isOpen={isDelOpen} onOpenChange={onDelOpenChange} size="sm">
                <ModalContent>
                    {(close) => (
                        <>
                            <ModalHeader className="text-danger">Eliminar grupo</ModalHeader>
                            <ModalBody>
                                <p className="text-default-600">
                                    ¿Estás seguro de eliminar <strong>{toDelete?.name}</strong>? Se
                                    eliminarán también sus alumnos y exámenes asociados.
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    variant="flat"
                                    radius="full"
                                    onPress={close}
                                    isDisabled={isPending}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    color="danger"
                                    radius="full"
                                    isLoading={isPending}
                                    onPress={() => handleDelete(close)}
                                >
                                    Eliminar
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
