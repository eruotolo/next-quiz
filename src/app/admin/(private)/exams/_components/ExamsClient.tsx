'use client';

import { createExam, deleteExam, toggleExamActive, updateExam } from '@/actions/exams';
import {
    Button,
    Chip,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Switch,
    useDisclosure,
} from '@heroui/react';
import type { Exam, Group } from '@prisma/client';
import { BookOpen, Clock, Edit2, HelpCircle, Plus, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface ExamWithCount extends Exam {
    group: Group;
    _count: { questions: number };
}

interface FormState {
    title: string;
    timeLimit: string;
    groupId: string;
    active: boolean;
}

const emptyForm: FormState = { title: '', timeLimit: '30', groupId: '', active: false };

export function ExamsClient({ exams, groups }: { exams: ExamWithCount[]; groups: Group[] }) {
    const router = useRouter();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isDelOpen, onOpen: onDelOpen, onOpenChange: onDelOpenChange } = useDisclosure();
    const [editing, setEditing] = useState<ExamWithCount | null>(null);
    const [toDelete, setToDelete] = useState<ExamWithCount | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'general', string>>>({});
    const [isPending, startTransition] = useTransition();

    const setField = <K extends keyof FormState>(field: K, value: FormState[K]): void => {
        setForm((f) => ({ ...f, [field]: value }));
        setErrors((e) => ({ ...e, [field]: undefined }));
    };

    const openCreate = (): void => {
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
        onOpen();
    };

    const openEdit = (exam: ExamWithCount): void => {
        setEditing(exam);
        setForm({
            title: exam.title,
            timeLimit: String(exam.timeLimit),
            groupId: exam.groupId,
            active: exam.active,
        });
        setErrors({});
        onOpen();
    };

    const openDelete = (exam: ExamWithCount): void => {
        setToDelete(exam);
        onDelOpen();
    };

    const validate = (): boolean => {
        const next: Partial<Record<keyof FormState, string>> = {};
        if (!form.title.trim()) next.title = 'Título requerido';
        const tl = Number(form.timeLimit);
        if (!form.timeLimit || Number.isNaN(tl) || tl < 1 || tl > 180)
            next.timeLimit = 'Entre 1 y 180 minutos';
        if (!form.groupId) next.groupId = 'Seleccioná un grupo';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSave = (close: () => void): void => {
        if (!validate()) return;
        startTransition(async () => {
            try {
                const data = { ...form, timeLimit: Number(form.timeLimit) };
                if (editing) await updateExam(editing.id, data);
                else await createExam(data);
                close();
                router.refresh();
            } catch {
                setErrors({ general: 'Ocurrió un error. Intentá de nuevo.' });
            }
        });
    };

    const handleDelete = (close: () => void): void => {
        if (!toDelete) return;
        startTransition(async () => {
            await deleteExam(toDelete.id);
            close();
            router.refresh();
        });
    };

    const handleToggle = (id: string, active: boolean): void => {
        startTransition(async () => {
            await toggleExamActive(id, active);
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-default-900 text-2xl font-bold">Exámenes</h1>
                    <p className="text-default-500 text-sm">{exams.length} exámenes creados</p>
                </div>
                <Button
                    color="primary"
                    radius="full"
                    startContent={<Plus size={16} />}
                    onPress={openCreate}
                >
                    Nuevo examen
                </Button>
            </div>

            {exams.length === 0 ? (
                <div className="border-default-200 flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white py-20">
                    <BookOpen size={40} className="text-default-300 mb-3" />
                    <p className="text-default-500 font-medium">Todavía no hay exámenes</p>
                    <p className="text-default-400 mt-1 text-sm">
                        Creá el primero y luego añadile preguntas.
                    </p>
                    <Button
                        className="mt-4"
                        color="primary"
                        size="sm"
                        radius="full"
                        onPress={openCreate}
                    >
                        Crear examen
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {exams.map((exam) => (
                        <div
                            key={exam.id}
                            className="border-default-100 flex flex-col rounded-2xl border bg-white p-6 shadow-sm"
                        >
                            <div className="mb-3 flex items-start justify-between gap-2">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                                    <BookOpen size={20} className="text-amber-600" />
                                </div>
                                <Chip
                                    size="sm"
                                    variant="flat"
                                    color={exam.active ? 'success' : 'default'}
                                    className="shrink-0"
                                >
                                    {exam.active ? 'Activo' : 'Inactivo'}
                                </Chip>
                            </div>

                            <h3 className="text-default-900 leading-snug font-semibold">
                                {exam.title}
                            </h3>

                            <div className="text-default-500 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                                <span className="flex items-center gap-1">
                                    <Clock size={13} />
                                    {exam.timeLimit} min
                                </span>
                                <span className="flex items-center gap-1">
                                    <HelpCircle size={13} />
                                    {exam._count.questions} pregunta
                                    {exam._count.questions !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <p className="text-default-400 mt-1 text-xs">{exam.group.name}</p>

                            <div className="mt-4 flex items-center gap-2">
                                <Switch
                                    size="sm"
                                    isSelected={exam.active}
                                    onValueChange={(v) => handleToggle(exam.id, v)}
                                    isDisabled={isPending}
                                    color="success"
                                >
                                    <span className="text-default-500 text-xs">
                                        {exam.active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </Switch>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button
                                    as={Link}
                                    href={`/admin/exams/${exam.id}/edit`}
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    radius="lg"
                                    startContent={<Settings size={13} />}
                                >
                                    Preguntas
                                </Button>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    radius="lg"
                                    startContent={<Edit2 size={13} />}
                                    onPress={() => openEdit(exam)}
                                >
                                    Editar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="danger"
                                    radius="lg"
                                    startContent={<Trash2 size={13} />}
                                    onPress={() => openDelete(exam)}
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
                            <ModalHeader>{editing ? 'Editar examen' : 'Nuevo examen'}</ModalHeader>
                            <ModalBody className="gap-4">
                                {errors.general && (
                                    <p className="bg-danger-50 text-danger rounded-xl px-4 py-2 text-sm">
                                        {errors.general}
                                    </p>
                                )}
                                <Input
                                    label="Título del examen"
                                    placeholder="Ej: Matemáticas — Unidad 3"
                                    value={form.title}
                                    onValueChange={(v) => setField('title', v)}
                                    variant="bordered"
                                    radius="lg"
                                    isInvalid={!!errors.title}
                                    errorMessage={errors.title}
                                    autoFocus
                                />
                                <Input
                                    label="Tiempo límite (minutos)"
                                    type="number"
                                    min={1}
                                    max={180}
                                    value={form.timeLimit}
                                    onValueChange={(v) => setField('timeLimit', v)}
                                    variant="bordered"
                                    radius="lg"
                                    isInvalid={!!errors.timeLimit}
                                    errorMessage={errors.timeLimit}
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
                                    {editing ? 'Guardar cambios' : 'Crear examen'}
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
                            <ModalHeader className="text-danger">Eliminar examen</ModalHeader>
                            <ModalBody>
                                <p className="text-default-600">
                                    ¿Estás seguro de eliminar{' '}
                                    <strong>&ldquo;{toDelete?.title}&rdquo;</strong>? Se eliminarán
                                    todas las preguntas y resultados asociados.
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
