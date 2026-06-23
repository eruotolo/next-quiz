import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { prisma } from '@/shared/lib/prisma';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export default async function InstitutionsLayout({ children }: Props) {
    const count = await prisma.academicInstitution.count();

    return (
        <>
            <AdminTopBar
                title="Instituciones"
                breadcrumb={['Sistema', 'Instituciones']}
                subtitle={`${count} entidades educativas registradas en la plataforma`}
            />
            {children}
        </>
    );
}
