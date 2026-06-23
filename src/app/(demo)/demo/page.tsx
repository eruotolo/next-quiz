import { auth } from '@/features/auth/auth';
import { DemoLoginCard } from '@/features/demo/components/DemoLoginCard';
import { DEMO_SLUG } from '@/features/demo/lib/demo';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Modo demo · Aulika',
    description: 'Prueba Aulika con un panel de demostración y datos de ejemplo.',
};

export default async function DemoPage() {
    const session = await auth();
    if (session?.user?.isDemo) redirect(`/${DEMO_SLUG}`);

    return <DemoLoginCard />;
}
