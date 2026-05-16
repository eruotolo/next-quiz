import { AuthShell } from '@/features/auth/components/AuthShell';
import { StudentLoginForm } from '@/features/students/components/StudentLoginForm';

export const metadata = {
    title: 'Acceso estudiante · Aulika',
};

export default function StudentLoginPage(): React.JSX.Element {
    return (
        <AuthShell>
            <StudentLoginForm />
        </AuthShell>
    );
}
