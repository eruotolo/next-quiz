'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { toast } from 'sonner';
import { cancelLiveSession, startLiveSession } from '@/features/lms/actions/live-sessions';

interface SessionRow {
    id: string;
    title: string;
    description: string | null;
    scheduledAt: string;
    durationMin: number;
    status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELED';
    recordingStatus: 'NONE' | 'PENDING' | 'READY' | 'FAILED';
    recordingUrl: string | null;
    attendeeCount: number;
}

interface LiveSessionListClientProps {
    slug: string;
    courseId: string;
    sessions: SessionRow[];
    canStart: boolean;
    canCreate: boolean;
}

const STATUS_LABEL: Record<SessionRow['status'], string> = {
    SCHEDULED: 'Programada',
    LIVE: 'En vivo',
    ENDED: 'Finalizada',
    CANCELED: 'Cancelada',
};

const STATUS_BADGE: Record<SessionRow['status'], string> = {
    SCHEDULED: 'bg-blue-100 text-blue-800',
    LIVE: 'bg-emerald-100 text-emerald-800',
    ENDED: 'bg-slate-100 text-slate-700',
    CANCELED: 'bg-red-100 text-red-700',
};

export function LiveSessionListClient({
    slug,
    courseId,
    sessions,
    canStart,
    canCreate,
}: LiveSessionListClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [busyId, setBusyId] = useState<string | null>(null);

    const onStart = (sessionId: string) => {
        setBusyId(sessionId);
        startTransition(async () => {
            const result = await startLiveSession(slug, { sessionId });
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Sesión iniciada');
                router.push(`/${slug}/aula/${courseId}/clases/${sessionId}` as `/${string}`);
                router.refresh();
            }
            setBusyId(null);
        });
    };

    const onCancel = (sessionId: string) => {
        if (!window.confirm('¿Cancelar la sesión?')) return;
        setBusyId(sessionId);
        startTransition(async () => {
            const result = await cancelLiveSession(slug, { sessionId });
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Sesión cancelada');
                router.refresh();
            }
            setBusyId(null);
        });
    };

    return (
        <div className="flex flex-col gap-4">
            {canCreate ? (
                <div className="flex justify-end">
                    <Button asChild>
                        <a href={`/${slug}/aula/${courseId}/clases/nueva` as `/${string}`}>
                            Nueva sesión
                        </a>
                    </Button>
                </div>
            ) : null}
            {sessions.length === 0 ? (
                <Card className="text-muted-foreground p-8 text-center text-sm">
                    Aún no hay sesiones en vivo para este curso.
                </Card>
            ) : (
                <ul className="flex flex-col gap-3">
                    {sessions.map((s) => (
                        <li key={s.id}>
                            <Card className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-medium">{s.title}</h3>
                                        {s.description ? (
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                {s.description}
                                            </p>
                                        ) : null}
                                        <div className="text-muted-foreground mt-2 flex items-center gap-3 text-xs">
                                            <span>{new Date(s.scheduledAt).toLocaleString()}</span>
                                            <span>· {s.durationMin} min</span>
                                            <span>
                                                · {s.attendeeCount} asistente
                                                {s.attendeeCount === 1 ? '' : 's'}
                                            </span>
                                        </div>
                                    </div>
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[s.status]}`}
                                    >
                                        {STATUS_LABEL[s.status]}
                                    </span>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {s.status === 'LIVE' ? (
                                        <Button asChild size="sm">
                                            <a
                                                href={
                                                    `/${slug}/aula/${courseId}/clases/${s.id}` as `/${string}`
                                                }
                                            >
                                                Entrar como host
                                            </a>
                                        </Button>
                                    ) : null}
                                    {canStart && s.status === 'SCHEDULED' ? (
                                        <Button
                                            size="sm"
                                            onClick={() => onStart(s.id)}
                                            disabled={isPending && busyId === s.id}
                                        >
                                            Iniciar ahora
                                        </Button>
                                    ) : null}
                                    {canStart &&
                                    (s.status === 'SCHEDULED' || s.status === 'LIVE') ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onCancel(s.id)}
                                            disabled={isPending && busyId === s.id}
                                        >
                                            Cancelar
                                        </Button>
                                    ) : null}
                                    {s.status === 'ENDED' ? (
                                        <Button asChild size="sm" variant="outline">
                                            <a
                                                href={
                                                    `/${slug}/aula/${courseId}/clases/${s.id}/asistencia` as `/${string}`
                                                }
                                            >
                                                Ver asistencia
                                            </a>
                                        </Button>
                                    ) : null}
                                    {s.status === 'ENDED' &&
                                    s.recordingStatus === 'READY' &&
                                    s.recordingUrl ? (
                                        <Button asChild size="sm" variant="outline">
                                            <a
                                                href={s.recordingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Ver grabación
                                            </a>
                                        </Button>
                                    ) : null}
                                </div>
                            </Card>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
