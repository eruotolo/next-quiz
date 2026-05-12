'use client';

import { createStudent, deleteStudent, updateStudent } from '@/actions/students';
import { RutInput } from '@/components/inputs/RutInput';
import { formatRut } from '@/lib/rut';
import {
    Button,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    useDisclosure,
} from '@heroui/react';
import type { Group, User } from '@prisma/client';
import { Edit2, GraduationCap, Plus, Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface StudentWithGroup extends User {
    group: Group | null;
}

interface Props {
    students: StudentWithGroup[];
    groups: Group[];
}

interface FormState {
    name: string;
    lastname: string;
    email: string;
    rut: string;
    groupId: string;
}

const emptyForm: FormState = { name: '', lastname: '', email: '', rut: '', groupId: '' };

export function StudentsClient({ students, groups }: Props) {
    const router = useRouter();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isDelOpen, onOpen: onDelOpen, onOpenChange: onDelOpenChange } = useDisclosure();
    const [editing, setEditing] = useState<StudentWithGroup | null>(null);
    const [toDelete, setToDelete] = useState<StudentWithGroup | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'general', string>>>({});
    const [isPending, startTransition] = useTransition();

    const setField = (field: keyof FormState, value: string): void => {
        setForm((f) => ({ ...f, [field]: value }));
        setErrors((e) => ({ ...e, [field]: undefined }));
    };

    const openCreate = (): void => {
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
        onOpen();
    };

    const openEdit = (s: StudentWithGroup): void => {
        setEditing(s);
        setForm({
            name: s.name,
            lastname: s.lastname,
            email: s.email,
            rut: formatRut(s.rut),
            groupId: s.groupId ?? '',
        });
        setErrors({});
        onOpen();
    };

    const openDelete = (s: StudentWithGroup): void => {
        setToDelete(s);
        onDelOpen();
    };

    const validate = (): boolean => {
        const next: Partial<Record<keyof FormState, string>> = {};
        if (!form.name.trim()) next.name = 'Nombre requerido';
        if (!form.lastname.trim()) next.lastname = 'Apellido requerido';
        if (!form.email.includes('@')) next.email = 'Email inválido';
        if (!form.rut.trim()) next.rut = 'RUT requerido';
        if (!form.groupId) next.groupId = 'Seleccioná un grupo';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSave = (close: () => void): void => {
        if (!validate()) return;
        startTransition(async () => {
            try {
                if (editing) await updateStudent(editing.id, form);
                else await createStudent(form);
                close();
                router.refresh();
            } catch (err: unknown) {
                const msg =
                    err instanceof Error && err.message.includes('Unique constraint')
                        ? 'Ya existe un alumno con ese email o RUT.'
                        : 'Ocurrió un error. Intentá de nuevo.';
                setErrors({ general: msg });
            }
        });
    };

    const handleDelete = (close: () => void): void => {
        if (!toDelete) return;
        startTransition(async () => {
            await deleteStudent(toDelete.id);
            close();
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-default-900 text-2xl font-bold">Alumnos</h1>
                    <p className="text-default-500 text-sm">
                        {students.length} alumnos registrados
                    </p>
                </div>
                <Button
                    color="primary"
                    radius="full"
                    startContent={<Plus size={16} />}
                    onPress={openCreate}
                >
                    Nuevo alumno
                </Button>
            </div>

            {students.length === 0 ? (
                <div className="border-default-200 flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white py-20">
                    <GraduationCap size={40} className="text-default-300 mb-3" />
                    <p className="text-default-500 font-medium">Todavía no hay alumnos</p>
                    <p className="text-default-400 mt-1 text-sm">
                        Creá el primero para empezar a organizar tu aula.
                    </p>
                    <Button
                        className="mt-4"
                        color="primary"
                        size="sm"
                        radius="full"
                        onPress={openCreate}
                    >
                        Agregar alumno
                    </Button>
                </div>
            ) : (
                <div className="border-default-100 overflow-hidden rounded-2xl border bg-white shadow-sm">
                    <table className="w-full">
                        <thead className="border-default-100 bg-default-50 border-b">
                            <tr>
                                <th className="text-default-500 px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Alumno
                                </th>
                                <th className="text-default-500 px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    RUT
                                </th>
                                <th className="text-default-500 px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Grupo
                                </th>
                                <th className="text-default-500 px-6 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-default-50 divide-y">
                            {students.map((s) => (
                                <tr key={s.id} className="hover:bg-default-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                                                {s.name[0]}
                                                {s.lastname[0]}
                                            </div>
                                            <div>
                                                <p className="text-default-900 font-medium">
                                                    {s.name} {s.lastname}
                                                </p>
                                                <p className="text-default-400 text-sm">
                                                    {s.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-default-600 px-6 py-4 font-mono text-sm">
                                        {formatRut(s.rut)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {s.group ? (
                                            <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
                                                <Users size={12} />
                                                {s.group.name}
                                            </span>
                                        ) : (
                                            <span className="text-default-400 text-sm">
                                                Sin grupo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                radius="lg"
                                                startContent={<Edit2 size={13} />}
                                                onPress={() => openEdit(s)}
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color="danger"
                                                radius="lg"
                                                startContent={<Trash2 size={13} />}
                                                onPress={() => openDelete(s)}
                                            >
                                                Eliminar
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create/Edit modal */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
                <ModalContent>
                    {(close) => (
                        <>
                            <ModalHeader>{editing ? 'Editar alumno' : 'Nuevo alumno'}</ModalHeader>
                            <ModalBody className="gap-4">
                                {errors.general && (
                                    <p className="bg-danger-50 text-danger rounded-xl px-4 py-2 text-sm">
                                        {errors.general}
                                    </p>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="Nombre"
                                        value={form.name}
                                        onValueChange={(v) => setField('name', v)}
                                        variant="bordered"
                                        radius="lg"
                                        isInvalid={!!errors.name}
                                        errorMessage={errors.name}
                                        autoFocus
                                    />
                                    <Input
                                        label="Apellido"
                                        value={form.lastname}
                                        onValueChange={(v) => setField('lastname', v)}
                                        variant="bordered"
                                        radius="lg"
                                        isInvalid={!!errors.lastname}
                                        errorMessage={errors.lastname}
                                    />
                                </div>
                                <Input
                                    label="Email"
                                    type="email"
                                    value={form.email}
                                    onValueChange={(v) => setField('email', v)}
                                    variant="bordered"
                                    radius="lg"
                                    isInvalid={!!errors.email}
                                    errorMessage={errors.email}
                                />
                                <RutInput
                                    label="RUT"
                                    value={form.rut}
                                    onChange={(v) => setField('rut', v)}
                                    error={errors.rut}
                                />
                                <Select
                                    label="Grupo"
                                    selectedKeys={
                                        form.groupId ? new Set([form.groupId]) : new Set()
                                    }
                                    onSelectionChange={(keys) => {
                                        if (keys !== 'all') {
                                            const val = Array.from(keys)[0];
                                            setField('groupId', val ? String(val) : '');
                                        }
                                    }}
                                    variant="bordered"
                                    radius="lg"
                                    isInvalid={!!errors.groupId}
                                    errorMessage={errors.groupId}
                                >
                                    {groups.map((g) => (
                                        <SelectItem key={g.id}>{g.name}</SelectItem>
                                    ))}
                                </Select>
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
                                    {editing ? 'Guardar cambios' : 'Crear alumno'}
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
                            <ModalHeader className="text-danger">Eliminar alumno</ModalHeader>
                            <ModalBody>
                                <p className="text-default-600">
                                    ¿Estás seguro de eliminar a{' '}
                                    <strong>
                                        {toDelete?.name} {toDelete?.lastname}
                                    </strong>
                                    ? Esta acción no se puede deshacer.
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
