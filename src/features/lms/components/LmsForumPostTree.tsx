'use client';

import { useState, useTransition } from 'react';
import type { ForumPost } from '@/features/lms/actions/forums';
import { createLmsForumPostAdmin, createLmsPost } from '@/features/lms/actions/forums';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Loader2, CornerDownRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

function authorInitials(name: string, lastname: string): string {
    return `${name[0] ?? ''}${lastname[0] ?? ''}`.toUpperCase();
}

function timeLabel(date: Date): string {
    return new Intl.DateTimeFormat('es-CL', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

interface ReplyFormProps {
    threadId: string;
    parentPostId: string | null;
    locked: boolean;
    onDone: () => void;
    /** Si se pasa, la respuesta se envía como staff (admin/profesor) vía createLmsForumPostAdmin. */
    adminSlug?: string;
}

function ReplyForm({ threadId, parentPostId, locked, onDone, adminSlug }: ReplyFormProps) {
    const router = useRouter();
    const [body, setBody] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleSubmit = () => {
        if (!body.trim()) return;
        startTransition(async () => {
            const result = adminSlug
                ? await createLmsForumPostAdmin(adminSlug, {
                      threadId,
                      parentPostId,
                      body: body.trim(),
                  })
                : await createLmsPost({ threadId, parentPostId, body: body.trim() });
            if (result.error) {
                toast.error(result.error);
                return;
            }
            setBody('');
            onDone();
            router.refresh();
        });
    };

    if (locked) return null;

    return (
        <div className="mt-2 flex flex-col gap-2">
            <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escribe tu respuesta…"
                rows={3}
                disabled={isPending}
                className="text-sm"
            />
            <div className="flex gap-2">
                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={isPending || !body.trim()}
                >
                    {isPending && <Loader2 size={12} className="animate-spin" />}
                    Responder
                </Button>
                <Button variant="outline" size="sm" onClick={onDone} disabled={isPending}>
                    Cancelar
                </Button>
            </div>
        </div>
    );
}

interface PostNodeProps {
    post: ForumPost;
    allPosts: ForumPost[];
    threadId: string;
    locked: boolean;
    depth: number;
    currentStudentId?: string;
    adminSlug?: string;
}

function PostNode({
    post,
    allPosts,
    threadId,
    locked,
    depth,
    currentStudentId,
    adminSlug,
}: PostNodeProps) {
    const [replying, setReplying] = useState(false);
    const replies = allPosts.filter((p) => p.parentPostId === post.id);
    const isOwn = currentStudentId === post.authorId;

    return (
        <div className={cn('flex gap-3', depth > 0 && 'border-border ml-8 border-l-2 pl-4')}>
            {/* Avatar */}
            <div
                className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold',
                    isOwn ? 'bg-primary/10 text-primary' : 'bg-paper text-ink-dim',
                )}
            >
                {authorInitials(post.author.name, post.author.lastname)}
            </div>

            <div className="min-w-0 flex-1">
                {/* Meta */}
                <div className="mb-1 flex items-baseline gap-2">
                    <span className="text-ink text-sm font-semibold">
                        {post.author.name} {post.author.lastname}
                    </span>
                    <span className="text-mute text-xs">{timeLabel(post.createdAt)}</span>
                    {post.editedAt && (
                        <span className="text-mute text-[10px] italic">(editado)</span>
                    )}
                </div>

                {/* Body — post.body ya viene sanitizado (allowlist) por sanitizeForumMarkdown */}
                <div
                    className="text-ink prose-sm text-sm leading-relaxed"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: body sanitizado server-side vía sanitizeForumMarkdown
                    dangerouslySetInnerHTML={{ __html: post.body }}
                />

                {/* Reply button */}
                {!locked && !replying && (
                    <button
                        type="button"
                        onClick={() => setReplying(true)}
                        className="text-mute hover:text-primary mt-1.5 flex items-center gap-1 text-xs transition-colors"
                    >
                        <CornerDownRight size={11} /> Responder
                    </button>
                )}

                {replying && (
                    <ReplyForm
                        threadId={threadId}
                        parentPostId={post.id}
                        locked={locked}
                        onDone={() => setReplying(false)}
                        adminSlug={adminSlug}
                    />
                )}

                {/* Nested replies */}
                {replies.length > 0 && (
                    <div className="mt-4 flex flex-col gap-4">
                        {replies.map((reply) => (
                            <PostNode
                                key={reply.id}
                                post={reply}
                                allPosts={allPosts}
                                threadId={threadId}
                                locked={locked}
                                depth={depth + 1}
                                currentStudentId={currentStudentId}
                                adminSlug={adminSlug}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface Props {
    posts: ForumPost[];
    threadId: string;
    locked: boolean;
    currentStudentId?: string;
    /** Si se pasa, las respuestas se envían como staff (admin/profesor) vía createLmsForumPostAdmin. */
    adminSlug?: string;
}

export function LmsForumPostTree({ posts, threadId, locked, currentStudentId, adminSlug }: Props) {
    // Render only root posts (no parentPostId); nested replies are rendered recursively
    const rootPosts = posts.filter((p) => p.parentPostId === null);

    return (
        <div className="flex flex-col gap-6">
            {rootPosts.map((post) => (
                <PostNode
                    key={post.id}
                    post={post}
                    allPosts={posts}
                    threadId={threadId}
                    locked={locked}
                    depth={0}
                    currentStudentId={currentStudentId}
                    adminSlug={adminSlug}
                />
            ))}
        </div>
    );
}
