import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { prisma } from '@/shared/lib/prisma';
import { ScrollText } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export default async function AuditoriaLayout({ children }: Props) {
    const count = await prisma.auditLog.count();

    return (
        <>
            <AdminTopBar
                title="Auditoría"
                breadcrumb={['Sistema', 'Auditoría']}
                icon={<ScrollText size={18} />}
                subtitle={`${count.toLocaleString('es-CL')} eventos registrados en total`}
            />
            {children}
        </>
    );
}
