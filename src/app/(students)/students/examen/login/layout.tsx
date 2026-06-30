import type { ReactNode } from 'react';
import { AuthShell } from '@/features/auth/components/AuthShell';

export default function StudentLoginLayout({ children }: { children: ReactNode }) {
    return <AuthShell>{children}</AuthShell>;
}
