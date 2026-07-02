'use client';

import { useEffect, useState, useTransition } from 'react';
import { updateLmsCourseBasicInfo } from '@/features/lms/actions/courses';
import { Button } from '@/shared/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Props {
    slug: string;
    courseId: string;
    title: string;
    description: string | null;
    price: number | null;
    /**
     * Si false, el campo de precio está deshabilitado (institución distinta
     * de `aulika-online`). El admin puede editar título y descripción pero
     * no puede cambiar el precio.
     */
    canEditPrice: boolean;
}

export function EditLmsCourseDialog({
    slug,
    courseId,
    title,
    description,
    price,
    canEditPrice,
}: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [titleInput, setTitleInput] = useState(title);
    const [descriptionInput, setDescriptionInput] = useState(description ?? '');
    const [priceInput, setPriceInput] = useState(price !== null ? String(price) : '');
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (open) {
            setTitleInput(title);
            setDescriptionInput(description ?? '');
            setPriceInput(price !== null ? String(price) : '');
        }
    }, [open, title, description, price]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedTitle = titleInput.trim();
        if (!trimmedTitle) {
            toast.error('El título es requerido.');
            return;
        }
        const trimmedPrice = priceInput.trim();
        const parsedPrice = trimmedPrice === '' ? null : Number(trimmedPrice);
        if (
            canEditPrice &&
            parsedPrice !== null &&
            (Number.isNaN(parsedPrice) || parsedPrice < 0)
        ) {
            toast.error('Ingresá un precio válido.');
            return;
        }

        startTransition(async () => {
            const result = await updateLmsCourseBasicInfo(slug, courseId, {
                title: trimmedTitle,
                description: descriptionInput.trim() === '' ? null : descriptionInput.trim(),
                price: canEditPrice ? parsedPrice : undefined,
            });
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Curso actualizado');
            setOpen(false);
            router.refresh();
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button
                type="button"
                variant="ink"
                size="sm"
                onClick={() => setOpen(true)}
                className="gap-1.5"
            >
                <Pencil size={14} />
                Editar Curso
            </Button>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Editar curso</DialogTitle>
                    <DialogDescription>
                        Cambiá el título, la descripción y el precio del curso.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="course-title"
                            className="text-ink text-[13px] font-bold"
                        >
                            Título
                        </label>
                        <Input
                            id="course-title"
                            value={titleInput}
                            onChange={(e) => setTitleInput(e.target.value)}
                            placeholder="Ej: Competencia Matemática M1"
                            className="border-border h-11 rounded-[10px] bg-white"
                            maxLength={200}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="course-description"
                            className="text-ink text-[13px] font-bold"
                        >
                            Descripción
                        </label>
                        <textarea
                            id="course-description"
                            value={descriptionInput}
                            onChange={(e) => setDescriptionInput(e.target.value)}
                            placeholder="Resumen del curso, objetivos, prerrequisitos…"
                            className="border-border placeholder:text-mute min-h-[100px] rounded-[10px] border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                            maxLength={2000}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="course-price" className="text-ink text-[13px] font-bold">
                            Precio (CLP)
                        </label>
                        <Input
                            id="course-price"
                            type="number"
                            min={0}
                            step={1}
                            value={priceInput}
                            onChange={(e) => setPriceInput(e.target.value)}
                            placeholder="Gratis"
                            disabled={!canEditPrice}
                            className="border-border h-11 rounded-[10px] bg-white disabled:opacity-60"
                        />
                        {!canEditPrice && (
                            <p className="text-mute text-[11px]">
                                La venta de cursos B2C solo está disponible para la tienda
                                oficial de Aulika.
                            </p>
                        )}
                        {canEditPrice && (
                            <p className="text-mute text-[11px]">
                                Dejar vacío para que el curso sea gratuito.
                            </p>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" variant="ink" disabled={isPending}>
                            {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                            Guardar cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}