import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { LmsCourseEditorClient } from '@/features/lms/components/LmsCourseEditorClient';
import { prisma } from '@/shared/lib/prisma';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ slug: string; id: string }>;
}

export default async function AulaCourseEditPage({ params }: PageProps) {
    const { slug, id } = await params;
    const { institutionId } = await requireInstitutionPageAccess(slug);

    const course = await prisma.lmsCourse.findFirst({
        where: { id, academicInstitutionId: institutionId },
        select: { id: true, title: true, description: true, published: true },
    });
    if (!course) notFound();

    const modules = await prisma.lmsModule.findMany({
        where: { courseId: id },
        orderBy: { order: 'asc' },
        select: {
            id: true,
            title: true,
            description: true,
            order: true,
            courseId: true,
            createdAt: true,
            updatedAt: true,
            lessons: {
                orderBy: { order: 'asc' },
                select: {
                    id: true,
                    title: true,
                    type: true,
                    order: true,
                    videoAssetId: true,
                    videoUploadId: true,
                    fileUrl: true,
                    externalLink: true,
                    durationSec: true,
                    examId: true,
                    contentJson: true,
                    moduleId: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: { select: { progress: true } },
                },
            },
        },
    });

    return (
        <main className="flex-1 overflow-auto p-8">
            <div className="mb-6">
                <h1 className="text-ink font-display text-3xl font-bold">{course.title}</h1>
                {course.description && (
                    <p className="text-mute mt-1 text-sm">{course.description}</p>
                )}
            </div>
            <LmsCourseEditorClient slug={slug} courseId={id} modules={modules} />
        </main>
    );
}
