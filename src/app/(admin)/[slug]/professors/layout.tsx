import type { ReactNode } from 'react';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { NewProfessorButton } from '@/features/professors/components/NewProfessorButton';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';

interface Props {
    children: ReactNode;
    params: Promise<{ slug: string }>;
}

export default async function ProfessorsLayout({ children, params }: Props) {
    const { slug } = await params;
    const { institutionId, institutionName, userRole } = await requireInstitutionPageAccess(slug);

    const count = await prisma.user.count({
        where: {
            academicInstitutionId: institutionId,
            userRole: { name: { in: [USER_ROLE.ADMIN, USER_ROLE.PROFESOR] } },
        },
    });

    const canMutate = userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPER_ADMIN;

    return (
        <>
            <AdminTopBar
                breadcrumb={[institutionName, 'Profesores']}
                title="Cuerpo Docente"
                subtitle={`${count} profesionales registrados en el equipo`}
                actions={canMutate ? <NewProfessorButton slug={slug} /> : undefined}
            />
            {children}
        </>
    );
}
