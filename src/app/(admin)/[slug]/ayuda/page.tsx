import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { HelpGuide } from '@/features/help/components/HelpGuide';
import { HelpCircle } from 'lucide-react';

export const metadata = {
    title: 'Centro de ayuda · Aulika',
};

export default async function AyudaPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const { institutionName, isProfesor } = await requireInstitutionPageAccess(slug);

    return (
        <>
            <AdminTopBar
                title="Centro de ayuda"
                breadcrumb={[institutionName, 'Ayuda']}
                icon={<HelpCircle size={26} />}
                subtitle={
                    isProfesor
                        ? 'Guía de uso del panel para profesores. Navegá las secciones para ver para qué sirve cada una y cómo se usa.'
                        : 'Guía de uso del panel para administradores. Navegá las secciones para ver para qué sirve cada una y cómo se usa.'
                }
            />
            <HelpGuide isProfesor={isProfesor} />
        </>
    );
}
