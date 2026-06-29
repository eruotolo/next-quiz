'use client';

import 'driver.js/dist/driver.css';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { PAGE_TOUR_STEPS, getPageKey } from '@/features/tour/lib/tour-steps';
import type { DriveStep } from 'driver.js';

const DASHBOARD_TOUR_KEY = 'aulika-tour-seen-v1';

function startTour(steps: DriveStep[]): void {
    import('driver.js').then(({ driver }) => {
        const driverObj = driver({
            animate: true,
            showProgress: true,
            progressText: '{{current}} de {{total}}',
            nextBtnText: 'Siguiente →',
            prevBtnText: '← Anterior',
            doneBtnText: 'Finalizar',
            overlayColor: '#0b0b11',
            overlayOpacity: 0.55,
            popoverClass: 'aulika-tour-popover',
            onDestroyStarted: () => {
                localStorage.setItem(DASHBOARD_TOUR_KEY, '1');
                driverObj.destroy();
            },
            steps,
        });
        driverObj.drive();
    });
}

interface Props {
    slug: string;
}

export function TourButton({ slug }: Props) {
    const pathname = usePathname();
    const pageKey = getPageKey(pathname, slug);
    const steps = pageKey ? PAGE_TOUR_STEPS[pageKey] : null;

    // Listen for direct start requests from the Sidebar "Tour de bienvenida" button
    useEffect(() => {
        if (!steps) return;
        const handler = () => startTour(steps);
        window.addEventListener('aulika:start-tour', handler);
        return () => window.removeEventListener('aulika:start-tour', handler);
    }, [steps]);

    // Auto-start dashboard tour on first visit only
    useEffect(() => {
        if (pageKey !== 'dashboard') return;
        if (localStorage.getItem(DASHBOARD_TOUR_KEY)) return;
        const dashSteps = PAGE_TOUR_STEPS.dashboard;
        if (!dashSteps) return;
        const t = setTimeout(() => startTour(dashSteps), 1500);
        return () => clearTimeout(t);
    }, [pageKey]);

    if (!steps) return null;

    return (
        <button
            type="button"
            onClick={() => startTour(steps)}
            aria-label="Iniciar tour guiado"
            className="fixed right-16 bottom-5 z-[9999] flex h-10 w-10 items-center justify-center rounded-full bg-[#1f2eff] text-white shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2eff] focus-visible:ring-offset-2"
        >
            <span className="text-[15px] font-bold leading-none">?</span>
        </button>
    );
}
