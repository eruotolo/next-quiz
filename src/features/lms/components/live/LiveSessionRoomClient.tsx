'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { DailyCallFrame } from '@/features/lms/components/live/DailyCallFrame';
import { LiveChat } from '@/features/lms/components/live/LiveChat';
import { Whiteboard } from '@/features/lms/components/live/Whiteboard';
import { endLiveSession, toggleLiveSessionRecording } from '@/features/lms/actions/live-sessions';
import { Circle } from 'lucide-react';
import { toast } from 'sonner';

interface LiveSessionRoomClientProps {
    slug: string;
    courseId: string;
    sessionId: string;
    joinUrl: string;
    token: string | null;
    isHost: boolean;
    isLive: boolean;
    initialRecording?: boolean;
}

type RoomTab = 'video' | 'pizarra';

export function LiveSessionRoomClient({
    slug,
    courseId,
    sessionId,
    joinUrl,
    token,
    isHost,
    isLive,
    initialRecording = false,
}: LiveSessionRoomClientProps) {
    const router = useRouter();
    const [tab, setTab] = useState<RoomTab>('video');
    const [isPending, startTransition] = useTransition();
    const [isRecording, setIsRecording] = useState(initialRecording);

    useEffect(() => {
        if (!isLive) router.push(`/${slug}/aula/${courseId}/clases` as `/${string}`);
    }, [isLive, router, slug, courseId]);

    const onToggleRecording = () => {
        startTransition(async () => {
            const result = await toggleLiveSessionRecording(slug, { sessionId });
            if (result.error) {
                toast.error(result.error);
            } else if (result.data) {
                setIsRecording(result.data.recording);
                toast.success(result.data.recording ? 'Grabación iniciada' : 'Grabación detenida');
            }
        });
    };

    const onEnd = () => {
        if (!window.confirm('¿Finalizar la sesión? Todos los participantes serán expulsados.'))
            return;
        startTransition(async () => {
            const result = await endLiveSession(slug, { sessionId });
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Sesión finalizada');
                router.push(`/${slug}/aula/${courseId}/clases` as `/${string}`);
                router.refresh();
            }
        });
    };

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
                            Pizarra
                        </button>
                    </div>
                    {isHost ? (
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant={isRecording ? 'destructive' : 'outline'}
                                onClick={onToggleRecording}
                                disabled={isPending}
                                title={isRecording ? 'Detener grabación' : 'Iniciar grabación'}
                            >
                                <Circle
                                    size={10}
                                    className={
                                        isRecording
                                            ? 'animate-pulse fill-current'
                                            : 'fill-current opacity-50'
                                    }
                                />
                                {isRecording ? 'Grabando' : 'Grabar'}
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={onEnd}
                                disabled={isPending}
                            >
                                Finalizar
                            </Button>
                        </div>
                    ) : null}
                </div>
                <div className="flex-1">
                    {tab === 'video' ? (
                        <DailyCallFrame roomUrl={joinUrl} token={token} />
                    ) : (
                        <Whiteboard sessionId={sessionId} canSave />
                    )}
                </div>
            </Card>
            <Card className="flex flex-col overflow-hidden">
                <LiveChat sessionId={sessionId} isLive={isLive} canSend={isLive} />
            </Card>
        </div>
    );
}
