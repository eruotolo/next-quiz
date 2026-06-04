import type * as React from 'react';

import { cn } from '@/shared/lib/utils';

interface TopBarProps {
    title: string;
    subtitle?: string;
    breadcrumb?: string;
    actions?: React.ReactNode;
    className?: string;
}

export function TopBar({
    title,
    subtitle,
    breadcrumb,
    actions,
    className,
}: TopBarProps): React.JSX.Element {
    return (
        <div
            className={cn(
                'border-border flex items-end justify-between gap-4 border-b bg-white px-8 py-5',
                className,
            )}
        >
            <div className="flex flex-col gap-0.5">
                {breadcrumb && (
                    <p className="text-mute font-mono text-[10px] font-medium tracking-[0.1em] uppercase">
                        {breadcrumb}
                    </p>
                )}
                <h1 className="font-display text-ink text-[28px] leading-none font-semibold tracking-[-0.025em]">
                    {title}
                </h1>
                {subtitle && <p className="text-ink-dim mt-0.5 text-[13px]">{subtitle}</p>}
            </div>

            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
    );
}
