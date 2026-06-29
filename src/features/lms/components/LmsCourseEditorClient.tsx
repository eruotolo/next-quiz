'use client';

import { useState, useTransition } from 'react';
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
} from '@/features/lms/actions/courses';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { GripVertical, Plus, Trash2, BookOpen, FileText, Video, Link2, ClipboardList, Radio, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import type { LmsLesson, LmsModule, LessonType } from '@prisma/client';

interface LessonWithMeta extends LmsLesson {
    _count: { progress: number };
}

interface ModuleWithLessons extends LmsModule {
    lessons: LessonWithMeta[];
}

interface Props {
    slug: string;
    courseId: string;
    modules: ModuleWithLessons[];
}

const LESSON_TYPE_LABEL: Record<LessonType, string> = {
    VIDEO: 'Video',
    DOCUMENTO: 'Documento',
    TEXTO: 'Texto',
    ENLACE: 'Enlace',
    EXAMEN: 'Examen Aulika',
    TAREA: 'Tarea',
    EN_VIVO: 'En vivo',
};

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
    slug,
    onToggleExpand,
    expanded,
    onAddLesson,
    onDeleteLesson,
    onDeleteModule,
}: {
    module: ModuleWithLessons;
    slug: string;
    onToggleExpand: (id: string) => void;
    expanded: boolean;
    onAddLesson: (moduleId: string) => void;
    onDeleteLesson: (lessonId: string, title: string) => void;
    onDeleteModule: (moduleId: string, title: string) => void;
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
                'border-border bg-white rounded-[12px] border shadow-sm',
                isDragging && 'ring-2 ring-primary',
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
                        {module.lessons.length} {module.lessons.length === 1 ? 'lección' : 'lecciones'}
                    </p>
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAddLesson(module.id)}
                >
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
                                <div key={l.id} className="flex items-center gap-3 px-12 py-2.5">
                                    <Icon size={14} />
                                    <p className="text-ink flex-1 text-sm font-medium">{l.title}</p>
                                    <span className="text-mute font-mono text-[10px] tracking-wider uppercase">
                                        {LESSON_TYPE_LABEL[l.type]}
                                    </span>
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

export function LmsCourseEditorClient({ slug, courseId, modules }: Props) {
    const router = useRouter();
    const [items, setItems] = useState<ModuleWithLessons[]>(modules);
    const [expanded, setExpanded] = useState<Set<string>>(new Set(modules.map((m) => m.id)));
    const [newTitle, setNewTitle] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [isPending, startTransition] = useTransition();
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
        const title = window.prompt('Título de la lección:');
        if (!title) return;
        startTransition(async () => {
            const { createLmsLesson } = await import('@/features/lms/actions/courses');
            const result = await createLmsLesson(slug, {
                moduleId,
                title,
                type: 'TEXTO',
            });
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Lección creada');
            router.refresh();
        });
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

    return (
        <Card className="border-border p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-ink font-display text-xl font-bold">Módulos del curso</h2>
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
                    <Button variant="ink" onClick={handleAddModule} disabled={isPending || !newTitle.trim()}>
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
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={items.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col gap-2">
                            {items.map((m) => (
                                <SortableModuleRow
                                    key={m.id}
                                    module={m}
                                    slug={slug}
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
                                    onDeleteLesson={handleDeleteLesson}
                                    onDeleteModule={handleDeleteModule}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </Card>
    );
}
