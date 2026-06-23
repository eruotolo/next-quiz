import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export default async function AdminsLayout({ children }: Props) {
    const count = await prisma.user.count({
        where: {
            userRole: { name: { in: [USER_ROLE.ADMIN, USER_ROLE.PROFESOR] } },
        },
    });

    return (
        <>
            <AdminTopBar
                title="Gestión de Accesos"
                breadcrumb={['Sistema', 'Administradores']}
                subtitle={`${count} usuarios con privilegios de gestión en la plataforma`}
            />
            {children}
        </>
    );
}
