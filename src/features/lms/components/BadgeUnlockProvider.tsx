'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { markBadgesSeen } from '@/features/lms/actions/gamification';
import type { AchievementBadge } from '@/features/lms/actions/gamification';
import type { ReactNode } from 'react';

interface BadgeToastProps {
    badge: AchievementBadge;
    onDismiss: () => void;
}

function BadgeToast({ badge, onDismiss }: BadgeToastProps) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 5500);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="pointer-events-auto relative flex w-80 items-start gap-3 overflow-hidden rounded-2xl border border-amber-200 bg-white p-4 shadow-xl"
        >
            {/* Icon */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-2xl shadow-sm">
                🏅
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold tracking-wider text-amber-600 uppercase">
                    ¡Insignia desbloqueada!
                </p>
                <p className="text-ink mt-0.5 font-bold">{badge.name}</p>
                <p className="text-mute mt-0.5 text-xs leading-snug">{badge.description}</p>
                {badge.pointsReward > 0 && (
                    <p className="mt-1 text-xs font-semibold text-amber-600">
                        +{badge.pointsReward} puntos
                    </p>
                )}
            </div>

            {/* Close */}
            <button
                type="button"
                onClick={onDismiss}
                aria-label="Cerrar"
                className="text-mute hover:text-ink shrink-0 text-lg leading-none"
            >
                ×
            </button>

            {/* Progress bar */}
            <motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-amber-400"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5.5, ease: 'linear' }}
            />
        </motion.div>
    );
}

interface Props {
    children: ReactNode;
    initialUnseenBadges: AchievementBadge[];
}

export function BadgeUnlockProvider({ children, initialUnseenBadges }: Props) {
    const [queue, setQueue] = useState<AchievementBadge[]>(initialUnseenBadges);

    const dismiss = useCallback(async () => {
        const current = queue[0];
        if (!current) return;
        setQueue((prev) => prev.slice(1));
        // fire-and-forget: fallo no bloquea la UI
        void markBadgesSeen([current.code]).catch(() => undefined);
    }, [queue]);

    const current = queue[0];

    return (
        <>
            {children}
            <div className="pointer-events-none fixed right-4 bottom-6 z-50 flex flex-col items-end gap-2">
                <AnimatePresence mode="wait">
                    {current && <BadgeToast key={current.id} badge={current} onDismiss={dismiss} />}
                </AnimatePresence>
            </div>
        </>
    );
}
