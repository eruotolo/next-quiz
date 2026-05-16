import type * as React from 'react';

import { cn } from '@/shared/lib/utils';

// ── Card ──────────────────────────────────────────────────────────────────
function Card({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card"
            className={cn(
                'bg-surface text-ink flex flex-col rounded-[14px] border border-border overflow-hidden',
                className,
            )}
            {...props}
        />
    );
}

// Optional 3px accent band at top — pass color via `style={{ '--accent-color': '#...' }}`
function CardAccent({ color, className }: { color?: string; className?: string }) {
    return (
        <div
            className={cn('h-[3px] w-full shrink-0', className)}
            style={{ background: color ?? 'var(--color-primary)' }}
        />
    );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-header"
            className={cn(
                'flex items-center justify-between gap-3 border-b border-border px-[22px] py-[18px]',
                className,
            )}
            {...props}
        />
    );
}

function CardHeaderDense({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-header"
            className={cn(
                'flex items-center justify-between gap-3 border-b border-border px-[18px] py-[14px]',
                className,
            )}
            {...props}
        />
    );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-title"
            className={cn(
                'font-display text-[18px] font-semibold leading-tight tracking-[-0.015em] text-ink',
                className,
            )}
            {...props}
        />
    );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-description"
            className={cn('mt-0.5 text-[12px] text-mute', className)}
            {...props}
        />
    );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-action"
            className={cn('flex shrink-0 items-center gap-1.5', className)}
            {...props}
        />
    );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-content"
            className={cn('p-[22px]', className)}
            {...props}
        />
    );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-footer"
            className={cn(
                'flex items-center border-t border-border bg-paper px-[22px] py-[14px]',
                className,
            )}
            {...props}
        />
    );
}

export {
    Card,
    CardAccent,
    CardHeader,
    CardHeaderDense,
    CardTitle,
    CardDescription,
    CardAction,
    CardContent,
    CardFooter,
};
