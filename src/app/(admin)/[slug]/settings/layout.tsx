import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    params: Promise<{ slug: string }>;
}

export default async function SettingsLayout({ children, params }: Props) {
    const { slug } = await params;
    const { institutionName } = await requireInstitutionPageAccess(slug);

    return (
        <>
            <AdminTopBar
                title="Ajustes del Instituto"
                breadcrumb={[institutionName, 'Ajustes']}
                subtitle="Actualizá los datos del instituto. El identificador de URL no puede modificarse."
            />
            {children}
        </>
    );
}
