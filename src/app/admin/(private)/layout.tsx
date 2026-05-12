import { auth } from '@/auth';
import { Sidebar } from '@/components/admin/Sidebar';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const session = await auth();
    if (!session) redirect('/admin/login');

    return (
        <div className="flex min-h-screen bg-muted/30">
            <Sidebar userName={session.user?.name} userEmail={session.user?.email} />
            <main className="ml-64 flex-1 overflow-y-auto">
                <div className="px-10 py-8">{children}</div>
            </main>
        </div>
    );
}
