'use client';

import { Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createProgram } from '@/features/programs/actions/mutations';
import { Button } from '@/shared/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';

interface Props {
    slug: string;
    /** Label dinámico singular ("Carrera" / "Nivel"…). */
    label: string;
    isDemo?: boolean;
}

export function NewProgramButton({ slug, label, isDemo }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const lower = label.toLowerCase();

    const handleOpen = (): void => {
        setName('');
        setCode('');
        setDescription('');
        setError(null);
        setOpen(true);
    };

    const handleSave = (): void => {
        if (!name.trim()) {
            setError('El nombre es requerido.');
            return;
        }
        startTransition(async () => {
            const result = await createProgram(slug, {
                name: name.trim(),
                code: code.trim(),
                description: description.trim(),
            });
            if (result.error) {
                setError(result.error);
                return;
            }
            setOpen(false);
            router.refresh();
        });
    };

    return (
        <>
            <Button variant="ink" size="md" className="gap-2" onClick={handleOpen}>
                <Plus size={16} />
                Nueva {lower}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="border-border overflow-hidden rounded-[22px] p-0 shadow-2xl sm:max-w-md"
                >
                    <div className="border-border bg-paper-warm border-b px-6 py-5">
                        <DialogTitle className="font-display text-ink text-2xl">
                            Nueva {lower}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulario para crear {lower}.
                        </DialogDescription>
                    </div>

                    <div className="flex flex-col gap-4 px-6 py-6">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="np-name" className="text-ink text-[13px] font-bold">
                                Nombre
                            </label>
                            <Input
                                id="np-name"
                                placeholder="Ej: Ingeniería Civil Informática"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setError(null);
                                }}
                                className={cn(
                                    'border-border h-11 rounded-[10px] bg-white',
                                    error && 'border-destructive',
                                )}
                                autoFocus
                                disabled={isDemo}
                            />
                            {error && (
                                <p className="text-destructive text-xs font-medium">{error}</p>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="np-code" className="text-ink text-[13px] font-bold">
                                Código (opcional)
                            </label>
                            <Input
                                id="np-code"
                                placeholder="Ej: ICI"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="border-border h-11 rounded-[10px] bg-white"
                                disabled={isDemo}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="np-desc" className="text-ink text-[13px] font-bold">
                                Descripción (opcional)
                            </label>
                            <Textarea
                                id="np-desc"
                                placeholder="Breve descripción"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="border-border rounded-[10px] bg-white"
                                disabled={isDemo}
                            />
                        </div>
                    </div>

                    <DialogFooter className="border-border gap-2 border-t bg-white px-6 py-4">
                        {isDemo && (
                            <p className="text-muted-foreground mr-auto text-xs">
                                En modo demo no podés guardar cambios.
                            </p>
                        )}
                        <Button
                            variant="ghost"
                            size="md"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button variant="ink" size="md" disabled={isPending || isDemo} onClick={handleSave}>
                            {isPending && <Loader2 className="mr-2 animate-spin" />}
                            Crear {lower}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
