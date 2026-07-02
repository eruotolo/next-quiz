'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { JSONContent } from '@tiptap/react';
import type { LessonType, LmsLesson } from '@prisma/client';

/** Lección editable en el formulario: omite los campos Mux ya removidos. */
type EditableLesson = Omit<LmsLesson, 'videoAssetId' | 'videoUploadId'>;
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { createLmsLesson, updateLmsLesson } from '@/features/lms/actions/courses';
import { uploadLessonDocument } from '@/features/lms/actions/uploads';
import { upsertLmsAssignment, getLmsAssignmentByLesson } from '@/features/lms/actions/assignments';
import { LESSON_TYPE_LABEL, LESSON_TYPE_OPTIONS } from '@/features/lms/lib/lesson-types';
import { TiptapEditor } from '@/features/lms/components/TiptapEditor';
import { Dropzone } from '@/features/lms/components/Dropzone';
import {
    parseLiveSessionUrl,
    parseVideoEmbedUrl,
    type LiveSessionProvider,
} from '@/features/lms/lib/lesson-url-validators';

const EMPTY_DOC: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] };

/** Extrae las hojas de texto de un JSONContent Tiptap, en orden de documento. */
function extractPlainText(node: unknown): string[] {
    if (!node || typeof node !== 'object') return [];
    const n = node as { text?: string; content?: unknown[] };
    if (typeof n.text === 'string') return [n.text];
    if (Array.isArray(n.content)) return n.content.flatMap(extractPlainText);
    return [];
}

/** Construye un doc Tiptap mínimo (un párrafo, un text node por línea). */
function buildSimpleDoc(text: string): JSONContent {
    const lines = text.split('\n');
    return {
        type: 'doc',
        content: [
            {
                type: 'paragraph',
                content: lines.filter((l) => l.length > 0).map((line) => ({ type: 'text', text: line })),
            },
        ],
    };
}

function toDatetimeLocal(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

const LINK_TYPES: LessonType[] = ['VIDEO', 'ENLACE', 'EN_VIVO'];

function buildLessonPayload(
    type: LessonType,
    title: string,
    textContentJson: JSONContent | null,
    externalLink: string,
    examId: string,
    lesson: EditableLesson | null,
    moduleId: string,
) {
    return {
        moduleId: lesson?.moduleId ?? moduleId,
        title: title.trim(),
        type,
        contentJson: type === 'TEXTO' ? textContentJson : null,
        externalLink: LINK_TYPES.includes(type) ? externalLink.trim() || null : null,
        examId: type === 'EXAMEN' ? examId : null,
        fileUrl: type === 'DOCUMENTO' ? (lesson?.fileUrl ?? null) : null,
        durationSec: lesson?.durationSec ?? null,
    };
}

function validateVideoField(externalLink: string): string | null {
    if (!externalLink.trim()) return 'Pegá la URL de YouTube o Vimeo del video';
    if (!parseVideoEmbedUrl(externalLink.trim())) return 'La URL debe ser de YouTube o Vimeo';
    return null;
}

function validateLiveField(externalLink: string, provider: LiveSessionProvider): string | null {
    if (!externalLink.trim()) return 'Pegá el enlace de la videollamada';
    const parsed = parseLiveSessionUrl(externalLink.trim());
    if (!parsed) return 'La URL debe ser de Google Meet o Zoom';
    if (parsed.provider !== provider) {
        return `La URL no corresponde al proveedor seleccionado (${provider === 'google_meet' ? 'Google Meet' : 'Zoom'})`;
    }
    return null;
}

/** Valida los campos específicos del tipo antes de guardar. Retorna el mensaje de error o null. */
function validateTypeFields(
    type: LessonType,
    examId: string,
    externalLink: string,
    provider: LiveSessionProvider,
): string | null {
    if (type === 'EXAMEN' && !examId) return 'Elegí un examen para esta lección';
    if (type === 'VIDEO') return validateVideoField(externalLink);
    if (type === 'EN_VIVO') return validateLiveField(externalLink, provider);
    return null;
}

/** Guarda instructions/dueAt/maxScore de una lección TAREA. No-op para otros tipos. */
async function saveAssignmentIfNeeded(
    slug: string,
    type: LessonType,
    lessonId: string,
    instructionsJson: JSONContent,
    dueAt: string,
    maxScore: string,
): Promise<{ error?: string }> {
    if (type !== 'TAREA') return {};
    const score = Number.parseInt(maxScore, 10);
    const instructions = extractPlainText(instructionsJson).join('\n').trim();
    const result = await upsertLmsAssignment(slug, {
        lessonId,
        instructions: instructions || null,
        dueAt: dueAt || null,
        maxScore: Number.isFinite(score) && score > 0 ? score : 100,
    });
    return result.error ? { error: result.error } : {};
}

/** Sube el archivo elegido para una lección DOCUMENTO. No-op si no hay archivo nuevo. */
async function uploadDocumentIfNeeded(
    slug: string,
    type: LessonType,
    lessonId: string,
    documentFile: File | null,
): Promise<{ error?: string }> {
    if (type !== 'DOCUMENTO' || !documentFile) return {};
    const formData = new FormData();
    formData.set('file', documentFile);
    const result = await uploadLessonDocument(slug, lessonId, formData);
    return result.error ? { error: result.error } : {};
}

interface SaveLessonParams {
    slug: string;
    moduleId: string;
    lesson: EditableLesson | null;
    type: LessonType;
    title: string;
    textContentJson: JSONContent | null;
    externalLink: string;
    examId: string;
    instructionsJson: JSONContent;
    dueAt: string;
    maxScore: string;
    documentFile: File | null;
}

/** Orquesta el guardado completo de una lección (datos base + tarea + documento). */
async function performLessonSave(
    params: SaveLessonParams,
): Promise<{ error?: string; isEdit: boolean }> {
    const { slug, moduleId, lesson, type, title, textContentJson, externalLink, examId } = params;
    const isEdit = !!lesson;
    const payload = buildLessonPayload(
        type,
        title,
        textContentJson,
        externalLink,
        examId,
        lesson,
        moduleId,
    );

    const result = isEdit
        ? await updateLmsLesson(slug, lesson.id, payload)
        : await createLmsLesson(slug, payload);
    if (result.error || (!isEdit && !result.data)) {
        return { error: result.error ?? 'Error al guardar la lección', isEdit };
    }

    const lessonId = isEdit ? lesson.id : (result.data as { id: string }).id;

    const assignmentResult = await saveAssignmentIfNeeded(
        slug,
        type,
        lessonId,
        params.instructionsJson,
        params.dueAt,
        params.maxScore,
    );
    if (assignmentResult.error) return { error: assignmentResult.error, isEdit };

    const uploadResult = await uploadDocumentIfNeeded(slug, type, lessonId, params.documentFile);
    if (uploadResult.error) return { error: uploadResult.error, isEdit };

    return { isEdit };
}

interface LessonTypeFieldsProps {
    type: LessonType;
    isPending: boolean;
    textContentJson: JSONContent | null;
    onTextContentChange: (v: JSONContent) => void;
    externalLink: string;
    onExternalLinkChange: (v: string) => void;
    linkError: string | null;
    examId: string;
    onExamIdChange: (v: string) => void;
    availableExams: Array<{ id: string; title: string }>;
    loadingAssignment: boolean;
    instructionsJson: JSONContent | null;
    onInstructionsChange: (v: JSONContent) => void;
    dueAt: string;
    onDueAtChange: (v: string) => void;
    maxScore: string;
    onMaxScoreChange: (v: string) => void;
    existingFileUrl: string | null;
    documentFile: File | null;
    onDocumentFileChange: (f: File | null) => void;
    provider: LiveSessionProvider;
    onProviderChange: (v: LiveSessionProvider) => void;
}

/** Campos específicos por tipo de lección, extraídos para no acumular
 * complejidad ciclomática en el componente principal del dialog. */
function LessonTypeFields({
    type,
    isPending,
    textContentJson,
    onTextContentChange,
    externalLink,
    onExternalLinkChange,
    linkError,
    examId,
    onExamIdChange,
    availableExams,
    loadingAssignment,
    instructionsJson,
    onInstructionsChange,
    dueAt,
    onDueAtChange,
    maxScore,
    onMaxScoreChange,
    existingFileUrl,
    documentFile,
    onDocumentFileChange,
    provider,
    onProviderChange,
}: LessonTypeFieldsProps) {
    if (type === 'TEXTO') {
        return (
            <div>
                <Label className="mb-1.5 block">Contenido</Label>
                <TiptapEditor
                    value={textContentJson}
                    onChange={onTextContentChange}
                    disabled={isPending}
                    placeholder="Escribí el contenido de la lección…"
                />
            </div>
        );
    }

    if (type === 'ENLACE') {
        return (
            <div>
                <Label htmlFor="lesson-link" className="mb-1.5 block">
                    Enlace externo (URL)
                </Label>
                <Input
                    id="lesson-link"
                    type="url"
                    value={externalLink}
                    onChange={(e) => onExternalLinkChange(e.target.value)}
                    placeholder="https://…"
                    disabled={isPending}
                />
            </div>
        );
    }

    if (type === 'EXAMEN') {
        return (
            <div>
                <Label className="mb-1.5 block">Examen asociado</Label>
                {availableExams.length === 0 ? (
                    <p className="text-mute text-xs">
                        No hay exámenes creados en esta institución todavía.
                    </p>
                ) : (
                    <Select value={examId} onValueChange={onExamIdChange}>
                        <SelectTrigger className="w-full" disabled={isPending}>
                            <SelectValue placeholder="Elegí un examen" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableExams.map((e) => (
                                <SelectItem key={e.id} value={e.id}>
                                    {e.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
        );
    }

    if (type === 'TAREA') {
        return (
            <div className="flex flex-col gap-3">
                {loadingAssignment && (
                    <p className="text-mute flex items-center gap-1.5 text-xs">
                        <Loader2 size={12} className="animate-spin" /> Cargando configuración…
                    </p>
                )}
                <div>
                    <Label className="mb-1.5 block">Instrucciones</Label>
                    <TiptapEditor
                        value={instructionsJson}
                        onChange={onInstructionsChange}
                        disabled={isPending}
                        placeholder="Qué debe entregar el estudiante…"
                        minHeightClassName="min-h-[100px]"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label htmlFor="lesson-due" className="mb-1.5 block">
                            Fecha de entrega
                        </Label>
                        <Input
                            id="lesson-due"
                            type="datetime-local"
                            value={dueAt}
                            onChange={(e) => onDueAtChange(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                    <div>
                        <Label htmlFor="lesson-maxscore" className="mb-1.5 block">
                            Nota máxima
                        </Label>
                        <Input
                            id="lesson-maxscore"
                            type="number"
                            min={1}
                            max={1000}
                            value={maxScore}
                            onChange={(e) => onMaxScoreChange(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'DOCUMENTO') {
        return (
            <div>
                <Label className="mb-1.5 block">Documento</Label>
                <Dropzone
                    value={documentFile}
                    onChange={onDocumentFileChange}
                    existingFileUrl={existingFileUrl}
                    disabled={isPending}
                />
            </div>
        );
    }

    if (type === 'VIDEO') {
        return (
            <div>
                <Label htmlFor="lesson-video" className="mb-1.5 block">
                    URL del video
                </Label>
                <Input
                    id="lesson-video"
                    type="url"
                    value={externalLink}
                    onChange={(e) => onExternalLinkChange(e.target.value)}
                    placeholder="Pegá la URL de YouTube o Vimeo del video"
                    disabled={isPending}
                />
                {linkError && <p className="text-destructive mt-1.5 text-xs">{linkError}</p>}
            </div>
        );
    }

    // EN_VIVO
    return (
        <div className="flex flex-col gap-3">
            <div>
                <Label className="mb-1.5 block">Proveedor</Label>
                <Select
                    value={provider}
                    onValueChange={(v) => onProviderChange(v as LiveSessionProvider)}
                >
                    <SelectTrigger className="w-full" disabled={isPending}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="google_meet">Google Meet</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="lesson-live-link" className="mb-1.5 block">
                    Enlace de la videollamada
                </Label>
                <Input
                    id="lesson-live-link"
                    type="url"
                    value={externalLink}
                    onChange={(e) => onExternalLinkChange(e.target.value)}
                    placeholder="https://meet.google.com/… o https://zoom.us/…"
                    disabled={isPending}
                />
                {linkError && <p className="text-destructive mt-1.5 text-xs">{linkError}</p>}
            </div>
        </div>
    );
}

interface Props {
    slug: string;
    moduleId: string;
    lesson: EditableLesson | null;
    availableExams: Array<{ id: string; title: string }>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
}

export function LessonFormDialog({
    slug,
    moduleId,
    lesson,
    availableExams,
    open,
    onOpenChange,
    onSaved,
}: Props) {
    const router = useRouter();
    const isEdit = !!lesson;
    const [title, setTitle] = useState(lesson?.title ?? '');
    const [type, setType] = useState<LessonType>(lesson?.type ?? 'TEXTO');
    const [textContentJson, setTextContentJson] = useState<JSONContent | null>(
        (lesson?.contentJson as JSONContent | null) ?? null,
    );
    const [externalLink, setExternalLink] = useState(lesson?.externalLink ?? '');
    const [examId, setExamId] = useState(lesson?.examId ?? '');
    const [instructionsJson, setInstructionsJson] = useState<JSONContent>(EMPTY_DOC);
    const [dueAt, setDueAt] = useState('');
    const [maxScore, setMaxScore] = useState('100');
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [provider, setProvider] = useState<LiveSessionProvider>(
        lesson?.externalLink ? (parseLiveSessionUrl(lesson.externalLink)?.provider ?? 'google_meet') : 'google_meet',
    );
    const [linkError, setLinkError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [loadingAssignment, setLoadingAssignment] = useState(false);

    useEffect(() => {
        if (!open) return;
        setTitle(lesson?.title ?? '');
        setType(lesson?.type ?? 'TEXTO');
        setTextContentJson((lesson?.contentJson as JSONContent | null) ?? null);
        setExternalLink(lesson?.externalLink ?? '');
        setExamId(lesson?.examId ?? '');
        setInstructionsJson(EMPTY_DOC);
        setDueAt('');
        setMaxScore('100');
        setDocumentFile(null);
        setLinkError(null);
        setProvider(
            lesson?.externalLink
                ? (parseLiveSessionUrl(lesson.externalLink)?.provider ?? 'google_meet')
                : 'google_meet',
        );

        if (lesson?.type === 'TAREA') {
            setLoadingAssignment(true);
            getLmsAssignmentByLesson(slug, lesson.id)
                .then((result) => {
                    if (result.data) {
                        setInstructionsJson(buildSimpleDoc(result.data.instructions ?? ''));
                        setDueAt(toDatetimeLocal(result.data.dueAt));
                        setMaxScore(String(result.data.maxScore));
                    }
                })
                .finally(() => setLoadingAssignment(false));
        }
    }, [
        open,
        lesson?.id,
        lesson?.title,
        lesson?.type,
        lesson?.contentJson,
        lesson?.externalLink,
        lesson?.examId,
        slug,
    ]);

    // type dispara el reset del error, no se lee en el body
    // biome-ignore lint/correctness/useExhaustiveDependencies: type triggers reset, not read in body
    useEffect(() => {
        setLinkError(null);
    }, [type]);

    const handleSave = () => {
        if (!title.trim()) {
            toast.error('El título es requerido');
            return;
        }
        const typeError = validateTypeFields(type, examId, externalLink, provider);
        if (typeError) {
            setLinkError(typeError);
            toast.error(typeError);
            return;
        }

        startTransition(async () => {
            const outcome = await performLessonSave({
                slug,
                moduleId,
                lesson,
                type,
                title,
                textContentJson,
                externalLink,
                examId,
                instructionsJson,
                dueAt,
                maxScore,
                documentFile,
            });
            if (outcome.error) {
                toast.error(outcome.error);
                return;
            }
            toast.success(outcome.isEdit ? 'Lección actualizada' : 'Lección creada');
            router.refresh();
            onSaved();
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Editar lección' : 'Nueva lección'}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div>
                        <Label htmlFor="lesson-title" className="mb-1.5 block">
                            Título
                        </Label>
                        <Input
                            id="lesson-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Introducción a variables"
                            disabled={isPending}
                            autoFocus
                        />
                    </div>

                    <div>
                        <Label className="mb-1.5 block">Tipo de lección</Label>
                        <Select value={type} onValueChange={(v) => setType(v as LessonType)}>
                            <SelectTrigger className="w-full" disabled={isPending}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {LESSON_TYPE_OPTIONS.map((t) => (
                                    <SelectItem key={t} value={t}>
                                        {LESSON_TYPE_LABEL[t]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <LessonTypeFields
                        type={type}
                        isPending={isPending}
                        textContentJson={textContentJson}
                        onTextContentChange={setTextContentJson}
                        externalLink={externalLink}
                        onExternalLinkChange={(v) => {
                            setExternalLink(v);
                            setLinkError(null);
                        }}
                        linkError={linkError}
                        examId={examId}
                        onExamIdChange={setExamId}
                        availableExams={availableExams}
                        loadingAssignment={loadingAssignment}
                        instructionsJson={instructionsJson}
                        onInstructionsChange={setInstructionsJson}
                        dueAt={dueAt}
                        onDueAtChange={setDueAt}
                        maxScore={maxScore}
                        onMaxScoreChange={setMaxScore}
                        existingFileUrl={lesson?.fileUrl ?? null}
                        documentFile={documentFile}
                        onDocumentFileChange={setDocumentFile}
                        provider={provider}
                        onProviderChange={setProvider}
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={isPending || !title.trim()}>
                        {isPending && <Loader2 size={14} className="animate-spin" />}
                        {isEdit ? 'Guardar cambios' : 'Crear lección'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
