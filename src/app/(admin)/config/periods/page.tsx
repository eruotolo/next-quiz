import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { ConfigPeriodsClient } from '@/features/config/components/ConfigPeriodsClient';
import { prisma } from '@/shared/lib/prisma';

export default async function ConfigPeriodsPage() {
    const periods = await prisma.academicPeriod.findMany({
        include: {
            academicInstitution: { select: { name: true, slug: true } },
        },
        orderBy: [{ year: 'desc' }, { name: 'asc' }],
    });

    return (
        <>
            <AdminTopBar
                title="Períodos Académicos"
                breadcrumb={['Sistema', 'Períodos']}
                subtitle={`${periods.length} períodos registrados en todas las instituciones`}
            />
            <ConfigPeriodsClient periods={periods} />
        </>
    );
}
