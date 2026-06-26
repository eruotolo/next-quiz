'use client';

import { Suspense } from 'react';
import { useAnalytics } from './use-analytics';

/**
 * Componente interno que usa `useSearchParams` (requiere Suspense en Next.js App Router).
 * El hook useAnalytics valida internamente si GA debe estar habilitado.
 */
function AnalyticsTracker() {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    useAnalytics(measurementId);
    return null;
}

/**
 * Wrapper con Suspense necesario porque `useSearchParams` requiere
 * un límite de Suspense en Next.js App Router (Next.js 13+).
 *
 * Coloca este componente en el RootLayout junto con <GoogleAnalytics />.
 */
export function AnalyticsProvider() {
    return (
        <Suspense fallback={null}>
            <AnalyticsTracker />
        </Suspense>
    );
}
