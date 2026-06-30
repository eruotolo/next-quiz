'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import {
    type LmsNotificationItem,
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
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleMarkRead = (id: string) => {
        startTransition(async () => {
            await markNotificationRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
            );
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
                    <span className="bg-primary absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-0.5 font-mono text-[10px] text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="border-border absolute right-0 top-10 z-50 w-80 rounded-2xl border bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <span className="text-ink text-sm font-semibold">Notificaciones</span>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleMarkAll}
                                    disabled={isPending}
                                    className="text-mute hover:text-primary flex items-center gap-1 text-xs transition-colors"
                                    title="Marcar todas como leídas"
                                >
                                    <CheckCheck size={13} /> Leer todo
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-mute hover:text-ink"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10">
                                <Bell size={28} className="text-mute/30 mb-2" />
                                <p className="text-mute text-sm">Sin notificaciones</p>
                            </div>
                        ) : (
                            // biome-ignore-start lint/correctness/useJsxKeyInIterable: key is on the outer Link/div wrapper
                            notifications.map((n) => {
                                const inner = (
                                    <div
                                        className={cn(
                                            'flex items-start gap-3 px-4 py-3 transition-colors',
                                            !n.read ? 'bg-primary/5' : 'hover:bg-paper',
                                        )}
                                    >
                                        <div className="mt-1 flex-1 min-w-0">
                                            <p className={cn('text-sm leading-snug', !n.read ? 'text-ink font-medium' : 'text-ink-dim')}>
                                                {n.message}
                                            </p>
                                            <p className="text-mute mt-0.5 text-[11px]">
                                                {timeAgo(n.createdAt)}
                                            </p>
                                        </div>
                                        {!n.read && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleMarkRead(n.id);
                                                }}
                                                className="text-primary mt-0.5 shrink-0 text-[11px] hover:underline"
                                            >
                                                Leer
                                            </button>
                                        )}
                                    </div>
                                );

                                return n.link ? (
                                    <Link
                                        key={n.id}
                                        href={n.link}
                                        onClick={() => !n.read && handleMarkRead(n.id)}
                                        className="block border-b last:border-0"
                                    >
                                        {inner}
                                    </Link>
                                ) : (
                                    <div key={n.id} className="border-b last:border-0">
                                        {inner}
                                    </div>
                                );
                            })
                            // biome-ignore-end lint/correctness/useJsxKeyInIterable: key is on the outer Link/div wrapper
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
