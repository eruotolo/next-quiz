'use client';

import { useState, useTransition } from 'react';
import type { ForumWithThreads } from '@/features/lms/actions/forums';
import { createLmsThread } from '@/features/lms/actions/forums';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/components/ui/dialog';
import { MessageSquare, Pin, Lock, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Props {
    forums: ForumWithThreads[];
    courseId: string;
    isAdmin?: boolean;
}

function timeLabel(date: Date): string {
    return new Intl.DateTimeFormat('es-CL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(date));
}

export function LmsForumClient({ forums, courseId, isAdmin = false }: Props) {
    const router = useRouter();
    const [openForumId, setOpenForumId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleCreate = () => {
        if (!openForumId || !title.trim() || !body.trim()) return;
        startTransition(async () => {
            const result = await createLmsThread({
                forumId: openForumId,
                title: title.trim(),
                body: body.trim(),
            });
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Hilo creado');
            setTitle('');
            setBody('');
            setOpenForumId(null);
            router.push(`/students/aula/cursos/${courseId}/foro/${result.data?.threadId}`);
        });
    };

    if (forums.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center border-dashed py-24">
                <MessageSquare size={40} className="text-mute/30 mb-4" />
                <p className="text-ink text-lg font-medium">Sin foros disponibles</p>
                <p className="text-mute mt-1 text-sm">
                    {isAdmin
                        ? 'Agrega un foro desde el editor de curso.'
                        : 'El docente aún no ha habilitado el foro.'}
                </p>
            </Card>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {forums.map((forum) => (
                <section key={forum.id}>
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <h2 className="text-ink font-display text-xl font-bold">
                                {forum.title}
                            </h2>
                            {forum.description && (
                                <p className="text-mute mt-0.5 text-sm">{forum.description}</p>
                            )}
                        </div>
                        {!forum.archived && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setOpenForumId(forum.id)}
                            >
                                <Plus size={14} /> Nuevo hilo
                            </Button>
                        )}
                    </div>

                    {forum.threads.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center border-dashed py-12">
                            <MessageSquare size={28} className="text-mute/30 mb-2" />
                            <p className="text-mute text-sm">Sin hilos todavía. ¡Sé el primero!</p>
                        </Card>
                    ) : (
                        <Card className="border-border overflow-hidden bg-white shadow-sm">
                            {forum.threads.map((thread, idx) => (
                                <Link
                                    key={thread.id}
                                    href={
                                        isAdmin
                                            ? `#thread-${thread.id}`
                                            : `/students/aula/cursos/${courseId}/foro/${thread.id}`
                                    }
                                    className={cn(
                                        'hover:bg-paper flex items-start gap-4 px-5 py-4 transition-colors',
                                        idx < forum.threads.length - 1 && 'border-border border-b',
                                    )}
                                >
                                    {/* Icon */}
                                    <div
                                        className={cn(
                                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                            thread.locked
                                                ? 'bg-paper text-mute'
                                                : 'bg-primary/10 text-primary',
                                        )}
                                    >
                                        {thread.locked ? (
                                            <Lock size={14} />
                                        ) : (
                                            <MessageSquare size={14} />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            {thread.pinned && (
                                                <Pin
                                                    size={12}
                                                    className="shrink-0 text-amber-500"
                                                />
                                            )}
                                            <p className="text-ink truncate font-semibold">
                                                {thread.title}
                                            </p>
                                            {thread.locked && (
                                                <Badge
                                                    variant="outline"
                                                    className="shrink-0 text-[10px]"
                                                >
                                                    Cerrado
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-mute mt-0.5 text-xs">
                                            Por {thread.author.name} {thread.author.lastname}
                                            {' · '}
                                            {timeLabel(thread.createdAt)}
                                        </p>
                                    </div>

                                    {/* Stats */}
                                    <div className="text-mute flex shrink-0 items-center gap-1.5 text-xs">
                                        <MessageSquare size={12} />
                                        <span>{thread._count.posts}</span>
                                    </div>
                                </Link>
                            ))}
                        </Card>
                    )}
                </section>
            ))}

            {/* New thread dialog */}
            <Dialog open={!!openForumId} onOpenChange={(v) => !v && setOpenForumId(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Nuevo hilo</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-3">
                        <div>
                            <label
                                htmlFor="thread-title"
                                className="text-ink mb-1 block text-sm font-medium"
                            >
                                Título
                            </label>
                            <Input
                                id="thread-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="¿Cuál es tu pregunta o tema?"
                                disabled={isPending}
                                maxLength={200}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="thread-body"
                                className="text-ink mb-1 block text-sm font-medium"
                            >
                                Mensaje
                            </label>
                            <Textarea
                                id="thread-body"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Escribe el contenido del hilo…"
                                rows={5}
                                disabled={isPending}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpenForumId(null)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreate}
                            disabled={isPending || !title.trim() || !body.trim()}
                        >
                            {isPending && <Loader2 size={14} className="animate-spin" />}
                            Publicar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
