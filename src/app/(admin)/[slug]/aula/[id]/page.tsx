import { requireLmsAccess } from '@/features/auth/lib/auth-guard';
import { EditLmsCourseDialog } from '@/features/lms/components/EditLmsCourseDialog';
import { LmsCourseEditorClient } from '@/features/lms/components/LmsCourseEditorClient';
import { canSellCourses } from '@/features/lms/lib/aulika-online-bundle';
import { prisma } from '@/shared/lib/prisma';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ slug: string; id: string }>;
}

export default async function AulaCourseEditPage({ params }: PageProps) {
    const { slug, id } = await params;
    const ctx = await requireLmsAccess(slug);
    const { institutionId } = ctx;

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

    const [availableCategories, selectedCategories, availableExams] = await Promise.all([
        prisma.lmsCategory.findMany({
            where: { academicInstitutionId: institutionId },
            orderBy: [{ order: 'asc' }, { name: 'asc' }],
            select: { id: true, name: true },
        }),
        prisma.lmsCourseCategory.findMany({
            where: { courseId: id },
            select: { categoryId: true },
        }),
        prisma.exam.findMany({
            where: { academicInstitutionId: institutionId, demoSessionId: null },
            orderBy: { title: 'asc' },
            select: { id: true, title: true },
        }),
    ]);

    // Solo aulika-online (o SuperAdmin) puede vender cursos.
    const canEditPrice = canSellCourses(slug, ctx.isSuperAdmin);

    return (
        <main className="flex-1 overflow-auto p-8">
            <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-ink font-display text-3xl font-bold">{course.title}</h1>
                    {course.description && (
                        <p className="text-mute mt-1 text-sm">{course.description}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <EditLmsCourseDialog
                        slug={slug}
                        courseId={id}
                        title={course.title}
                        description={course.description}
                        price={course.price}
                        canEditPrice={canEditPrice}
                    />
                </div>
            </div>
            <LmsCourseEditorClient
                slug={slug}
                courseId={id}
                modules={modules}
                certificateEnabled={course.certificateEnabled}
                aiSummaryEnabled={course.aiSummaryEnabled}
                isPublic={course.isPublic}
                canEditPrice={canEditPrice}
                availableCategories={availableCategories}
                initialSelectedCategoryIds={selectedCategories.map((c) => c.categoryId)}
                availableExams={availableExams}
            />
        </main>
    );
}