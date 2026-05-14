import { auth } from '@/features/auth/auth';
import { Sidebar } from '@/features/dashboard/components/Sidebar';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    params: Promise<{ slug: string }>;
}

export default async function InstitutionLayout({ children, params }: Props) {
    const { slug } = await params;
    const session = await auth();
    if (!session) redirect('/login');

    return (
        <div className="bg-muted/30 flex min-h-screen">
            <Sidebar slug={slug} userName={session.user?.name} userEmail={session.user?.email} />
            <main className="ml-64 flex-1 overflow-y-auto">
                <div className="px-10 py-8">{children}</div>
            </main>
        </div>
    );
}
