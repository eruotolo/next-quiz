import { HelpGuide } from '@/features/help/components/HelpGuide';
import { requireInstitutionPageAccess } from '@/shared/lib/auth-guard';

export const metadata = {
    title: 'Centro de ayuda · Aulika',
};

export default async function AyudaPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<React.JSX.Element> {
    const { slug } = await params;
    const { isProfesor } = await requireInstitutionPageAccess(slug);

    return <HelpGuide isProfesor={isProfesor} />;
}
