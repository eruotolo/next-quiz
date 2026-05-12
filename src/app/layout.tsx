import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
    title: 'EduNext Quiz',
    description: 'Plataforma de exámenes en línea',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className="min-h-screen">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
