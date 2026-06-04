import { auth } from '@/features/auth/auth';
import { AdminLoginForm } from '@/features/auth/components/AdminLoginForm';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { USER_ROLE } from '@/shared/lib/roles';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Acceso docente · Aulika',
};

interface LoginPageProps {
    searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({
    searchParams,
}: LoginPageProps): Promise<React.JSX.Element> {
    const session = await auth();

    if (session?.user) {
        if (session.user.userRoleName === USER_ROLE.SUPER_ADMIN) {
            redirect('/config');
        } else if (session.user.institutionSlug) {
            redirect(`/${session.user.institutionSlug}`);
        }
    }

    const { error } = await searchParams;

    return (
        <AuthShell>
            <AdminLoginForm googleError={error} />
        </AuthShell>
    );
}
