'use client';

import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Switch } from '@/shared/components/ui/switch';
import { Loader2, Package } from 'lucide-react';
import {
    slugifyCategory,
    type LmsCategoryInput,
} from '@/features/lms/schemas/category.schemas';

interface CategorySeed {
    name: string;
    slug: string;
    description: string | null;
    order: number;
    isBundle: boolean;
    bundlePrice: number | null;
    isPublic: boolean;
}

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    category: CategorySeed | null;
    courses: Array<{ id: string; title: string }>;
    onSubmit: (data: LmsCategoryInput) => void;
    isPending: boolean;
}

export function LmsCategoryDialog({
    open,
    onOpenChange,
    category,
    onSubmit,
    isPending,
}: Props) {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [isBundle, setIsBundle] = useState(false);
    const [bundlePrice, setBundlePrice] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [slugTouched, setSlugTouched] = useState(false);

    useEffect(() => {
        if (open) {
            setName(category?.name ?? '');
            setSlug(category?.slug ?? '');
            setDescription(category?.description ?? '');
            setIsBundle(category?.isBundle ?? false);
            setBundlePrice(
                category?.bundlePrice !== null && category?.bundlePrice !== undefined
                    ? String(category.bundlePrice)
                    : '',
            );
            setIsPublic(category?.isPublic ?? false);
            setSlugTouched(!!category);
        }
    }, [open, category]);

    function handleNameChange(v: string) {
        setName(v);
        if (!slugTouched) setSlug(slugifyCategory(v));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        const finalSlug = slug.trim() || slugifyCategory(trimmed);
        const priceNum = bundlePrice.trim() === '' ? null : Number(bundlePrice);
        if (priceNum !== null && (Number.isNaN(priceNum) || priceNum < 0)) return;

        onSubmit({
            name: trimmed,
            slug: finalSlug,
            description: description.trim() === '' ? null : description.trim(),
            order: 0,
            isBundle,
            bundlePrice: isBundle ? priceNum : null,
            isPublic,
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>
                        {category ? 'Editar categoría' : 'Nueva categoría'}
                    </DialogTitle>
                    <DialogDescription>
                        Agrupá cursos bajo una misma categoría. Podés venderla como Pack
                        Completo.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="cat-name" className="text-ink text-[13px] font-bold">
                            Nombre
                        </label>
                        <Input
                            id="cat-name"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Ej: PAES, Primeros Auxilios"
                            className="border-border h-11 rounded-[10px] bg-white"
                            maxLength={100}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="cat-slug" className="text-ink text-[13px] font-bold">
                            Slug
                        </label>
                        <Input
                            id="cat-slug"
                            value={slug}
                            onChange={(e) => {
                                setSlug(e.target.value);
                                setSlugTouched(true);
                            }}
                            placeholder="paes"
                            className="border-border h-11 rounded-[10px] bg-white font-mono"
                            maxLength={80}
                        />
                        <p className="text-mute text-[11px]">
                            Identificador URL. Si lo dejás vacío, se genera a partir del nombre.
                        </p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="cat-desc" className="text-ink text-[13px] font-bold">
                            Descripción
                        </label>
                        <textarea
                            id="cat-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Resumen breve de la categoría (opcional)"
                            className="border-border placeholder:text-mute min-h-[80px] rounded-[10px] border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                            maxLength={500}
                        />
                    </div>

                    <div className="border-border rounded-[10px] border bg-white p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full">
                                    <Package size={15} />
                                </div>
                                <div>
                                    <p className="text-ink text-sm font-semibold">
                                        Vender como Pack Completo
                                    </p>
                                    <p className="text-mute text-xs">
                                        Al comprar la categoría, el estudiante se inscribe en
                                        todos sus cursos.
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={isBundle}
                                onCheckedChange={setIsBundle}
                                aria-label="Habilitar pack completo"
                            />
                        </div>
                        {isBundle && (
                            <div className="mt-3 flex flex-col gap-1.5 border-t pt-3">
                                <label
                                    htmlFor="cat-bundle-price"
                                    className="text-ink text-[12px] font-bold"
                                >
                                    Precio del pack (CLP)
                                </label>
                                <Input
                                    id="cat-bundle-price"
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={bundlePrice}
                                    onChange={(e) => setBundlePrice(e.target.value)}
                                    placeholder="Ej: 450000"
                                    className="border-border h-10 rounded-[10px] bg-white"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between rounded-[10px] border border-transparent">
                        <div>
                            <p className="text-ink text-sm font-semibold">Visible en catálogo</p>
                            <p className="text-mute text-xs">
                                Mostrar la categoría (y su pack, si aplica) en /cursos.
                            </p>
                        </div>
                        <Switch
                            checked={isPublic}
                            onCheckedChange={setIsPublic}
                            aria-label="Categoría pública"
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" variant="ink" disabled={isPending || !name.trim()}>
                            {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                            {category ? 'Guardar cambios' : 'Crear categoría'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}