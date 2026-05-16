import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Bricolage_Grotesque, Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/shared/components/ui/sonner';
import { getGlobalSeo } from '@/shared/lib/seo';
import './globals.css';

const bricolage = Bricolage_Grotesque({
    subsets: ['latin'],
    axes: ['opsz'],
    variable: '--font-bricolage',
    display: 'swap',
});

const geist = Geist({
    subsets: ['latin'],
    variable: '--font-geist',
    display: 'swap',
});

const geistMono = Geist_Mono({
    subsets: ['latin'],
    variable: '--font-geist-mono',
    display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
    const seo = await getGlobalSeo();
    return {
        title: {
            default: seo.title,
            template: `%s | ${seo.title}`,
        },
        description: seo.description,
        keywords: seo.keywords,
        openGraph: {
            title: seo.title,
            description: seo.description,
            images: seo.ogImage ? [{ url: seo.ogImage }] : [],
            type: 'website',
        },
    };
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html
            lang="es"
            className={`light ${bricolage.variable} ${geist.variable} ${geistMono.variable} `}
        >
            <body className="min-h-screen font-sans">
                {children}
                <Toaster richColors position="top-right" />
            </body>
        </html>
    );
}
