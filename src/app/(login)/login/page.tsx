import { AuthShell } from '@/features/auth/components/AuthShell';
import { AdminLoginForm } from '@/features/auth/components/AdminLoginForm';

export const metadata = {
    title: 'Acceso docente · Aulika',
};

export default function LoginPage(): React.JSX.Element {
    return (
        <AuthShell>
            <AdminLoginForm />
        </AuthShell>
    );
}
