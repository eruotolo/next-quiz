import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    params: Promise<{ slug: string }>;
}

export default async function AulaLayout({ children, params }: Props) {
    const { slug } = await params;
    const { institutionName } = await requireInstitutionPageAccess(slug);
    return (
        <>
            <AdminTopBar
                title="Aula Virtual"
                breadcrumb={[institutionName, 'Aula']}
                subtitle="Cursos, módulos y lecciones"
            />
            {children}
        </>
    );
}
