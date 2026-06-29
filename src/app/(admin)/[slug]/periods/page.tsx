import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { PeriodsClient } from '@/features/periods/components/PeriodsClient';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';

interface Props {
    params: Promise<{ slug: string }>;
}

export default async function PeriodsPage({ params }: Props) {
    const { slug } = await params;
    const { institutionId, institutionName, userRole, isDemo } = await requireInstitutionPageAccess(slug);

    const canMutate = userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPER_ADMIN;

    const periods = await prisma.academicPeriod.findMany({
        where: { academicInstitutionId: institutionId },
        orderBy: { year: 'desc' },
    });

    return (
        <>
            <AdminTopBar
                title="Períodos"
                breadcrumb={[institutionName, 'Períodos']}
                subtitle={`${periods.length} períodos registrados`}
            />
            <PeriodsClient slug={slug} periods={periods} canMutate={canMutate} isDemo={isDemo} />
        </>
    );
}
