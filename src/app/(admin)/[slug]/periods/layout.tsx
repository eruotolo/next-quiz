import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    params: Promise<{ slug: string }>;
}

export default async function PeriodsLayout({ children, params }: Props) {
    const { slug } = await params;
    const { institutionId, institutionName } = await requireInstitutionPageAccess(slug);

    const count = await prisma.academicPeriod.count({
        where: {
            academicInstitutionId: institutionId,
        },
    });

    return (
        <>
            <AdminTopBar
                breadcrumb={[institutionName, 'Períodos']}
                title="Períodos"
                subtitle={`${count} períodos registrados`}
            />
            {children}
        </>
    );
}
