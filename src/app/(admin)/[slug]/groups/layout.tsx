import { NewGroupButton } from '@/features/groups/components/NewGroupButton';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { groupProfessorFilter } from '@/shared/lib/scoping';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    params: Promise<{ slug: string }>;
}

export default async function GroupsLayout({ children, params }: Props) {
    const { slug } = await params;
    const { institutionId, institutionName, userRole, userId, isProfesor } =
        await requireInstitutionPageAccess(slug);

    const canMutate = userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPER_ADMIN;

    const count = await prisma.group.count({
        where: {
            academicInstitutionId: institutionId,
            ...(isProfesor && groupProfessorFilter(userId)),
        },
    });

    return (
        <>
            <AdminTopBar
                breadcrumb={[institutionName, 'Grupos']}
                title="Grupos"
                subtitle={`${count} grupos registrados`}
                actions={canMutate ? <NewGroupButton slug={slug} /> : undefined}
            />
            {children}
        </>
    );
}
