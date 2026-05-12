'use client';

import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
    const router = useRouter();

    return (
        <HeroUIProvider navigate={router.push}>
            <NextThemesProvider attribute="class" defaultTheme="light">
                <ToastProvider placement="top-right" />
                {children}
            </NextThemesProvider>
        </HeroUIProvider>
    );
}
