import type * as React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

interface StatTileProps {
    label: string;
    value: string | number;
    sub?: string;
    diff?: number;
    icon?: React.ReactNode;
    tone?: 'default' | 'primary' | 'ink' | 'lime';
    className?: string;
}

const TILE_TONES = {
    default: 'bg-surface border border-border text-ink',
    primary: 'bg-primary-wash text-primary',
    ink: 'bg-ink text-white',
    lime: 'bg-lime text-ink',
} as const;

const VALUE_TONES = {
    default: 'text-ink',
    primary: 'text-primary',
    ink: 'text-white',
    lime: 'text-ink',
} as const;

const LABEL_TONES = {
    default: 'text-mute',
    primary: 'text-primary/70',
    ink: 'text-white/50',
    lime: 'text-ink/60',
} as const;

function StatTile({
    label,
    value,
    sub,
    diff,
    icon,
    tone = 'default',
    className,
}: StatTileProps): React.JSX.Element {
    const isPositive = diff !== undefined && diff >= 0;

    return (
        <div
            data-slot="stat-tile"
            className={cn(
                'flex flex-col gap-2 rounded-[14px] p-5',
                TILE_TONES[tone],
                className,
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <span
                    className={cn(
                        'font-mono text-[10px] font-medium uppercase tracking-[0.12em]',
                        LABEL_TONES[tone],
                    )}
                >
                    {label}
                </span>
                {icon && (
                    <span className={cn('shrink-0 [&>svg]:size-4', LABEL_TONES[tone])}>
                        {icon}
                    </span>
                )}
            </div>

            <div className="flex items-end gap-2">
                <span
                    className={cn(
                        'font-display text-[44px] font-semibold leading-none tracking-[-0.025em]',
                        VALUE_TONES[tone],
                    )}
                >
                    {value}
                </span>
                {diff !== undefined && (
                    <span
                        className={cn(
                            'mb-1 inline-flex items-center gap-0.5 font-mono text-[11px] font-medium',
                            isPositive
                                ? 'text-success'
                                : 'text-destructive',
                            tone === 'ink' && (isPositive ? 'text-[#4ade80]' : 'text-[#f87171]'),
                        )}
                    >
                        {isPositive ? (
                            <TrendingUp className="size-3" />
                        ) : (
                            <TrendingDown className="size-3" />
                        )}
                        {Math.abs(diff)}%
                    </span>
                )}
            </div>

            {sub && (
                <p className={cn('text-[12px]', LABEL_TONES[tone])}>{sub}</p>
            )}
        </div>
    );
}

export { StatTile };
export type { StatTileProps };
