import type { ReactNode } from 'react';
import { PublicNav } from '@/features/landing/components/PublicNav';
import { L3Footer } from '@/features/landing/components/L3Footer';

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col">
            <PublicNav />
            <main className="flex-1">{children}</main>
            <L3Footer />
        </div>
    );
}
