import type { ReactNode } from 'react';
import { PublicNav } from '@/features/landing/components/PublicNav';
import { L3Footer } from '@/features/landing/components/L3Footer';

export default function PublicLayout({ children }: { children: ReactNode }): React.JSX.Element {
    return (
        <div className="flex flex-col min-h-screen">
            <PublicNav />
            <main className="flex-1">{children}</main>
            <L3Footer />
        </div>
    );
}
