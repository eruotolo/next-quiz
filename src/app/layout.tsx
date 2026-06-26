import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Bricolage_Grotesque, Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/shared/components/ui/sonner';
import { getGlobalSeo } from '@/shared/lib/seo';
import { GoogleAnalytics, AnalyticsProvider } from '@/shared/components/analytics';
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

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0b0b11' },
    ],
    width: 'device-width',
    initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
    const seo = await getGlobalSeo();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return {
        metadataBase: new URL(baseUrl),
        title: {
            default: seo.title,
            template: `%s | ${seo.title}`,
        },
        description: seo.description,
        keywords: seo.keywords,
        authors: [{ name: 'Aulika Team' }],
        creator: 'Aulika',
        publisher: 'Aulika',
        formatDetection: {
            email: false,
            address: false,
            telephone: false,
        },
        openGraph: {
            title: seo.title,
            description: seo.description,
            url: baseUrl,
            siteName: seo.title,
            images: [
                {
                    url: '/opengraph-image',
                    width: 1200,
                    height: 630,
                    alt: seo.title,
                },
            ],
            locale: 'es_CL',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: seo.title,
            description: seo.description,
            images: ['/opengraph-image'],
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
        alternates: {
            canonical: baseUrl,
        },
        icons: {
            icon: [
                { url: '/icon', type: 'image/png' },
                { url: '/icon', sizes: '32x32', type: 'image/png' },
            ],
            shortcut: '/icon',
            apple: [{ url: '/icon', sizes: '180x180', type: 'image/png' }],
            other: [
                {
                    rel: 'apple-touch-icon-precomposed',
                    url: '/icon',
                },
            ],
        },
    };
}

export default function RootLayout({ children }: { children: ReactNode }) {
    const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';

    return (
        <html
            lang="es"
            className={`light ${bricolage.variable} ${geist.variable} ${geistMono.variable} `}
        >
            <body className="min-h-screen font-sans">
                {children}
                <Toaster richColors position="top-right" />
                {/* Google Analytics — solo carga si la variable de entorno está definida */}
                <GoogleAnalytics measurementId={gaMeasurementId} />
                <AnalyticsProvider />
            </body>
        </html>
    );
}
