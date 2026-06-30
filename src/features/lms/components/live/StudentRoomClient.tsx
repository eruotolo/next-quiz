'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { DailyCallFrame } from '@/features/lms/components/live/DailyCallFrame';
import { LiveChat } from '@/features/lms/components/live/LiveChat';
import { Whiteboard } from '@/features/lms/components/live/Whiteboard';
import { joinLiveSession, leaveLiveSession } from '@/features/lms/actions/live-sessions';
import { toast } from 'sonner';

interface StudentRoomClientProps {
    sessionId: string;
    sessionTitle: string;
    isLive: boolean;
    canEnter: boolean;
    canChat: boolean;
    scheduledAtIso: string;
}

type RoomTab = 'video' | 'pizarra';

interface JoinState {
    joinUrl: string;
    token: string | null;
    attendanceId: string;
}

export function StudentRoomClient({
    sessionId,
    sessionTitle,
    isLive,
    canEnter,
    canChat,
    scheduledAtIso,
}: StudentRoomClientProps) {
    const router = useRouter();
    const [join, setJoin] = useState<JoinState | null>(null);
    const [joining, startJoin] = useTransition();
    const [tab, setTab] = useState<RoomTab>('video');
    const [secondsToStart, setSecondsToStart] = useState<number | null>(null);

    useEffect(() => {
        const tick = () => {
            const diff = Math.floor((new Date(scheduledAtIso).getTime() - Date.now()) / 1000);
            setSecondsToStart(diff);
        };
        tick();
        const i = setInterval(tick, 1000);
        return () => clearInterval(i);
    }, [scheduledAtIso]);

    useEffect(() => {
        return () => {
            if (join?.attendanceId) {
                void leaveLiveSession({ sessionId, attendanceId: join.attendanceId });
            }
        };
    }, [join, sessionId]);

    const onJoin = () => {
        startJoin(async () => {
            const result = await joinLiveSession({
                sessionId,
                dailyParticipantId: null,
            });
            if (result.error || !result.data) {
                toast.error(result.error ?? 'No se pudo unir');
            } else {
                setJoin({
                    joinUrl: result.data.joinUrl,
                    token: result.data.token,
                    attendanceId: result.data.attendanceId,
                });
            }
        });
    };

    if (!canEnter) {
        return (
            <Card className="p-8 text-center">
                <h2 className="text-lg font-medium">{sessionTitle}</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                    No tenés acceso a esta clase en vivo.
                </p>
            </Card>
        );
    }

    if (!join) {
        return (
            <Card className="flex flex-col items-center gap-3 p-8 text-center">
                <h2 className="text-lg font-medium">{sessionTitle}</h2>
                <p className="text-muted-foreground text-sm">
                    {isLive
                        ? 'La sesión está en vivo ahora mismo.'
                        : secondsToStart !== null && secondsToStart > 0
                          ? `Abre 10 minutos antes del inicio (faltan ${formatRemaining(secondsToStart)}).`
                          : 'Aún no es hora de ingresar.'}
                </p>
                <Button onClick={onJoin} disabled={joining || !isLive}>
                    {joining ? 'Conectando…' : 'Unirme a la clase'}
                </Button>
                {!isLive ? (
                    <Button variant="ghost" onClick={() => router.refresh()}>
                        Actualizar
                    </Button>
                ) : null}
            </Card>
        );
    }

    return (
        <div className="grid h-[calc(100vh-180px)] grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
            <Card className="flex flex-col overflow-hidden">
                <div className="border-border flex items-center justify-between border-b px-4 py-2">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setTab('video')}
                            className={`rounded px-3 py-1 text-sm ${tab === 'video' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                        >
                            Videollamada
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('pizarra')}
                            className={`rounded px-3 py-1 text-sm ${tab === 'pizarra' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                        >
                            Mi pizarra
                        </button>
                    </div>
                </div>
                <div className="flex-1">
                    {tab === 'video' ? (
                        <DailyCallFrame roomUrl={join.joinUrl} token={join.token} />
                    ) : (
                        <Whiteboard sessionId={sessionId} canSave={isLive} />
                    )}
                </div>
            </Card>
            <Card className="flex flex-col overflow-hidden">
                <LiveChat sessionId={sessionId} isLive={isLive} canSend={canChat} />
            </Card>
        </div>
    );
}

function formatRemaining(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
}
