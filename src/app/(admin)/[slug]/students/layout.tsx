import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    params: Promise<{ slug: string }>;
}

export default async function StudentsLayout({ children, params }: Props) {
    const { slug } = await params;
    const { institutionId, institutionName, isProfesor, userId } =
        await requireInstitutionPageAccess(slug);

    const count = await prisma.user.count({
        where: {
            userRole: { name: USER_ROLE.STUDENT },
            academicInstitutionId: institutionId,
            ...(isProfesor && {
                group: { professors: { some: { id: userId } } },
            }),
        },
    });

    return (
        <>
            <AdminTopBar
                title="Estudiantes"
                breadcrumb={[institutionName, 'Estudiantes']}
                subtitle={`${count} registrados`}
            />
            {children}
        </>
    );
}
