import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { HelpGuide } from '@/features/help/components/HelpGuide';

export const metadata = {
    title: 'Centro de ayuda · Aulika',
};

export default async function AyudaPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { institutionName, isProfesor } = await requireInstitutionPageAccess(slug);

    return <HelpGuide isProfesor={isProfesor} />;
}
