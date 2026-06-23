'use client';

import { createGroup } from '@/features/groups/actions/mutations';
import { getProfessorsForSlug } from '@/features/groups/actions/queries';
import { Button } from '@/shared/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/lib/utils';
import { Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface ProfessorOption {
    id: string;
    name: string;
    lastname: string;
}

const NO_TUTOR = '__none__';

interface Props {
    slug: string;
}

export function NewGroupButton({ slug }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [professors, setProfessors] = useState<ProfessorOption[]>([]);
    const [name, setName] = useState('');
    const [stream, setStream] = useState('');
    const [tutorId, setTutorId] = useState<string>(NO_TUTOR);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleOpen = (): void => {
        setName('');
        setStream('');
        setTutorId(NO_TUTOR);
        setError(null);
        startTransition(async () => {
            const fetched = await getProfessorsForSlug(slug);
            setProfessors(fetched);
            setOpen(true);
        });
    };

    const handleSave = (): void => {
        if (!name.trim()) {
            setError('El nombre es requerido.');
            return;
        }
        startTransition(async () => {
            const result = await createGroup(slug, {
                name,
                stream: stream.trim(),
                tutorId: tutorId === NO_TUTOR ? null : tutorId,
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
            <Button
                variant="ink"
                size="md"
                className="gap-2"
                disabled={isPending}
                onClick={handleOpen}
            >
                {isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={16} />}
                Nuevo grupo
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="border-border overflow-hidden rounded-[22px] p-0 shadow-2xl sm:max-w-md"
                >
                    <div className="border-border bg-paper-warm border-b px-6 py-5">
                        <DialogTitle className="font-display text-ink text-2xl">
                            Nuevo grupo
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulario para crear un nuevo grupo.
                        </DialogDescription>
                    </div>

                    <div className="flex flex-col gap-4 px-6 py-6">
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="ng-name"
                                className="text-ink text-[13px] font-bold"
                            >
                                Nombre del grupo
                            </label>
                            <Input
                                id="ng-name"
                                placeholder="Ej: 4to Año B"
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
                            />
                            {error && (
                                <p className="text-destructive text-xs font-medium">{error}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="ng-stream"
                                className="text-ink text-[13px] font-bold"
                            >
                                Mención / especialidad (opcional)
                            </label>
                            <Input
                                id="ng-stream"
                                placeholder="Ej: Científico-Humanista"
                                value={stream}
                                onChange={(e) => setStream(e.target.value)}
                                className="border-border h-11 rounded-[10px] bg-white"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-ink text-[13px] font-bold">
                                Profesor/a tutor/a (opcional)
                            </span>
                            <Select value={tutorId} onValueChange={setTutorId}>
                                <SelectTrigger className="border-border h-11 rounded-[10px] bg-white">
                                    <SelectValue placeholder="Sin tutor asignado" />
                                </SelectTrigger>
                                <SelectContent className="border-border rounded-xl shadow-xl">
                                    <SelectItem value={NO_TUTOR}>Sin tutor asignado</SelectItem>
                                    {professors.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name} {p.lastname}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="border-border gap-2 border-t bg-white px-6 py-4">
                        <Button
                            variant="ghost"
                            size="md"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="ink"
                            size="md"
                            disabled={isPending}
                            onClick={handleSave}
                        >
                            {isPending && <Loader2 className="mr-2 animate-spin" />}
                            Crear grupo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
