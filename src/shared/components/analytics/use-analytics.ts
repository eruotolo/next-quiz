'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

declare global {
    interface Window {
        gtag: (
            command: 'config' | 'event' | 'js' | 'set',
            targetId: string,
            params?: Record<string, unknown>,
        ) => void;
        dataLayer: unknown[];
    }
}

// ─── Tipos de eventos personalizados ─────────────────────────────────────────

export type GaEventParams = {
    // Eventos estándar de GA4
    category?: string;
    label?: string;
    value?: number;
    // Parámetros adicionales (ecommerce, etc.)
    [key: string]: unknown;
};

// ─── Guardias y helpers ─────────────────────────────────────────────────────────

/**
 * Verifica si Google Analytics está disponible y habilitado.
 * Retorna false si:
 * - Está en el servidor (typeof window === 'undefined')
 * - gtag no está disponible
 * - NEXT_PUBLIC_GA_DISABLED está seteado
 */
function isGaAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    if (!window.gtag) return false;
    if (process.env.NEXT_PUBLIC_GA_DISABLED === 'true') return false;
    return true;
}

/**
 * Log en modo desarrollo para debugging de analytics.
 */
function logAnalytics(action: string, data?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.info(`[GA] ${action}`, data);
    }
}

// ─── Funciones helper standalone (para usar fuera de componentes React) ───────

/**
 * Trackea una página vista manualmente.
 * Útil en SPAs cuando Next.js no re-dispara el `page_view` automático.
 */
export function trackPageView(url: string, measurementId?: string): void {
    if (!isGaAvailable()) {
        logAnalytics('Page view skipped (GA unavailable)', { url });
        return;
    }

    const id = measurementId ?? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (!id) {
        logAnalytics('Page view skipped (no measurement ID)', { url });
        return;
    }

    logAnalytics('Page view tracked', { url, id });
    window.gtag('config', id, {
        page_path: url,
    });
}

/**
 * Trackea un evento personalizado de GA4.
 *
 * @example
 * trackEvent('quiz_started', { category: 'engagement', label: 'biology_quiz' });
 * trackEvent('purchase', { value: 4990, currency: 'CLP' });
 */
export function trackEvent(eventName: string, params?: GaEventParams): void {
    if (!isGaAvailable()) {
        logAnalytics('Event skipped (GA unavailable)', { eventName });
        return;
    }

    logAnalytics('Event tracked', { eventName, params });
    window.gtag('event', eventName, params ?? {});
}

// ─── Hook de Analytics ────────────────────────────────────────────────────────

/**
 * Hook que auto-trackea cambios de ruta (page_view) y expone
 * la función `track` para eventos personalizados.
 *
 * @example
 * const { track } = useAnalytics();
 * track('button_click', { label: 'start_quiz' });
 */
export function useAnalytics(measurementId?: string) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!isGaAvailable()) return;

        const id = measurementId ?? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
        if (!id) {
            logAnalytics('useAnalytics: no measurement ID provided');
            return;
        }

        const url = searchParams?.toString()
            ? `${pathname}?${searchParams.toString()}`
            : pathname;

        trackPageView(url, id);
    }, [pathname, searchParams, measurementId]);

    return { track: trackEvent };
}
