import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface AdminTopBarProps {
    title: string;
    breadcrumb?: string[];
    subtitle?: string | ReactNode;
    icon?: ReactNode;
    actions?: ReactNode;
    className?: string;
}

export function AdminTopBar({
    title,
    breadcrumb,
    subtitle,
    icon,
    actions,
    className,
}: AdminTopBarProps): React.JSX.Element {
    return (
        <header
            className={cn(
                'flex items-end justify-between gap-6 border-b border-border bg-white px-8 py-[22px]',
                className,
            )}
        >
            <div className="min-w-0">
                {breadcrumb && breadcrumb.length > 0 && (
                    <nav className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-[0.04em] text-mute uppercase">
                        {breadcrumb.map((item, i) => (
                            <div key={item} className="flex items-center gap-1.5">
                                {i > 0 && <span className="opacity-40">/</span>}
                                <span className={cn(i === breadcrumb.length - 1 ? 'text-ink' : 'text-mute')}>
                                    {item}
                                </span>
                            </div>
                        ))}
                    </nav>
                )}
                <h1 className="flex items-center gap-2 font-display text-[32px] font-medium leading-none tracking-[-0.025em] text-ink">
                    {icon && <span className="text-mute">{icon}</span>}
                    {title}
                </h1>
                {subtitle && (
                    <div className="mt-2 text-[13px] text-ink-dim">
                        {subtitle}
                    </div>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
                {actions}
            </div>
        </header>
    );
}
