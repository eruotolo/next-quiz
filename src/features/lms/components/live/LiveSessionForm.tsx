'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { createLiveSession } from '@/features/lms/actions/live-sessions';
import { toast } from 'sonner';

interface LiveSessionFormProps {
    slug: string;
    courseId: string;
}

export function LiveSessionForm({ slug, courseId }: LiveSessionFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [durationMin, setDurationMin] = useState(60);
    const [maxParticipants, setMaxParticipants] = useState<number | ''>('');

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        startTransition(async () => {
            const result = await createLiveSession(slug, {
                courseId,
                title,
                description,
                scheduledAt: new Date(scheduledAt),
                durationMin,
                maxParticipants: typeof maxParticipants === 'number' ? maxParticipants : undefined,
            });
            if (result.error) {
                toast.error(result.error);
            } else if (result.data) {
                toast.success('Sesión creada');
                router.push(
                    `/${slug}/aula/${courseId}/clases` as `/${string}`,
                );
                router.refresh();
            }
        });
    };

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
                <Label htmlFor="title">Título</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Clase 5: Recursividad"
                    required
                    minLength={3}
                    maxLength={120}
                />
            </div>
            <div className="flex flex-col gap-1">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Resumen de la clase"
                    rows={3}
                    maxLength={500}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <Label htmlFor="scheduledAt">Fecha y hora</Label>
                    <Input
                        id="scheduledAt"
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        required
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="duration">Duración (min)</Label>
                    <Input
                        id="duration"
                        type="number"
                        min={10}
                        max={480}
                        value={durationMin}
                        onChange={(e) => setDurationMin(Number(e.target.value))}
                        required
                    />
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <Label htmlFor="max">Máx. participantes (opcional)</Label>
                <Input
                    id="max"
                    type="number"
                    min={2}
                    max={200}
                    value={maxParticipants}
                    onChange={(e) =>
                        setMaxParticipants(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="50"
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                        router.push(`/${slug}/aula/${courseId}/clases` as `/${string}`)
                    }
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Creando…' : 'Crear sesión'}
                </Button>
            </div>
        </form>
    );
}
