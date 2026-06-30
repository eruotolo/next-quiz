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
        select: {
            id: true,
            title: true,
            description: true,
            published: true,
            certificateEnabled: true,
            aiSummaryEnabled: true,
            isPublic: true,
            price: true,
        },
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
                    summaryJson: true,
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
            <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-ink font-display text-3xl font-bold">{course.title}</h1>
                    {course.description && (
                        <p className="text-mute mt-1 text-sm">{course.description}</p>
                    )}
                </div>
                <a
                    href={`/${slug}/aula/${id}/clases` as `/${string}`}
                    className="text-ink-dim hover:text-ink border-border hover:bg-paper rounded-md border bg-white px-3 py-1.5 text-sm font-medium"
                >
                    Clases en vivo
                </a>
            </div>
            <LmsCourseEditorClient
                slug={slug}
                courseId={id}
                modules={modules}
                certificateEnabled={course.certificateEnabled}
                aiSummaryEnabled={course.aiSummaryEnabled}
                isPublic={course.isPublic}
                price={course.price}
            />
        </main>
    );
}
