import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import { notFound } from 'next/navigation';
import { LmsAdminForumClient } from '@/features/lms/components/LmsAdminForumClient';

interface PageProps {
    params: Promise<{ slug: string; id: string }>;
}

export default async function AulaForoAdminPage({ params }: PageProps) {
    const { slug, id: courseId } = await params;
    const { institutionId } = await requireInstitutionPageAccess(slug);

    const course = await prisma.lmsCourse.findFirst({
        where: { id: courseId, academicInstitutionId: institutionId },
        select: { id: true, title: true },
    });
    if (!course) notFound();

    const forums = await prisma.lmsForum.findMany({
        where: { courseId },
        orderBy: { order: 'asc' },
        select: {
            id: true,
            title: true,
            description: true,
            archived: true,
            threads: {
                orderBy: [{ pinned: 'desc' }, { lastPostAt: 'desc' }, { createdAt: 'desc' }],
                select: {
                    id: true,
                    title: true,
                    pinned: true,
                    locked: true,
                    lastPostAt: true,
                    createdAt: true,
                    authorId: true,
                    author: { select: { name: true, lastname: true } },
                    _count: { select: { posts: true } },
                },
            },
        },
    });

    return (
        <main className="flex-1 overflow-auto p-8">
            <div className="mb-6">
                <h1 className="text-ink font-display text-3xl font-bold">{course.title}</h1>
                <p className="text-mute mt-1 text-sm">Moderación del foro del curso</p>
            </div>

            <LmsAdminForumClient slug={slug} courseId={courseId} forums={forums} />
        </main>
    );
}
