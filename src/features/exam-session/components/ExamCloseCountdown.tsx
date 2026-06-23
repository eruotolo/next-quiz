'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ExamCloseCountdownProps {
    // Segundos restantes hasta el cierre, calculados en el servidor (prop estable → sin mismatch de hidratación).
    initialSeconds: number;
}

function format(totalSeconds: number): string {
    const safe = Math.max(0, totalSeconds);
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;
    const pad = (n: number): string => String(n).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function ExamCloseCountdown({ initialSeconds }: ExamCloseCountdownProps): React.JSX.Element {
    const router = useRouter();
    const endsAtRef = useRef<number>(Date.now() + initialSeconds * 1000);
    const [remaining, setRemaining] = useState(initialSeconds);

    useEffect(() => {
        const id = setInterval(() => {
            const next = Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000));
            setRemaining(next);
            if (next <= 0) {
                clearInterval(id);
                // Al cerrarse, el servidor reclasifica el examen (deja de ser rendible).
                router.refresh();
            }
        }, 1000);
        return () => clearInterval(id);
    }, [router]);

    return (
        <span
            className="tabular-nums"
            role="timer"
            aria-live="polite"
            aria-label={`Cierre en: ${format(remaining)}`}
        >
            {format(remaining)}
        </span>
    );
}
