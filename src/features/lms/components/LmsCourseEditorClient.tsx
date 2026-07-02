'use client';

import { useEffect, useState, useTransition } from 'react';
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    createLmsModule,
    deleteLmsModule,
    reorderLmsModules,
    toggleLmsCourseSetting,
} from '@/features/lms/actions/courses';
import { generateLessonSummary } from '@/features/lms/actions/lesson-summary';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Switch } from '@/shared/components/ui/switch';
import {
    GripVertical,
    Plus,
    Trash2,
    BookOpen,
    FileText,
    Video,
    Link2,
    ClipboardList,
    Radio,
    ChevronDown,
    ChevronRight,
    Award,
    Sparkles,
    Loader2,
    Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import type { LmsLesson, LmsModule, LessonType } from '@prisma/client';
import { CourseCategoriesPanel } from './CourseCategoriesPanel';
import { LessonFormDialog } from './LessonFormDialog';
import { LESSON_TYPE_LABEL } from '@/features/lms/lib/lesson-types';

interface LessonWithMeta extends Omit<LmsLesson, 'videoAssetId' | 'videoUploadId'> {
    _count: { progress: number };
}

interface ModuleWithLessons extends LmsModule {
    lessons: LessonWithMeta[];
}

interface Props {
    slug: string;
    courseId: string;
    modules: ModuleWithLessons[];
    certificateEnabled: boolean;
    aiSummaryEnabled: boolean;
    isPublic: boolean;
    /**
     * Si true, la sección de venta (toggle público) se muestra y permite
     * gestionar `isPublic`. El precio se edita solo desde el modal
     * "Editar Curso" (que ya pasa `canEditPrice`).
     */
    canEditPrice: boolean;
    /** Categorías disponibles en la institución. */
    availableCategories: Array<{ id: string; name: string }>;
    /** Categorías ya asignadas al curso. */
    initialSelectedCategoryIds: string[];
    /** Exámenes disponibles en la institución, para lecciones tipo EXAMEN. */
    availableExams: Array<{ id: string; title: string }>;
}

const LESSON_TYPE_ICON: Record<LessonType, React.ComponentType<{ size?: number }>> = {
    VIDEO: Video,
    DOCUMENTO: FileText,
    TEXTO: BookOpen,
    ENLACE: Link2,
    EXAMEN: ClipboardList,
    TAREA: ClipboardList,
    EN_VIVO: Radio,
};

function SortableModuleRow({
    module,
    onToggleExpand,
    expanded,
    onAddLesson,
    onEditLesson,
    onDeleteLesson,
    onDeleteModule,
    onGenerateSummary,
    aiSummaryEnabled,
    generatingId,
}: {
    module: ModuleWithLessons;
    onToggleExpand: (id: string) => void;
    expanded: boolean;
    onAddLesson: (moduleId: string) => void;
    onEditLesson: (lesson: LessonWithMeta) => void;
    onDeleteLesson: (lessonId: string, title: string) => void;
    onDeleteModule: (moduleId: string, title: string) => void;
    onGenerateSummary: (lessonId: string) => void;
    aiSummaryEnabled: boolean;
    generatingId: string | null;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: module.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'border-border rounded-[12px] border bg-white shadow-sm',
                isDragging && 'ring-primary ring-2',
            )}
        >
            <div className="flex items-center gap-2 px-4 py-3">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="text-mute hover:text-ink cursor-grab active:cursor-grabbing"
                    aria-label="Arrastrar módulo"
                >
                    <GripVertical size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => onToggleExpand(module.id)}
                    className="text-mute hover:text-ink"
                    aria-label={expanded ? 'Contraer' : 'Expandir'}
                >
                    {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <div className="flex-1">
                    <p className="text-ink font-display text-[15px] font-bold">{module.title}</p>
                    <p className="text-mute text-xs">
                        {module.lessons.length}{' '}
                        {module.lessons.length === 1 ? 'lección' : 'lecciones'}
                    </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onAddLesson(module.id)}>
                    <Plus size={14} className="mr-1" /> Lección
                </Button>
                <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => onDeleteModule(module.id, module.title)}
                    className="text-destructive"
                    aria-label="Eliminar módulo"
                >
                    <Trash2 size={14} />
                </Button>
            </div>
            {expanded && (
                <div className="border-border divide-border divide-y border-t">
                    {module.lessons.length === 0 ? (
                        <p className="text-mute px-12 py-4 text-xs">
                            Sin lecciones. Agregá la primera con el botón "Lección".
                        </p>
                    ) : (
                        module.lessons.map((l) => {
                            const Icon = LESSON_TYPE_ICON[l.type];
                            return (
                                <div
                                    key={l.id}
                                    className="hover:bg-paper flex items-center gap-3 px-12 py-2.5"
                                >
                                    <Icon size={14} />
                                    <button
                                        type="button"
                                        onClick={() => onEditLesson(l)}
                                        className="text-ink hover:text-primary flex-1 truncate text-left text-sm font-medium"
                                    >
                                        {l.title}
                                    </button>
                                    <span className="text-mute font-mono text-[10px] tracking-wider uppercase">
                                        {LESSON_TYPE_LABEL[l.type]}
                                    </span>
                                    {aiSummaryEnabled && l.type === 'TEXTO' && (
                                        <Button
                                            size="icon-sm"
                                            variant="ghost"
                                            onClick={() => onGenerateSummary(l.id)}
                                            disabled={generatingId === l.id}
                                            title="Generar resumen IA"
                                            className="text-violet-600 hover:text-violet-700"
                                        >
                                            {generatingId === l.id ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : (
                                                <Sparkles size={12} />
                                            )}
                                        </Button>
                                    )}
                                    <Button
                                        size="icon-sm"
                                        variant="ghost"
                                        onClick={() => onDeleteLesson(l.id, l.title)}
                                        className="text-destructive"
                                        aria-label="Eliminar lección"
                                    >
                                        <Trash2 size={12} />
                                    </Button>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

export function LmsCourseEditorClient({
    slug,
    courseId,
    modules,
    certificateEnabled,
    aiSummaryEnabled,
    isPublic,
    canEditPrice,
    availableCategories,
    initialSelectedCategoryIds,
    availableExams,
}: Props) {
    const router = useRouter();
    const [items, setItems] = useState<ModuleWithLessons[]>(modules);
    const [expanded, setExpanded] = useState<Set<string>>(new Set(modules.map((m) => m.id)));
    const [lessonDialog, setLessonDialog] = useState<{
        moduleId: string;
        lesson: LessonWithMeta | null;
    } | null>(null);

    // router.refresh() vuelve a renderizar el Server Component y trae `modules`
    // actualizado, pero useState solo lee su argumento en el mount inicial —
    // sin este efecto, crear/eliminar módulos o lecciones no se reflejaba en
    // la UI hasta recargar la página manualmente (los datos sí persistían).
    useEffect(() => {
        setItems(modules);
    }, [modules]);
    const [newTitle, setNewTitle] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [certEnabled, setCertEnabled] = useState(certificateEnabled);
    const [aiEnabled, setAiEnabled] = useState(aiSummaryEnabled);
    const [publicEnabled, setPublicEnabled] = useState(isPublic);
    const [summaryLoadingId, setSummaryLoadingId] = useState<string | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const oldIndex = items.findIndex((m) => m.id === active.id);
        const newIndex = items.findIndex((m) => m.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        const next = arrayMove(items, oldIndex, newIndex);
        setItems(next);
        startTransition(async () => {
            const result = await reorderLmsModules(slug, {
                courseId,
                moduleIds: next.map((m) => m.id),
            });
            if (result.error) {
                toast.error(result.error);
                setItems(items);
                return;
            }
            toast.success('Orden actualizado');
            router.refresh();
        });
    };

    const handleAddModule = () => {
        if (!newTitle.trim()) return;
        const title = newTitle.trim();
        startTransition(async () => {
            const result = await createLmsModule(slug, courseId, { title });
            if (result.error || !result.data) {
                toast.error(result.error ?? 'Error al crear el módulo');
                return;
            }
            toast.success('Módulo creado');
            setNewTitle('');
            setShowNew(false);
            router.refresh();
        });
    };

    const handleDeleteModule = (moduleId: string, title: string) => {
        if (!confirm(`¿Eliminar el módulo "${title}" y todas sus lecciones?`)) return;
        startTransition(async () => {
            const result = await deleteLmsModule(slug, moduleId);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Módulo eliminado');
            router.refresh();
        });
    };

    const handleAddLesson = (moduleId: string) => {
        setLessonDialog({ moduleId, lesson: null });
    };

    const handleEditLesson = (lesson: LessonWithMeta) => {
        setLessonDialog({ moduleId: lesson.moduleId, lesson });
    };

    const handleDeleteLesson = (lessonId: string, title: string) => {
        if (!confirm(`¿Eliminar la lección "${title}"?`)) return;
        startTransition(async () => {
            const { deleteLmsLesson } = await import('@/features/lms/actions/courses');
            const result = await deleteLmsLesson(slug, lessonId);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Lección eliminada');
            router.refresh();
        });
    };

    const handleToggleCert = (value: boolean) => {
        setCertEnabled(value);
        startTransition(async () => {
            const result = await toggleLmsCourseSetting(
                slug,
                courseId,
                'certificateEnabled',
                value,
            );
            if (result.error) {
                toast.error(result.error);
                setCertEnabled(!value);
            } else {
                toast.success(value ? 'Certificados habilitados' : 'Certificados deshabilitados');
            }
        });
    };

    const handleToggleAi = (value: boolean) => {
        setAiEnabled(value);
        startTransition(async () => {
            const result = await toggleLmsCourseSetting(slug, courseId, 'aiSummaryEnabled', value);
            if (result.error) {
                toast.error(result.error);
                setAiEnabled(!value);
            } else {
                toast.success(value ? 'Resúmenes IA habilitados' : 'Resúmenes IA deshabilitados');
            }
        });
    };

    const handleTogglePublic = (value: boolean) => {
        if (!canEditPrice) {
            toast.error(
                'La venta de cursos B2C solo está disponible para la tienda oficial de Aulika.',
            );
            return;
        }
        setPublicEnabled(value);
        startTransition(async () => {
            const result = await toggleLmsCourseSetting(slug, courseId, 'isPublic', value);
            if (result.error) {
                toast.error(result.error);
                setPublicEnabled(!value);
            } else {
                toast.success(value ? 'Curso publicado en el catálogo B2C' : 'Curso ocultado del catálogo B2C');
                router.refresh();
            }
        });
    };

    const handleGenerateSummary = async (lessonId: string) => {
        setSummaryLoadingId(lessonId);
        try {
            const result = await generateLessonSummary(slug, lessonId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Resumen generado correctamente');
                router.refresh();
            }
        } finally {
            setSummaryLoadingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Categorías del curso (N a N) */}
            <Card className="border-border p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                    <div>
                        <h2 className="text-ink font-display text-sm font-bold">Categorías</h2>
                        <p className="text-mute text-xs">
                            Asigná una o más categorías. Requerido para venta.
                        </p>
                    </div>
                </div>
                <CourseCategoriesPanel
                    slug={slug}
                    courseId={courseId}
                    availableCategories={availableCategories}
                    initialSelectedIds={initialSelectedCategoryIds}
                />
            </Card>

            {/* Configuración académica del curso.
                La venta (precio + B2C) se gestiona desde el modal "Editar Curso"
                y solo está disponible para la tienda oficial de Aulika. */}
            <Card className="border-border divide-border divide-y p-0 shadow-sm">
                <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full">
                            <Award size={15} />
                        </div>
                        <div>
                            <p className="text-ink text-sm font-semibold">
                                Certificados automáticos
                            </p>
                            <p className="text-mute text-xs">
                                Emite PDF al estudiante cuando aprueba el examen del curso.
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={certEnabled}
                        onCheckedChange={handleToggleCert}
                        disabled={isPending}
                        aria-label="Habilitar certificados"
                    />
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                            <Sparkles size={15} />
                        </div>
                        <div>
                            <p className="text-ink text-sm font-semibold">Resúmenes IA (Gemini)</p>
                            <p className="text-mute text-xs">
                                Genera resúmenes automáticos para lecciones de texto.
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={aiEnabled}
                        onCheckedChange={handleToggleAi}
                        disabled={isPending}
                        aria-label="Habilitar resúmenes IA"
                    />
                </div>
                {canEditPrice && (
                    <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                <Globe size={15} />
                            </div>
                            <div>
                                <p className="text-ink text-sm font-semibold">
                                    Curso Público (B2C)
                                </p>
                                <p className="text-mute text-xs">
                                    Lo lista en el catálogo público de la institución para venta
                                    directa.
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={publicEnabled}
                            onCheckedChange={handleTogglePublic}
                            disabled={isPending}
                            aria-label="Habilitar curso público"
                        />
                    </div>
                )}
            </Card>

            <Card className="border-border p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-ink font-display text-xl font-bold">
                            Módulos del curso
                        </h2>
                        <p className="text-mute text-xs">
                            Arrastrá para reordenar. Expandí para ver y editar las lecciones.
                        </p>
                    </div>
                    <Button
                        size="md"
                        variant="primary"
                        onClick={() => setShowNew((v) => !v)}
                        disabled={isPending}
                    >
                        <Plus size={16} className="mr-1" /> Nuevo módulo
                    </Button>
                </div>

                {showNew && (
                    <div className="border-border mb-4 flex items-center gap-2 rounded-[10px] border bg-white p-3">
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Ej: Unidad 1 — Introducción"
                            className="border-border h-10 flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddModule();
                                if (e.key === 'Escape') setShowNew(false);
                            }}
                        />
                        <Button
                            variant="ink"
                            onClick={handleAddModule}
                            disabled={isPending || !newTitle.trim()}
                        >
                            Crear
                        </Button>
                        <Button variant="ghost" onClick={() => setShowNew(false)}>
                            Cancelar
                        </Button>
                    </div>
                )}

                {items.length === 0 ? (
                    <p className="text-mute py-12 text-center text-sm">
                        Este curso aún no tiene módulos. Empezá creando el primero.
                    </p>
                ) : (
                    <DndContext
                        id="lms-course-modules"
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={items.map((m) => m.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="flex flex-col gap-2">
                                {items.map((m) => (
                                    <SortableModuleRow
                                        key={m.id}
                                        module={m}
                                        expanded={expanded.has(m.id)}
                                        onToggleExpand={(id) =>
                                            setExpanded((prev) => {
                                                const next = new Set(prev);
                                                if (next.has(id)) next.delete(id);
                                                else next.add(id);
                                                return next;
                                            })
                                        }
                                        onAddLesson={handleAddLesson}
                                        onEditLesson={handleEditLesson}
                                        onDeleteLesson={handleDeleteLesson}
                                        onDeleteModule={handleDeleteModule}
                                        onGenerateSummary={handleGenerateSummary}
                                        aiSummaryEnabled={aiEnabled}
                                        generatingId={summaryLoadingId}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </Card>

            {lessonDialog && (
                <LessonFormDialog
                    slug={slug}
                    moduleId={lessonDialog.moduleId}
                    lesson={lessonDialog.lesson}
                    availableExams={availableExams}
                    open={!!lessonDialog}
                    onOpenChange={(open) => {
                        if (!open) setLessonDialog(null);
                    }}
                    onSaved={() => {
                        setLessonDialog(null);
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
}
