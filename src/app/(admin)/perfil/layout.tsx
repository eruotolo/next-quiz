import { auth } from '@/features/auth/auth';
import { Sidebar } from '@/features/dashboard/components/Sidebar';
import { USER_ROLE } from '@/shared/lib/roles';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

export default async function PerfilLayout({
    children,
}: {
    children: ReactNode;
}) {
    const session = await auth();
    if (!session) redirect('/login');

    const isSuper = session.user.userRoleName === USER_ROLE.SUPER_ADMIN;

    return (
        <div className="bg-paper flex min-h-screen">
            <Sidebar
                isSuper={isSuper}
                slug={isSuper ? undefined : (session.user.institutionSlug ?? undefined)}
                userName={session.user?.name}
                userRole={session.user?.userRoleName}
            />
            <main className="ml-60 flex-1 overflow-y-auto">{children}</main>
        </div>
    );
}
