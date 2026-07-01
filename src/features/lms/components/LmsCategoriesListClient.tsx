'use client';

import { useState, useTransition } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tag } from '@/shared/components/ui/badge';
import { Plus, Pencil, Trash2, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
    createLmsCategory,
    deleteLmsCategory,
    updateLmsCategory,
} from '@/features/lms/actions/categories';
import { LmsCategoryDialog } from './LmsCategoryDialog';
import type { LmsCategoryInput } from '@/features/lms/schemas/category.schemas';

interface CategoryRow {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    order: number;
    isBundle: boolean;
    bundlePrice: number | null;
    isPublic: boolean;
    _count: { courses: number };
}

interface CourseOption {
    id: string;
    title: string;
}

interface Props {
    slug: string;
    categories: CategoryRow[];
    courses: CourseOption[];
}

export function LmsCategoriesListClient({ slug, categories, courses }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<CategoryRow | null>(null);
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    function handleNew() {
        setEditing(null);
        setOpen(true);
    }

    function handleEdit(c: CategoryRow) {
        setEditing(c);
        setOpen(true);
    }

    function handleSubmit(data: LmsCategoryInput) {
        startTransition(async () => {
            const result = editing
                ? await updateLmsCategory(slug, editing.id, data)
                : await createLmsCategory(slug, data);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success(editing ? 'Categoría actualizada' : 'Categoría creada');
            setOpen(false);
            router.refresh();
        });
    }

    function handleDelete(c: CategoryRow) {
        if (!confirm(`¿Eliminar la categoría "${c.name}"? Los cursos NO se eliminan.`)) return;
        setDeletingId(c.id);
        startTransition(async () => {
            const result = await deleteLmsCategory(slug, c.id);
            setDeletingId(null);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Categoría eliminada');
            router.refresh();
        });
    }

    return (
        <div className="flex flex-col gap-6">
            <header className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-ink font-display text-3xl font-bold">Categorías</h1>
                    <p className="text-mute mt-1 text-sm">
                        Agrupá cursos por categoría. Una categoría puede venderse como Pack
                        Completo.
                    </p>
                </div>
                <Button onClick={handleNew} variant="primary" size="md" className="gap-1.5">
                    <Plus size={16} />
                    Nueva categoría
                </Button>
            </header>

            {categories.length === 0 ? (
                <Card className="border-border flex flex-col items-center gap-2 p-12 text-center">
                    <p className="text-ink font-display text-lg font-bold">
                        Aún no hay categorías
                    </p>
                    <p className="text-mute text-sm">
                        Creá la primera para empezar a agrupar cursos.
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {categories.map((c) => (
                        <Card
                            key={c.id}
                            className="border-border p-4 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <p className="text-ink truncate font-display text-base font-bold">
                                        {c.name}
                                    </p>
                                    <p className="text-mute mt-0.5 font-mono text-[11px]">
                                        /{c.slug}
                                    </p>
                                </div>
                                {c.isBundle && (
                                    <Tag tone="primary" className="shrink-0 px-2 text-[10px]">
                                        <Package size={10} className="mr-1" />
                                        Pack
                                    </Tag>
                                )}
                            </div>
                            {c.description && (
                                <p className="text-mute mt-2 line-clamp-2 text-xs">
                                    {c.description}
                                </p>
                            )}
                            <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-mute text-[11px]">
                                        {c._count.courses}{' '}
                                        {c._count.courses === 1 ? 'curso' : 'cursos'}
                                    </span>
                                    {c.isBundle && c.bundlePrice !== null && (
                                        <span className="text-primary text-[12px] font-bold">
                                            ${new Intl.NumberFormat('es-CL').format(c.bundlePrice)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        size="icon-sm"
                                        variant="ghost"
                                        onClick={() => handleEdit(c)}
                                        aria-label="Editar"
                                    >
                                        <Pencil size={14} />
                                    </Button>
                                    <Button
                                        size="icon-sm"
                                        variant="ghost"
                                        onClick={() => handleDelete(c)}
                                        disabled={deletingId === c.id || isPending}
                                        className="text-destructive"
                                        aria-label="Eliminar"
                                    >
                                        {deletingId === c.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={14} />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <LmsCategoryDialog
                open={open}
                onOpenChange={setOpen}
                category={
                    editing
                        ? {
                              name: editing.name,
                              slug: editing.slug,
                              description: editing.description,
                              order: editing.order,
                              isBundle: editing.isBundle,
                              bundlePrice: editing.bundlePrice,
                              isPublic: editing.isPublic,
                          }
                        : null
                }
                courses={courses}
                onSubmit={handleSubmit}
                isPending={isPending}
            />
        </div>
    );
}