import { auth } from '@/features/auth/auth';
import { requireLmsAccess } from '@/features/auth/lib/auth-guard';
import { LmsCoursesListClient } from '@/features/lms/components/LmsCoursesListClient';
import { canSellCourses } from '@/features/lms/lib/aulika-online-bundle';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function AulaPage({ params }: PageProps) {
    const { slug } = await params;
    const { institutionId } = await requireLmsAccess(slug);
    const session = await auth();
    const isSuperAdmin = session?.user.userRoleName === USER_ROLE.SUPER_ADMIN;

    const [courses, courseSections, availableCategories] = await Promise.all([
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
                price: true,
                isPublic: true,
                _count: { select: { modules: true, enrollments: true } },
                categories: {
                    select: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                isBundle: true,
                                bundlePrice: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.courseSection.findMany({
            where: { period: { academicInstitutionId: institutionId } },
            orderBy: { name: 'asc' },
            select: { id: true, name: true },
        }),
        prisma.lmsCategory.findMany({
            where: { academicInstitutionId: institutionId },
            orderBy: { name: 'asc' },
            select: { id: true, name: true },
        }),
    ]);

    return (
        <main className="flex-1 overflow-auto p-8">
            <LmsCoursesListClient
                slug={slug}
                courses={courses}
                courseSections={courseSections}
                availableCategories={availableCategories}
                canSellCourses={canSellCourses(slug, isSuperAdmin)}
            />
        </main>
    );
}
