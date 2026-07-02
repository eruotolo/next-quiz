'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Tag } from '@/shared/components/ui/badge';
import { BookOpen, Edit2, Plus, Trash2, MoreHorizontal, Eye, EyeOff } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Switch } from '@/shared/components/ui/switch';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    createLmsCourse,
    deleteLmsCourse,
    toggleLmsCourseSetting,
    updateLmsCourse,
    updateLmsCoursePrice,
} from '@/features/lms/actions/courses';
import { setCourseCategories } from '@/features/lms/actions/categories';

function formatCLP(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
    }).format(amount);
}

interface CourseSectionOption {
    id: string;
    name: string;
}

interface CategoryOption {
    id: string;
    name: string;
}

interface CourseCategoryLite {
    category: {
        id: string;
        name: string;
        isBundle: boolean;
        bundlePrice: number | null;
    };
}

interface Course {
    id: string;
    title: string;
    description: string | null;
    published: boolean;
    coverImageUrl: string | null;
    courseSectionId: string | null;
    price: number | null;
    isPublic: boolean;
    _count: { modules: number; enrollments: number };
    categories: CourseCategoryLite[];
}

interface Props {
    slug: string;
    courses: Course[];
    courseSections: CourseSectionOption[];
    availableCategories: CategoryOption[];
    /** Habilita edición inline de precio + isPublic (solo aulika-online). */
    canSellCourses: boolean;
}

export function LmsCoursesListClient({
    slug,
    courses,
    courseSections,
    availableCategories,
    canSellCourses,
}: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState<Course | null>(null);
    const [toDelete, setToDelete] = useState<Course | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [courseSectionId, setCourseSectionId] = useState('none');
    const [published, setPublished] = useState(false);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const openCreate = () => {
        setEditing(null);
        setTitle('');
        setDescription('');
        setCourseSectionId('none');
        setPublished(false);
        setSelectedCategoryIds([]);
        setError(null);
        setIsOpen(true);
    };

    const openEdit = (c: Course) => {
        setEditing(c);
        setTitle(c.title);
        setDescription(c.description ?? '');
        setCourseSectionId(c.courseSectionId ?? 'none');
        setPublished(c.published);
        setSelectedCategoryIds(c.categories.map((cat) => cat.category.id));
        setError(null);
        setIsOpen(true);
    };

    const handleSave = () => {
        if (!title.trim()) {
            setError('El título es requerido.');
            return;
        }
        const payload = {
            title: title.trim(),
            description: description.trim() || null,
            coverImageUrl: null,
            courseSectionId: courseSectionId === 'none' ? null : courseSectionId,
            published,
        };
        startTransition(async () => {
            const result = editing
                ? await updateLmsCourse(slug, editing.id, payload)
                : await createLmsCourse(slug, payload);
            if (result.error || !result.data) {
                setError(result.error ?? 'Error desconocido.');
                return;
            }
            const courseId = editing ? editing.id : result.data.id;
            const catResult = await setCourseCategories(slug, courseId, selectedCategoryIds);
            if (catResult.error) {
                toast.warning(
                    `Curso guardado, pero no se pudieron asignar las categorías: ${catResult.error}`,
                );
            } else {
                toast.success(editing ? 'Curso actualizado' : 'Curso creado');
            }
            setIsOpen(false);
            router.refresh();
        });
    };

    function toggleCategory(id: string) {
        setSelectedCategoryIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    }

    const selectedCategories = availableCategories.filter((c) =>
        selectedCategoryIds.includes(c.id),
    );

    const handleDelete = () => {
        if (!toDelete) return;
        startTransition(async () => {
            const result = await deleteLmsCourse(slug, toDelete.id);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Curso eliminado');
            setToDelete(null);
            router.refresh();
        });
    };

    const handlePriceSave = (courseId: string, raw: string) => {
        const trimmed = raw.trim();
        const parsed = trimmed === '' ? null : Number(trimmed);
        if (parsed !== null && (Number.isNaN(parsed) || parsed < 0)) {
            toast.error('Precio inválido.');
            return;
        }
        startTransition(async () => {
            const result = await updateLmsCoursePrice(slug, courseId, parsed);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success(parsed === null ? 'Curso marcado como gratuito' : 'Precio actualizado');
            router.refresh();
        });
    };

    const handleTogglePublic = (courseId: string, value: boolean) => {
        if (!canSellCourses) {
            toast.error(
                'La venta de cursos B2C solo está disponible para la tienda oficial de Aulika.',
            );
            return;
        }
        startTransition(async () => {
            const result = await toggleLmsCourseSetting(slug, courseId, 'isPublic', value);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success(value ? 'Curso publicado en el catálogo B2C' : 'Curso ocultado');
            router.refresh();
        });
    };

    /**
     * Resuelve el estado de venta visible para un curso. El switch `Public`
     * controla exclusivamente la venta INDIVIDUAL. Si `isPublic=false`, el
     * curso no se vende solo, sin importar el precio. Si pertenece a una
     * categoría bundle (`isBundle=true && bundlePrice!=null`), se vende como
     * parte del pack. Las dos modalidades son independientes.
     *
     * Estados:
     *  - `isPublic=true && price>0 && enPack` → "Pack $X · Individual $Y" (mixed)
     *  - `isPublic=true && price>0 && sinPack` → "Individual $Y" (success)
     *  - `isPublic=true && (price===null || price===0)` → "Gratis" (success)
     *  - `isPublic=false && enPack con precio` → "Pack $X" (blue)
     *  - `isPublic=false && enPack sin precio` → "En pack (sin precio)" (muted)
     *  - Resto → "Sin venta" (muted)
     */
    function summarizeSale(
        c: Course,
    ): { label: string; tone: 'success' | 'muted' | 'blue' | 'mixed' } {
        const bundleCat = c.categories.find(
            (cc) => cc.category.isBundle && cc.category.bundlePrice !== null,
        );
        const hasIndividualPrice = c.price !== null && c.price > 0;

        if (c.isPublic) {
            if (hasIndividualPrice && bundleCat) {
                return {
                    label: `Pack ${formatCLP(bundleCat.category.bundlePrice ?? 0)} · Individual ${formatCLP(c.price ?? 0)}`,
                    tone: 'mixed',
                };
            }
            if (hasIndividualPrice) {
                return { label: `Individual ${formatCLP(c.price ?? 0)}`, tone: 'success' };
            }
            return { label: 'Gratis', tone: 'success' };
        }
        if (bundleCat) {
            return {
                label: `Pack ${formatCLP(bundleCat.category.bundlePrice ?? 0)}`,
                tone: 'blue',
            };
        }
        if (c.categories.some((cc) => cc.category.isBundle)) {
            return { label: 'En pack (sin precio)', tone: 'muted' };
        }
        return { label: 'Sin venta', tone: 'muted' };
    }

    return (
        <>
            {courses.length === 0 ? (
                <Card className="flex flex-col items-center justify-center border-dashed py-20">
                    <BookOpen size={48} className="text-mute/20 mb-4" />
                    <p className="text-ink font-display text-lg font-bold">
                        No hay cursos en el Aula
                    </p>
                    <p className="text-mute mt-1 text-sm">
                        Creá el primer curso para empezar a cargar contenido.
                    </p>
                    <Button variant="primary" size="md" onClick={openCreate} className="mt-6">
                        <Plus size={16} className="mr-1" /> Nuevo curso
                    </Button>
                </Card>
            ) : (
                <Card className="border-border overflow-hidden bg-white shadow-sm">
                    <div className="border-border flex items-center justify-between border-b px-6 py-4">
                        <h2 className="text-ink font-display text-xl font-bold">
                            Cursos del Aula Virtual
                        </h2>
                        <Button variant="primary" size="sm" onClick={openCreate}>
                            <Plus size={14} className="mr-1" /> Nuevo curso
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-paper border-border border-b">
                                <tr>
                                    <th className="text-mute px-6 py-3 text-left font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Curso
                                    </th>
                                    <th className="text-mute px-6 py-3 text-center font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Módulos
                                    </th>
                                    <th className="text-mute px-6 py-3 text-center font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Inscriptos
                                    </th>
                                    <th className="text-mute px-6 py-3 text-center font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Precio
                                    </th>
                                    <th className="text-mute px-6 py-3 text-center font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Venta
                                    </th>
                                    <th className="text-mute px-6 py-3 text-center font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-border divide-y">
                                {courses.map((c) => {
                                    const sale = summarizeSale(c);
                                    return (
                                    <tr
                                        key={c.id}
                                        className="hover:bg-paper-warm/30 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-ink font-semibold">{c.title}</p>
                                                    {c.description && (
                                                        <p className="text-mute line-clamp-1 text-xs">
                                                            {c.description}
                                                        </p>
                                                    )}
                                                </div>
                                                {c.categories.some((cc) => cc.category.isBundle) && (
                                                    <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 font-mono text-[9px] font-bold tracking-wide text-blue-700 uppercase">
                                                        Pack
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-ink px-6 py-4 text-center font-bold">
                                            {c._count.modules}
                                        </td>
                                        <td className="text-ink px-6 py-4 text-center font-bold">
                                            {c._count.enrollments}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {canSellCourses ? (
                                                <CoursePriceCell
                                                    slug={slug}
                                                    courseId={c.id}
                                                    price={c.price}
                                                    onSave={handlePriceSave}
                                                    disabled={isPending || !c.isPublic}
                                                />
                                            ) : (
                                                <span className="text-ink text-sm font-semibold">
                                                    {c.price === null ? 'Gratis' : formatCLP(c.price)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <span
                                                    className={
                                                        sale.tone === 'success'
                                                            ? 'bg-success/10 text-success inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold'
                                                            : sale.tone === 'blue'
                                                              ? 'bg-blue-100 text-blue-700 inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold'
                                                              : sale.tone === 'mixed'
                                                                ? 'bg-primary/10 text-primary inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold'
                                                                : 'bg-paper-warm text-mute inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold'
                                                    }
                                                >
                                                    {sale.label}
                                                </span>
                                                {canSellCourses && (
                                                    <Switch
                                                        checked={c.isPublic}
                                                        onCheckedChange={(v) =>
                                                            handleTogglePublic(c.id, v)
                                                        }
                                                        disabled={isPending}
                                                        aria-label={`Publicar ${c.title} en catálogo B2C`}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={
                                                    c.published
                                                        ? 'bg-success/10 text-success inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold'
                                                        : 'bg-paper-warm text-mute inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold'
                                                }
                                            >
                                                {c.published ? 'Publicado' : 'Borrador'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon-sm">
                                                        <MoreHorizontal size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link
                                                            href={`/${slug}/aula/${c.id}`}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Edit2 size={14} /> Editar contenido
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openEdit(c)}>
                                                        <Edit2 size={14} /> Editar datos
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setToDelete(c)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 size={14} /> Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="border-border rounded-[22px] shadow-2xl sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl">
                            {editing ? 'Editar curso' : 'Nuevo curso'}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulario de curso
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="lms-title" className="text-ink text-[13px] font-bold">
                                Título
                            </label>
                            <Input
                                id="lms-title"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    setError(null);
                                }}
                                className="border-border h-11 rounded-[10px] bg-white"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="lms-desc" className="text-ink text-[13px] font-bold">
                                Descripción
                            </label>
                            <textarea
                                id="lms-desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="border-border rounded-[10px] border bg-white px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-ink text-[13px] font-bold">
                                Materia asociada (opcional)
                            </span>
                            <SearchableSelect
                                value={courseSectionId}
                                onChange={setCourseSectionId}
                                options={[
                                    { value: 'none', label: 'Sin materia asociada' },
                                    ...courseSections.map((cs) => ({
                                        value: cs.id,
                                        label: cs.name,
                                    })),
                                ]}
                                placeholder="Sin materia asociada"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-ink text-[13px] font-bold">
                                Categorías (opcional)
                            </span>
                            {availableCategories.length === 0 ? (
                                <p className="text-mute text-xs italic">
                                    Aún no hay categorías creadas. Creá una en{' '}
                                    <Link
                                        href={`/${slug}/aula/categorias` as `/${string}`}
                                        className="text-primary font-semibold"
                                    >
                                        Categorías
                                    </Link>
                                    .
                                </p>
                            ) : (
                                <div className="border-border rounded-[10px] border bg-white p-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {selectedCategories.length === 0 ? (
                                            <span className="text-mute text-xs italic">
                                                Sin categorías asignadas
                                            </span>
                                        ) : (
                                            selectedCategories.map((c) => (
                                                <Tag
                                                    key={c.id}
                                                    tone="primary"
                                                    className="px-2 text-[11px] font-bold"
                                                >
                                                    {c.name}
                                                </Tag>
                                            ))
                                        )}
                                    </div>
                                    <div className="mt-2 max-h-[160px] overflow-y-auto">
                                        {availableCategories.map((c) => {
                                            const checked = selectedCategoryIds.includes(c.id);
                                            return (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => toggleCategory(c.id)}
                                                    className="hover:bg-paper-warm flex w-full items-center justify-between rounded-[8px] px-2 py-1.5 text-left text-sm"
                                                >
                                                    <span className="text-ink font-medium">
                                                        {c.name}
                                                    </span>
                                                    {checked && (
                                                        <span className="text-primary font-bold">
                                                            ✓
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        <label className="text-ink flex cursor-pointer items-center gap-2 text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={published}
                                onChange={(e) => setPublished(e.target.checked)}
                                className="border-border h-4 w-4 rounded"
                            />
                            {published ? (
                                <Eye size={14} />
                            ) : (
                                <EyeOff size={14} className="text-mute" />
                            )}
                            {published ? 'Publicado' : 'En borrador'}
                        </label>
                        {error && <p className="text-destructive text-sm">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button variant="ink" onClick={handleSave} disabled={isPending}>
                            {editing ? 'Guardar cambios' : 'Crear curso'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">
                            Eliminar curso
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Eliminar <strong>{toDelete?.title}</strong> y todos sus módulos y
                            lecciones?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

/**
 * Celda de precio inline: input controlado que dispara `onSave` en blur o Enter.
 * Vacío = curso gratuito. Mantiene el valor en state local para evitar parpadeo
 * durante la transición de Next.js.
 */
function CoursePriceCell({
    slug,
    courseId,
    price,
    onSave,
    disabled,
}: {
    slug: string;
    courseId: string;
    price: number | null;
    onSave: (courseId: string, raw: string) => void;
    disabled: boolean;
}) {
    void slug;
    const [value, setValue] = useState(price === null ? '' : String(price));
    const [saved, setSaved] = useState(true);

    useEffect(() => {
        setValue(price === null ? '' : String(price));
    }, [price]);

    const commit = () => {
        if (!saved) {
            onSave(courseId, value);
            setSaved(true);
        }
    };

    return (
        <div className="inline-flex items-center gap-1">
            <span className="text-mute text-[10px]">$</span>
            <Input
                type="number"
                min={0}
                step={1}
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    setSaved(false);
                }}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        (e.target as HTMLInputElement).blur();
                    }
                }}
                disabled={disabled}
                placeholder="Gratis"
                className="border-border h-8 w-24 rounded-[8px] bg-white text-center text-xs disabled:opacity-60"
            />
        </div>
    );
}
