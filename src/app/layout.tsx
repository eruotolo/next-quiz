import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
    title: 'EduNext Quiz',
    description: 'Plataforma de exámenes en línea',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="es" className="light">
            <body className="min-h-screen">
                {children}
                <Toaster richColors position="top-right" />
            </body>
        </html>
    );
}
