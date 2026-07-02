'use client';

import { useState, useTransition } from 'react';
import type { ForumThread, ForumWithThreads } from '@/features/lms/actions/forums';
import {
    toggleForumThreadPin,
    toggleForumThreadLock,
    createLmsForum,
} from '@/features/lms/actions/forums';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/components/ui/dialog';
import { MessageSquare, Pin, Lock, Plus, Loader2, Unlock } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ThreadRowProps {
    thread: ForumThread;
    isLast: boolean;
    slug: string;
    courseId: string;
    isPending: boolean;
    onPin: (id: string, pinned: boolean) => void;
    onLock: (id: string, locked: boolean) => void;
}

function ThreadRow({ thread, isLast, slug, courseId, isPending, onPin, onLock }: ThreadRowProps) {
    return (
        <div
            id={`thread-${thread.id}`}
            className={cn('flex items-center gap-4 px-5 py-4', !isLast && 'border-border border-b')}
        >
            <div
                className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    thread.locked ? 'bg-paper text-mute' : 'bg-primary/10 text-primary',
                )}
            >
                {thread.locked ? <Lock size={14} /> : <MessageSquare size={14} />}
            </div>

            <Link href={`/${slug}/aula/${courseId}/foro/${thread.id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    {thread.pinned && <Pin size={12} className="shrink-0 text-amber-500" />}
                    <p className="text-ink hover:text-primary truncate font-semibold">
                        {thread.title}
                    </p>
                    {thread.locked && (
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                            Cerrado
                        </Badge>
                    )}
                </div>
                <p className="text-mute text-xs">
                    Por {thread.author.name} {thread.author.lastname}
                    {' · '}
                    {thread._count.posts} respuestas
                </p>
            </Link>

            <div className="flex shrink-0 items-center gap-2">
                <button
                    type="button"
                    onClick={() => onPin(thread.id, thread.pinned)}
                    disabled={isPending}
                    title={thread.pinned ? 'Desanclar' : 'Anclar'}
                    className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                        thread.pinned
                            ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                            : 'text-mute hover:bg-paper hover:text-ink',
                    )}
                >
                    <Pin size={13} />
                </button>
                <button
                    type="button"
                    onClick={() => onLock(thread.id, thread.locked)}
                    disabled={isPending}
                    title={thread.locked ? 'Abrir' : 'Cerrar'}
                    className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                        thread.locked
                            ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                            : 'text-mute hover:bg-paper hover:text-ink',
                    )}
                >
                    {thread.locked ? <Unlock size={13} /> : <Lock size={13} />}
                </button>
            </div>
        </div>
    );
}

interface ForumSectionProps {
    forum: ForumWithThreads;
    slug: string;
    courseId: string;
    isPending: boolean;
    onPin: (id: string, pinned: boolean) => void;
    onLock: (id: string, locked: boolean) => void;
}

function ForumSection({ forum, slug, courseId, isPending, onPin, onLock }: ForumSectionProps) {
    return (
        <section>
            <div className="mb-3">
                <h2 className="text-ink font-display text-xl font-bold">{forum.title}</h2>
                {forum.description && <p className="text-mute text-sm">{forum.description}</p>}
                {forum.archived && (
                    <Badge variant="outline" className="mt-1">
                        Archivado
                    </Badge>
                )}
            </div>

            {forum.threads.length === 0 ? (
                <Card className="flex flex-col items-center justify-center border-dashed py-12">
                    <p className="text-mute text-sm">Sin hilos todavía.</p>
                </Card>
            ) : (
                <Card className="border-border overflow-hidden bg-white shadow-sm">
                    {forum.threads.map((thread, idx) => (
                        <ThreadRow
                            key={thread.id}
                            thread={thread}
                            isLast={idx === forum.threads.length - 1}
                            slug={slug}
                            courseId={courseId}
                            isPending={isPending}
                            onPin={onPin}
                            onLock={onLock}
                        />
                    ))}
                </Card>
            )}
        </section>
    );
}

interface Props {
    slug: string;
    courseId: string;
    forums: ForumWithThreads[];
}

export function LmsAdminForumClient({ slug, courseId, forums: initialForums }: Props) {
    const router = useRouter();
    const [forums] = useState(initialForums);
    const [showNewForum, setShowNewForum] = useState(false);
    const [newForumTitle, setNewForumTitle] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleCreateForum = () => {
        if (!newForumTitle.trim()) return;
        startTransition(async () => {
            const result = await createLmsForum(slug, { courseId, title: newForumTitle.trim() });
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Foro creado');
            setNewForumTitle('');
            setShowNewForum(false);
            router.refresh();
        });
    };

    const handlePin = (threadId: string, pinned: boolean) => {
        startTransition(async () => {
            const result = await toggleForumThreadPin(slug, threadId);
            if (result.error) toast.error(result.error);
            else {
                toast.success(pinned ? 'Hilo desanclado' : 'Hilo anclado');
                router.refresh();
            }
        });
    };

    const handleLock = (threadId: string, locked: boolean) => {
        startTransition(async () => {
            const result = await toggleForumThreadLock(slug, threadId);
            if (result.error) toast.error(result.error);
            else {
                toast.success(locked ? 'Hilo abierto' : 'Hilo cerrado');
                router.refresh();
            }
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={() => setShowNewForum(true)}>
                    <Plus size={14} /> Crear foro
                </Button>
            </div>

            {forums.length === 0 ? (
                <Card className="flex flex-col items-center justify-center border-dashed py-24">
                    <MessageSquare size={40} className="text-mute/30 mb-4" />
                    <p className="text-ink text-lg font-medium">Sin foros</p>
                    <p className="text-mute mt-1 text-sm">
                        Crea el primer foro para los estudiantes.
                    </p>
                </Card>
            ) : (
                forums.map((forum) => (
                    <ForumSection
                        key={forum.id}
                        forum={forum}
                        slug={slug}
                        courseId={courseId}
                        isPending={isPending}
                        onPin={handlePin}
                        onLock={handleLock}
                    />
                ))
            )}

            <Dialog open={showNewForum} onOpenChange={setShowNewForum}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Crear foro</DialogTitle>
                    </DialogHeader>
                    <div>
                        <label
                            htmlFor="forum-title"
                            className="text-ink mb-1 block text-sm font-medium"
                        >
                            Nombre del foro
                        </label>
                        <Input
                            id="forum-title"
                            value={newForumTitle}
                            onChange={(e) => setNewForumTitle(e.target.value)}
                            placeholder="Ej: Consultas generales"
                            disabled={isPending}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowNewForum(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreateForum}
                            disabled={isPending || !newForumTitle.trim()}
                        >
                            {isPending && <Loader2 size={14} className="animate-spin" />}
                            Crear
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
