'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
    listLiveChatMessages,
    sendLiveChatMessage,
    type PublicLiveChatMessage,
} from '@/features/lms/actions/live-chat';
import { toast } from 'sonner';

interface LiveChatProps {
    sessionId: string;
    isLive: boolean;
    canSend: boolean;
}

const POLL_INTERVAL_MS = 3_000;

export function LiveChat({ sessionId, isLive, canSend }: LiveChatProps) {
    const [messages, setMessages] = useState<PublicLiveChatMessage[]>([]);
    const [cursor, setCursor] = useState<Date | null>(null);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const loadMessages = useCallback(async () => {
        const result = await listLiveChatMessages({ sessionId, since: cursor });
        if (result.data) {
            setMessages((prev) => {
                const seen = new Set(prev.map((m) => m.id));
                const merged = [...prev];
                for (const m of result.data!.messages) {
                    if (!seen.has(m.id)) merged.push(m);
                }
                return merged.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
            });
            if (result.data.nextCursor) {
                setCursor(new Date(result.data.nextCursor));
            }
        }
    }, [sessionId, cursor]);

    useEffect(() => {
        loadMessages();
        if (!isLive) return;
        const interval = setInterval(loadMessages, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [loadMessages, isLive]);

    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    });

    const onSend = async () => {
        const content = draft.trim();
        if (content.length === 0) return;
        if (!canSend) {
            toast.error('No tenés permisos para enviar mensajes');
            return;
        }
        setSending(true);
        try {
            const result = await sendLiveChatMessage({ sessionId, content });
            if (result.error) {
                toast.error(result.error);
            } else {
                setDraft('');
                await loadMessages();
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex h-full flex-col">
            <div className="border-border flex items-center justify-between border-b px-4 py-2">
                <h3 className="text-sm font-medium">Chat en vivo</h3>
                <span className="text-muted-foreground text-xs">
                    {isLive ? 'Activo' : 'Sesión finalizada'}
                </span>
            </div>
            <div
                ref={scrollRef}
                className="bg-muted/30 flex-1 overflow-y-auto px-4 py-2"
                aria-live="polite"
            >
                {messages.length === 0 ? (
                    <p className="text-muted-foreground text-center text-sm">
                        Aún no hay mensajes.
                    </p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {messages.map((m) => (
                            <li key={m.id} className="text-sm">
                                <span className="font-medium">{m.userName}</span>
                                <span className="text-muted-foreground ml-2 text-xs">
                                    {new Date(m.sentAt).toLocaleTimeString()}
                                </span>
                                <p className="break-words">{m.content}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {canSend ? (
                <div className="border-border flex items-center gap-2 border-t px-4 py-2">
                    <Input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                onSend();
                            }
                        }}
                        placeholder="Escribí un mensaje…"
                        disabled={!isLive}
                        maxLength={500}
                    />
                    <Button
                        type="button"
                        onClick={onSend}
                        disabled={sending || draft.trim().length === 0 || !isLive}
                    >
                        Enviar
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
