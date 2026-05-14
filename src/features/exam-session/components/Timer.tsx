'use client';

import { cn } from '@/shared/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface TimerProps {
    initialSeconds: number;
    onTimeout: () => void;
}

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(totalSeconds: number): string {
    const safe = Math.max(0, totalSeconds);
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function Timer({ initialSeconds, onTimeout }: TimerProps) {
    const endsAtRef = useRef<number>(Date.now() + initialSeconds * 1000);
    const firedRef = useRef(false);
    const [remaining, setRemaining] = useState<number>(initialSeconds);

    useEffect(() => {
        const tick = (): void => {
            const next = Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000));
            setRemaining(next);
            if (next <= 0 && !firedRef.current) {
                firedRef.current = true;
                onTimeout();
            }
        };
        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, [onTimeout]);

    const danger = remaining <= 60;
    const warning = remaining <= 120 && !danger;
    const fraction = initialSeconds > 0 ? remaining / initialSeconds : 0;
    const dashOffset = CIRCUMFERENCE * (1 - fraction);

    return (
        <div
            role="timer"
            className="relative"
            aria-live="polite"
            aria-label={`Tiempo restante: ${formatTime(remaining)}`}
        >
            <svg aria-hidden="true" width="72" height="72" className="-rotate-90">
                <circle
                    cx="36"
                    cy="36"
                    r={RADIUS}
                    fill="none"
                    className="stroke-border"
                    strokeWidth="5"
                />
                <circle
                    cx="36"
                    cy="36"
                    r={RADIUS}
                    fill="none"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    className={cn(
                        'transition-[stroke-dashoffset] duration-1000 ease-linear',
                        danger
                            ? 'stroke-destructive'
                            : warning
                              ? 'stroke-warning'
                              : 'stroke-primary',
                    )}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                    className={cn(
                        'font-mono text-xs leading-none font-bold',
                        danger ? 'text-destructive' : warning ? 'text-warning' : 'text-foreground',
                    )}
                >
                    {formatTime(remaining)}
                </span>
            </div>
        </div>
    );
}
