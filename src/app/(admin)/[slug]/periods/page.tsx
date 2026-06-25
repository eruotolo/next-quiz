import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { PeriodsClient } from '@/features/periods/components/PeriodsClient';

interface Props {
    params: Promise<{ slug: string }>;
}

export default async function PeriodsPage({ params }: Props) {
    const { slug } = await params;
    const { institutionId, userRole } = await requireInstitutionPageAccess(slug);

    const canMutate = userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPER_ADMIN;

    const periods = await prisma.academicPeriod.findMany({
        where: { academicInstitutionId: institutionId },
        orderBy: { year: 'desc' },
    });

    return <PeriodsClient slug={slug} periods={periods} canMutate={canMutate} />;
}
