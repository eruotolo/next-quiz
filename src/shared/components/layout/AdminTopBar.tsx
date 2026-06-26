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
}: AdminTopBarProps) {
    return (
        <header
            className={cn(
                'border-border flex items-end justify-between gap-6 border-b bg-white py-[22px] pr-8 pl-14 lg:px-8',
                className,
            )}
        >
            <div className="min-w-0">
                {breadcrumb && breadcrumb.length > 0 && (
                    <nav className="text-mute mb-2 flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-[0.04em] uppercase">
                        {breadcrumb.map((item, i) => (
                            <div key={item} className="flex items-center gap-1.5">
                                {i > 0 && <span className="opacity-40">/</span>}
                                <span
                                    className={cn(
                                        i === breadcrumb.length - 1 ? 'text-ink' : 'text-mute',
                                    )}
                                >
                                    {item}
                                </span>
                            </div>
                        ))}
                    </nav>
                )}
                <h1 className="font-display text-ink flex items-center gap-2 text-[32px] leading-none font-medium tracking-[-0.025em]">
                    {icon && <span className="text-mute">{icon}</span>}
                    {title}
                </h1>
                {subtitle && <div className="text-ink-dim mt-2 text-[13px]">{subtitle}</div>}
            </div>

            <div className="flex shrink-0 items-center gap-2">{actions}</div>
        </header>
    );
}
