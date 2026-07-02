import { requireLmsAccess } from '@/features/auth/lib/auth-guard';
import { getCourseAnalytics } from '@/features/lms/actions/analytics';
import { LmsAnalyticsClient } from '@/features/lms/components/LmsAnalyticsClient';
import { prisma } from '@/shared/lib/prisma';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ slug: string; id: string }>;
}

export default async function AnaliticasPage({ params }: Props) {
    const { slug, id: courseId } = await params;
    const { institutionId, institutionName } = await requireLmsAccess(slug);

    const course = await prisma.lmsCourse.findFirst({
        where: { id: courseId, academicInstitutionId: institutionId },
        select: { title: true },
    });
    if (!course) notFound();

    const result = await getCourseAnalytics(slug, courseId);

    if (result.error || !result.data) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <p className="text-ink font-medium">No se pudieron cargar las analíticas.</p>
                {result.error && <p className="text-mute mt-1 text-sm">{result.error}</p>}
            </div>
        );
    }

    return <LmsAnalyticsClient analytics={result.data} />;
}
