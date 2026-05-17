import type { ReactNode } from 'react';
import { AuthShell } from '@/features/auth/components/AuthShell';

export default function SignupLayout({ children }: { children: ReactNode }): React.JSX.Element {
    return <AuthShell>{children}</AuthShell>;
}
