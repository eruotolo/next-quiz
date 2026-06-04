import { auth } from '@/features/auth/auth';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { DemoLoginCard } from '@/features/demo/components/DemoLoginCard';
import { DEMO_SLUG } from '@/features/demo/lib/demo';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Modo demo · Aulika',
    description: 'Probá Aulika con un panel de demostración y datos de ejemplo.',
};

export default async function DemoPage(): Promise<React.JSX.Element> {
    const session = await auth();
    if (session?.user?.isDemo) redirect(`/${DEMO_SLUG}`);

    return (
        <AuthShell>
            <DemoLoginCard />
        </AuthShell>
    );
}
