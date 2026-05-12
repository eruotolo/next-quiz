'use client';

import { deleteQuestion, upsertQuestion } from '@/actions/exams';
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
import type { Exam, Group, Option, Question } from '@prisma/client';
import { ArrowLeft, BookOpen, Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

type QuestionWithOptions = Question & { options: Option[] };
type ExamWithAll = Exam & { group: Group; questions: QuestionWithOptions[] };

interface OptionDraft {
    _key: string;
    id?: string;
    text: string;
    isCorrect: boolean;
}

interface QuestionDraft {
    id?: string;
    text: string;
    points: number;
    options: OptionDraft[];
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
let keyCounter = 0;
const nextKey = (): string => `opt-${++keyCounter}`;

function defaultQuestionDraft(): QuestionDraft {
    return {
        text: '',
        points: 1,
        options: [
            { _key: nextKey(), text: '', isCorrect: true },
            { _key: nextKey(), text: '', isCorrect: false },
            { _key: nextKey(), text: '', isCorrect: false },
            { _key: nextKey(), text: '', isCorrect: false },
        ],
    };
}

export function ExamEditorClient({ exam }: { exam: ExamWithAll }) {
    const router = useRouter();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isDelOpen, onOpen: onDelOpen, onOpenChange: onDelOpenChange } = useDisclosure();

    const [draft, setDraft] = useState<QuestionDraft | null>(null);
    const [draftOrder, setDraftOrder] = useState(0);
    const [toDeleteId, setToDeleteId] = useState<string | null>(null);
    const [qErrors, setQErrors] = useState<{
        text?: string;
        options?: string;
        general?: string;
    }>({});
    const [isPending, startTransition] = useTransition();

    const openNew = (): void => {
        setDraft(defaultQuestionDraft());
        setDraftOrder(exam.questions.length);
        setQErrors({});
        onOpen();
    };

    const openEdit = (q: QuestionWithOptions, order: number): void => {
        setDraft({
            id: q.id,
            text: q.text,
            points: q.points,
            options: q.options.map((o) => ({
                _key: o.id,
                id: o.id,
                text: o.text,
                isCorrect: o.isCorrect,
            })),
        });
        setDraftOrder(order);
        setQErrors({});
        onOpen();
    };

    const confirmDelete = (id: string): void => {
        setToDeleteId(id);
        onDelOpen();
    };

    const setDraftText = (text: string): void => {
        setDraft((d) => (d ? { ...d, text } : d));
        setQErrors((e) => ({ ...e, text: undefined }));
    };

    const setDraftPoints = (points: number): void => {
        setDraft((d) => (d ? { ...d, points } : d));
    };

    const setOptionText = (i: number, text: string): void => {
        setDraft((d) => {
            if (!d) return d;
            const options = d.options.map((o, idx) => (idx === i ? { ...o, text } : o));
            return { ...d, options };
        });
        setQErrors((e) => ({ ...e, options: undefined }));
    };

    const setCorrect = (i: number): void => {
        setDraft((d) => {
            if (!d) return d;
            return {
                ...d,
                options: d.options.map((o, idx) => ({ ...o, isCorrect: idx === i })),
            };
        });
    };

    const addOption = (): void => {
        setDraft((d) => {
            if (!d || d.options.length >= 6) return d;
            return {
                ...d,
                options: [...d.options, { _key: nextKey(), text: '', isCorrect: false }],
            };
        });
    };

    const removeOption = (i: number): void => {
        setDraft((d) => {
            if (!d || d.options.length <= 2) return d;
            const options = d.options.filter((_, idx) => idx !== i);
            if (!options.some((o) => o.isCorrect) && options[0]) {
                options[0] = { ...options[0], isCorrect: true };
            }
            return { ...d, options };
        });
    };

    const validate = (): boolean => {
        const errs: { text?: string; options?: string } = {};
        if (!draft?.text.trim()) errs.text = 'El texto de la pregunta es requerido.';
        if (draft?.options.some((o) => !o.text.trim()))
            errs.options = 'Todas las opciones deben tener texto.';
        if (!draft?.options.some((o) => o.isCorrect))
            errs.options = 'Debe marcarse una opción como correcta.';
        setQErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSaveQ = (close: () => void): void => {
        if (!validate() || !draft) return;
        startTransition(async () => {
            try {
                await upsertQuestion(exam.id, draft, draftOrder);
                close();
                router.refresh();
            } catch {
                setQErrors({ general: 'Ocurrió un error. Intentá de nuevo.' });
            }
        });
    };

    const handleDeleteQ = (close: () => void): void => {
        if (!toDeleteId) return;
        startTransition(async () => {
            await deleteQuestion(toDeleteId, exam.id);
            close();
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/exams"
                    className="border-default-200 text-default-600 hover:bg-default-50 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-white transition-colors"
                >
                    <ArrowLeft size={16} />
                </Link>
                <div>
                    <h1 className="text-default-900 text-2xl font-bold">{exam.title}</h1>
                    <p className="text-default-500 text-sm">
                        {exam.group.name} · {exam.timeLimit} min · {exam.questions.length} pregunta
                        {exam.questions.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Questions */}
            <div className="space-y-3">
                {exam.questions.length === 0 ? (
                    <div className="border-default-200 flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white py-16">
                        <BookOpen size={36} className="text-default-300 mb-3" />
                        <p className="text-default-500 font-medium">
                            Este examen no tiene preguntas
                        </p>
                        <p className="text-default-400 mt-1 text-sm">
                            Agregá la primera para empezar.
                        </p>
                    </div>
                ) : (
                    exam.questions.map((q, idx) => (
                        <div
                            key={q.id}
                            className="border-default-100 rounded-2xl border bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold">
                                    {idx + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-default-900 leading-snug font-medium">
                                        {q.text}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {q.options.map((o, oi) => (
                                            <span
                                                key={o.id}
                                                className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-medium ${
                                                    o.isCorrect
                                                        ? 'bg-success-50 text-success-700 ring-success-200 ring-1'
                                                        : 'bg-default-100 text-default-600'
                                                }`}
                                            >
                                                {LETTERS[oi]}) {o.text}
                                                {o.isCorrect && ' ✓'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        radius="lg"
                                        onPress={() => openEdit(q, idx)}
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="danger"
                                        radius="lg"
                                        isIconOnly
                                        onPress={() => confirmDelete(q.id)}
                                    >
                                        <Trash2 size={13} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Button
                color="primary"
                radius="full"
                startContent={<Plus size={16} />}
                onPress={openNew}
            >
                Agregar pregunta
            </Button>

            {/* Question create/edit modal */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
                <ModalContent>
                    {(close) => (
                        <>
                            <ModalHeader>
                                {draft?.id ? 'Editar pregunta' : 'Nueva pregunta'}
                            </ModalHeader>
                            <ModalBody className="gap-5">
                                {qErrors.general && (
                                    <p className="bg-danger-50 text-danger rounded-xl px-4 py-2 text-sm">
                                        {qErrors.general}
                                    </p>
                                )}
                                <Input
                                    label="Texto de la pregunta"
                                    placeholder="Ej: ¿Cuál es la capital de Chile?"
                                    value={draft?.text ?? ''}
                                    onValueChange={setDraftText}
                                    variant="bordered"
                                    radius="lg"
                                    isInvalid={!!qErrors.text}
                                    errorMessage={qErrors.text}
                                    autoFocus
                                />
                                <Input
                                    label="Puntos"
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={String(draft?.points ?? 1)}
                                    onValueChange={(v) => setDraftPoints(Number(v) || 1)}
                                    variant="bordered"
                                    radius="lg"
                                    className="max-w-[120px]"
                                />

                                <div>
                                    <div className="mb-3 flex items-center justify-between">
                                        <p className="text-default-700 text-sm font-medium">
                                            Opciones{' '}
                                            <span className="text-default-400 font-normal">
                                                (hacé clic en la letra para marcar la correcta)
                                            </span>
                                        </p>
                                        {(draft?.options.length ?? 0) < 6 && (
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                radius="lg"
                                                startContent={<Plus size={12} />}
                                                onPress={addOption}
                                            >
                                                Agregar opción
                                            </Button>
                                        )}
                                    </div>
                                    {qErrors.options && (
                                        <p className="text-danger mb-2 text-sm">
                                            {qErrors.options}
                                        </p>
                                    )}
                                    <div className="space-y-2">
                                        {draft?.options.map((opt, i) => (
                                            <div key={opt._key} className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setCorrect(i)}
                                                    title="Marcar como correcta"
                                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                                                        opt.isCorrect
                                                            ? 'border-success bg-success text-white shadow-sm'
                                                            : 'border-default-200 text-default-400 hover:border-success/60 hover:text-success'
                                                    }`}
                                                >
                                                    {LETTERS[i]}
                                                </button>
                                                <Input
                                                    placeholder={`Opción ${LETTERS[i]}`}
                                                    value={opt.text}
                                                    onValueChange={(v) => setOptionText(i, v)}
                                                    variant="bordered"
                                                    radius="lg"
                                                    size="sm"
                                                    className="flex-1"
                                                />
                                                {(draft?.options.length ?? 0) > 2 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOption(i)}
                                                        className="text-default-400 hover:bg-danger-50 hover:text-danger flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
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
                                    onPress={() => handleSaveQ(close)}
                                >
                                    Guardar pregunta
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Delete question confirmation */}
            <Modal isOpen={isDelOpen} onOpenChange={onDelOpenChange} size="sm">
                <ModalContent>
                    {(close) => (
                        <>
                            <ModalHeader className="text-danger">Eliminar pregunta</ModalHeader>
                            <ModalBody>
                                <p className="text-default-600">
                                    ¿Estás seguro de eliminar esta pregunta? Esta acción no se puede
                                    deshacer.
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
                                    onPress={() => handleDeleteQ(close)}
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
