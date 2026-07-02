import { ConfigPeriodsClient } from '@/features/config/components/ConfigPeriodsClient';
import { prisma } from '@/shared/lib/prisma';

export default async function ConfigPeriodsPage() {
    const periods = await prisma.academicPeriod.findMany({
        include: {
            academicInstitution: { select: { name: true, slug: true } },
        },
        orderBy: [{ year: 'desc' }, { name: 'asc' }],
    });

    return <ConfigPeriodsClient periods={periods} />;
}
