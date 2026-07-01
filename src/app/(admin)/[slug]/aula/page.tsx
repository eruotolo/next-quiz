import { requireLmsAccess } from '@/features/auth/lib/auth-guard';
import { LmsCoursesListClient } from '@/features/lms/components/LmsCoursesListClient';
import { prisma } from '@/shared/lib/prisma';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function AulaPage({ params }: PageProps) {
    const { slug } = await params;
    const { institutionId } = await requireLmsAccess(slug);

    const [courses, courseSections] = await Promise.all([
        prisma.lmsCourse.findMany({
            where: { academicInstitutionId: institutionId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                description: true,
                published: true,
                coverImageUrl: true,
                courseSectionId: true,
                _count: { select: { modules: true, enrollments: true } },
            },
        }),
        prisma.courseSection.findMany({
            where: { period: { academicInstitutionId: institutionId } },
            orderBy: { name: 'asc' },
            select: { id: true, name: true },
        }),
    ]);

    return (
        <main className="flex-1 overflow-auto p-8">
            <LmsCoursesListClient slug={slug} courses={courses} courseSections={courseSections} />
        </main>
    );
}
