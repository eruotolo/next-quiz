import { auth } from '@/features/auth/auth';
import { getInstitutionSettings } from '@/features/institutions/actions/queries';
import { InstitutionSettingsClient } from '@/features/institutions/components/InstitutionSettingsClient';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { USER_ROLE } from '@/shared/lib/roles';
import { redirect } from 'next/navigation';

export default async function SettingsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const [{ slug }, session] = await Promise.all([params, auth()]);
    if (!session) redirect('/login');

    const role = session.user.userRoleName;
    if (role !== USER_ROLE.SUPER_ADMIN && role !== USER_ROLE.ADMIN) {
        redirect(`/${slug}`);
    }

    const institution = await getInstitutionSettings(slug);
    if (!institution) redirect(`/${slug}`);

    return (
        <>
            <AdminTopBar
                title="Ajustes del Instituto"
                breadcrumb={[institution.name, 'Ajustes']}
                subtitle="Actualizá los datos del instituto. El identificador de URL no puede modificarse."
            />
            <InstitutionSettingsClient institution={institution} slug={slug} />
        </>
    );
}
