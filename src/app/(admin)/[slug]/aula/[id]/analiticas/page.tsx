import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { getCourseAnalytics } from '@/features/lms/actions/analytics';
import { LmsAnalyticsClient } from '@/features/lms/components/LmsAnalyticsClient';
import { prisma } from '@/shared/lib/prisma';
import { notFound } from 'next/navigation';
import { BarChart2 } from 'lucide-react';

interface Props {
    params: Promise<{ slug: string; id: string }>;
}

export default async function AnaliticasPage({ params }: Props) {
    const { slug, id: courseId } = await params;
    const { institutionId, institutionName } = await requireInstitutionPageAccess(slug);

    const course = await prisma.lmsCourse.findFirst({
        where: { id: courseId, academicInstitutionId: institutionId },
        select: { title: true },
    });
    if (!course) notFound();

    const result = await getCourseAnalytics(slug, courseId);

    if (result.error || !result.data) {
        return (
            <>
                <AdminTopBar
                    title="Analíticas"
                    icon={<BarChart2 size={18} />}
                    breadcrumb={[institutionName, 'Aula Virtual', course.title, 'Analíticas']}
                />
                <div className="flex flex-col items-center justify-center py-24">
                    <p className="text-ink font-medium">No se pudieron cargar las analíticas.</p>
                    {result.error && <p className="text-mute mt-1 text-sm">{result.error}</p>}
                </div>
            </>
        );
    }

    return (
        <>
            <AdminTopBar
                title="Analíticas"
                icon={<BarChart2 size={18} />}
                breadcrumb={[institutionName, 'Aula Virtual', course.title, 'Analíticas']}
                subtitle={`${result.data.enrollment.total} inscriptos · ${result.data.progress.average}% progreso promedio`}
            />
            <LmsAnalyticsClient analytics={result.data} />
        </>
    );
}
