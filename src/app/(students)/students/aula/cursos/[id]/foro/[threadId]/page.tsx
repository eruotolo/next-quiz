import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { prisma } from '@/shared/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { LmsForumPostTree } from '@/features/lms/components/LmsForumPostTree';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { Lock, Pin, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ id: string; threadId: string }>;
}

export default async function StudentAulaThreadPage({ params }: PageProps) {
    const { id: courseId, threadId } = await params;
    const session = await getStudentAuthSession();
    if (!session) redirect('/students/examen/login');

    const student = await prisma.user.findUnique({
        where: { id: session.studentId },
        select: { id: true, academicInstitutionId: true },
    });
    if (!student?.academicInstitutionId) redirect('/students/examen/login');

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
    if (thread.forum.course.academicInstitutionId !== student.academicInstitutionId) notFound();
    if (thread.forum.courseId !== courseId) notFound();

    return (
        <div>
            {/* Breadcrumb */}
            <nav className="text-mute mb-6 flex flex-wrap items-center gap-1.5 text-sm">
                <Link href="/students/aula" className="hover:text-ink">
                    Mis cursos
                </Link>
                <span>/</span>
                <Link href={`/students/aula/cursos/${courseId}`} className="hover:text-ink">
                    {thread.forum.course.title}
                </Link>
                <span>/</span>
                <Link
                    href={`/students/aula/cursos/${courseId}/foro`}
                    className="hover:text-ink flex items-center gap-1"
                >
                    <MessageSquare size={13} /> Foro
                </Link>
                <span>/</span>
                <span className="text-ink max-w-[200px] truncate">{thread.title}</span>
            </nav>

            {/* Thread header */}
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

            {/* Posts */}
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
                    currentStudentId={student.id}
                />
            )}
        </div>
    );
}
