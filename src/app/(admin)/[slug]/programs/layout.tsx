import type { ReactNode } from 'react';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { NewProgramButton } from '@/features/programs/components/NewProgramButton';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { academicLabel } from '@/shared/lib/academic-labels';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';

interface Props {
    children: ReactNode;
    params: Promise<{ slug: string }>;
}

export default async function ProgramsLayout({ children, params }: Props) {
    const { slug } = await params;
    const { institutionId, institutionName, userRole, isProfesor, coordinatedProgramIds } =
        await requireInstitutionPageAccess(slug);

    const institution = await prisma.academicInstitution.findUnique({
        where: { id: institutionId },
        select: { type: true },
    });
    const labels = academicLabel(institution?.type ?? 'OTRO');

    const canMutate = userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPER_ADMIN;

    const count = await prisma.program.count({
        where: {
            academicInstitutionId: institutionId,
            ...(isProfesor && { id: { in: coordinatedProgramIds } }),
        },
    });

    return (
        <>
            <AdminTopBar
                breadcrumb={[institutionName, labels.programPlural]}
                title={labels.programPlural}
                subtitle={`${count} ${count === 1 ? labels.program.toLowerCase() : labels.programPlural.toLowerCase()}`}
                actions={canMutate ? <NewProgramButton slug={slug} label={labels.program} /> : undefined}
            />
            {children}
        </>
    );
}
