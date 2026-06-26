import Script from 'next/script';

interface GoogleAnalyticsProps {
    measurementId: string;
}

/**
 * Componente que inyecta los scripts de Google Analytics (GA4).
 * Se coloca en el RootLayout para que cargue en todas las páginas.
 * Usa `strategy="afterInteractive"` para no bloquear el renderizado.
 *
 * NOTA: `send_page_view` se setea a false porque AnalyticsProvider
 * se encarga de trackear page views en cada cambio de ruta.
 * Esto evita duplicación de eventos.
 */
export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
    if (!measurementId) return null;

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${measurementId}', {
                        send_page_view: false,
                    });
                `}
            </Script>
        </>
    );
}
