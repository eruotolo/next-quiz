'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Tag } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { setCourseCategories } from '@/features/lms/actions/categories';

interface CategoryOption {
    id: string;
    name: string;
}

interface Props {
    slug: string;
    courseId: string;
    availableCategories: CategoryOption[];
    initialSelectedIds: string[];
}

export function CourseCategoriesPanel({
    slug,
    courseId,
    availableCategories,
    initialSelectedIds,
}: Props) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setSelectedIds(initialSelectedIds);
    }, [initialSelectedIds]);

    const selectedCategories = availableCategories.filter((c) => selectedIds.includes(c.id));

    function toggle(id: string) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    }

    function save() {
        startTransition(async () => {
            const result = await setCourseCategories(slug, courseId, selectedIds);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Categorías actualizadas');
            setPickerOpen(false);
            router.refresh();
        });
    }

    if (availableCategories.length === 0) {
        return (
            <div className="border-border rounded-[10px] border bg-white px-4 py-3">
                <p className="text-mute text-sm">
                    Aún no hay categorías creadas. Creá una en{' '}
                    <a
                        href={`/${slug}/aula/categorias` as `/${string}`}
                        className="text-primary font-semibold"
                    >
                        Categorías
                    </a>
                    .
                </p>
            </div>
        );
    }

    return (
        <div className="border-border rounded-[10px] border bg-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
                {selectedCategories.length === 0 ? (
                    <span className="text-mute text-xs italic">Sin categorías asignadas</span>
                ) : (
                    selectedCategories.map((c) => (
                        <Tag key={c.id} tone="primary" className="px-2 text-[11px] font-bold">
                            {c.name}
                        </Tag>
                    ))
                )}
                <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setPickerOpen((v) => !v)}
                    className="ml-auto gap-1"
                >
                    <Plus size={12} />
                    Asignar categorías
                </Button>
            </div>
            {pickerOpen && (
                <div className="mt-3 border-t pt-3">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar categoría…"
                        className="border-border h-9 rounded-[8px] bg-white text-sm"
                    />
                    <div className="mt-2 flex max-h-[200px] flex-col gap-1 overflow-y-auto">
                        {availableCategories
                            .filter((c) =>
                                query.trim() === ''
                                    ? true
                                    : c.name.toLowerCase().includes(query.toLowerCase()),
                            )
                            .map((c) => {
                                const checked = selectedIds.includes(c.id);
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => toggle(c.id)}
                                        className="hover:bg-paper-warm flex items-center justify-between rounded-[8px] px-2 py-1.5 text-left text-sm"
                                    >
                                        <span className="text-ink font-medium">{c.name}</span>
                                        {checked && (
                                            <span className="text-primary font-bold">✓</span>
                                        )}
                                    </button>
                                );
                            })}
                    </div>
                    <div className="mt-3 flex justify-end gap-2 border-t pt-3">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                setPickerOpen(false);
                                setQuery('');
                                setSelectedIds(initialSelectedIds);
                            }}
                            disabled={isPending}
                        >
                            <X size={14} className="mr-1" />
                            Cancelar
                        </Button>
                        <Button size="sm" variant="ink" onClick={save} disabled={isPending}>
                            {isPending && <Loader2 size={14} className="mr-1 animate-spin" />}
                            Guardar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}