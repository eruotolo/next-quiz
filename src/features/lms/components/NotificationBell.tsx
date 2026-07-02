'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Bell, CheckCheck, X as XIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
    type LmsNotificationItem,
    deleteNotification,
    markNotificationRead,
    markAllNotificationsRead,
} from '@/features/lms/actions/notifications';

interface Props {
    initialNotifications: LmsNotificationItem[];
    initialUnreadCount: number;
}

function timeAgo(date: Date): string {
    const now = Date.now();
    const diff = now - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
}

export function NotificationBell({ initialNotifications, initialUnreadCount }: Props) {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState(initialNotifications);
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
    const [isPending, startTransition] = useTransition();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleMarkRead = (id: string) => {
        startTransition(async () => {
            await markNotificationRead(id);
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
            setUnreadCount((c) => Math.max(0, c - 1));
        });
    };

    const handleMarkAll = () => {
        startTransition(async () => {
            await markAllNotificationsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        });
    };

    const handleDelete = (id: string) => {
        startTransition(async () => {
            const target = notifications.find((n) => n.id === id);
            await deleteNotification(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            if (target && !target.read) {
                setUnreadCount((c) => Math.max(0, c - 1));
            }
        });
    };

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                    open ? 'bg-paper text-ink' : 'text-mute hover:text-ink hover:bg-paper',
                )}
                aria-label="Notificaciones"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="bg-primary absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-mono text-[11px] leading-none font-semibold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="border-border absolute top-10 right-0 z-50 w-80 overflow-hidden rounded-lg border bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b px-4 py-2.5">
                        <span className="text-ink text-sm font-semibold">Notificaciones</span>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleMarkAll}
                                    disabled={isPending}
                                    className="text-mute hover:text-primary flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors"
                                    title="Marcar todas como leídas"
                                >
                                    <CheckCheck size={13} /> Leer todo
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-mute hover:text-ink rounded p-1"
                                aria-label="Cerrar"
                            >
                                <XIcon size={13} />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10">
                                <Bell size={28} className="text-mute/30 mb-2" />
                                <p className="text-mute text-sm">Sin notificaciones</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        'group flex items-start gap-2 px-4 py-2.5 transition-colors',
                                        !n.read
                                            ? 'bg-primary/5 hover:bg-primary/10'
                                            : 'hover:bg-paper',
                                    )}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={cn(
                                                'text-sm leading-snug',
                                                !n.read
                                                    ? 'text-ink font-medium'
                                                    : 'text-ink-dim',
                                            )}
                                        >
                                            {n.message}
                                        </p>
                                        <div className="text-mute mt-1 flex items-center gap-3 text-[11px]">
                                            <span>{timeAgo(n.createdAt)}</span>
                                            {!n.read && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleMarkRead(n.id)}
                                                    disabled={isPending}
                                                    className="text-primary hover:underline"
                                                >
                                                    Marcar leída
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(n.id)}
                                        disabled={isPending}
                                        className="text-mute hover:text-destructive shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                                        aria-label="Eliminar notificación"
                                        title="Eliminar"
                                    >
                                        <XIcon size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
