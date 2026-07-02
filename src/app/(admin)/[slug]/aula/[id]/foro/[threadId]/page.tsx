import { requireLmsAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import { notFound } from 'next/navigation';
import { LmsForumPostTree } from '@/features/lms/components/LmsForumPostTree';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { Lock, Pin, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ slug: string; id: string; threadId: string }>;
}

export default async function AulaForoThreadAdminPage({ params }: PageProps) {
    const { slug, id: courseId, threadId } = await params;
    const { institutionId, userId } = await requireLmsAccess(slug);

    const thread = await prisma.lmsForumThread.findUnique({
        where: { id: threadId },
        select: {
            id: true,
            title: true,
            pinned: true,
            locked: true,
            createdAt: true,
            authorId: true,
            author: { select: { name: true, lastname: true } },
            forum: {
                select: {
                    id: true,
                    title: true,
                    courseId: true,
                    course: { select: { academicInstitutionId: true, title: true } },
                },
            },
            posts: {
                orderBy: { createdAt: 'asc' },
                select: {
                    id: true,
                    parentPostId: true,
                    body: true,
                    editedAt: true,
                    createdAt: true,
                    authorId: true,
                    author: { select: { name: true, lastname: true } },
                },
            },
        },
    });

    if (!thread) notFound();
    if (thread.forum.course.academicInstitutionId !== institutionId) notFound();
    if (thread.forum.courseId !== courseId) notFound();

    return (
        <main className="flex-1 overflow-auto p-8">
            <nav className="text-mute mb-6 flex flex-wrap items-center gap-1.5 text-sm">
                <Link
                    href={`/${slug}/aula/${courseId}/foro`}
                    className="hover:text-ink flex items-center gap-1"
                >
                    <ArrowLeft size={13} /> Foro
                </Link>
                <span>/</span>
                <span className="text-ink max-w-[200px] truncate">{thread.title}</span>
            </nav>

            <div className="mb-6">
                <div className="flex flex-wrap items-center gap-2">
                    {thread.pinned && <Pin size={14} className="text-amber-500" />}
                    <h1 className="text-ink font-display text-2xl font-bold">{thread.title}</h1>
                    {thread.locked && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Lock size={11} /> Cerrado
                        </Badge>
                    )}
                </div>
                <p className="text-mute mt-1 text-sm">
                    Foro: {thread.forum.title} · {thread.posts.length} respuestas
                </p>
            </div>

            {thread.posts.length === 0 ? (
                <Card className="flex flex-col items-center justify-center border-dashed py-16">
                    <MessageSquare size={32} className="text-mute/30 mb-3" />
                    <p className="text-mute text-sm">Sin mensajes todavía.</p>
                </Card>
            ) : (
                <LmsForumPostTree
                    posts={thread.posts}
                    threadId={threadId}
                    locked={thread.locked}
                    currentStudentId={userId}
                    adminSlug={slug}
                />
            )}
        </main>
    );
}
