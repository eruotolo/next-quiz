import { requireLmsAccess } from '@/features/auth/lib/auth-guard';
import { LmsCategoriesListClient } from '@/features/lms/components/LmsCategoriesListClient';
import { prisma } from '@/shared/lib/prisma';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function LmsCategoriesPage({ params }: PageProps) {
    const { slug } = await params;
    const { institutionId } = await requireLmsAccess(slug);

    const [categories, courses] = await Promise.all([
        prisma.lmsCategory.findMany({
            where: { academicInstitutionId: institutionId },
            orderBy: [{ order: 'asc' }, { name: 'asc' }],
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                order: true,
                isBundle: true,
                bundlePrice: true,
                isPublic: true,
                _count: { select: { courses: true } },
            },
        }),
        prisma.lmsCourse.findMany({
            where: { academicInstitutionId: institutionId },
            orderBy: { title: 'asc' },
            select: { id: true, title: true },
        }),
    ]);

    return (
        <main className="flex-1 overflow-auto p-8">
            <LmsCategoriesListClient
                slug={slug}
                categories={categories}
                courses={courses}
            />
        </main>
    );
}