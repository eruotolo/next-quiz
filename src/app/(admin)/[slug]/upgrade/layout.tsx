import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    params: Promise<{ slug: string }>;
}

export default async function UpgradeLayout({ children, params }: Props) {
    const { slug } = await params;
    const { institutionName } = await requireInstitutionPageAccess(slug);

    return (
        <>
            <AdminTopBar
                title="Mejorá tu plan"
                breadcrumb={[institutionName, 'Planes']}
                icon={<Sparkles size={24} />}
                subtitle="Elegí el plan que mejor se adapta a tu institución. El cambio se aplica al confirmar el pago."
            />
            {children}
        </>
    );
}
