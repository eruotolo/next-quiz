import type * as React from 'react';

import { cn } from '@/shared/lib/utils';

// ── Card ──────────────────────────────────────────────────────────────────
function Card({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card"
            className={cn(
                'bg-surface text-ink border-border flex flex-col overflow-hidden rounded-[14px] border',
                className,
            )}
            {...props}
        />
    );
}

// Optional 3px accent band at top — pass a color via `color` prop.
// CSS var --ca-bg consumed by [background:var(--ca-bg)]; no direct CSS property in style.
function CardAccent({ color, className }: { color?: string; className?: string }) {
    return (
        <div
            className={cn('h-[3px] w-full shrink-0 [background:var(--ca-bg)]', className)}
            style={{ '--ca-bg': color ?? 'var(--color-primary)' } as React.CSSProperties}
        />
    );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-header"
            className={cn(
                'border-border flex items-center justify-between gap-3 border-b px-[22px] py-[18px]',
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
                'border-border flex items-center justify-between gap-3 border-b px-[18px] py-[14px]',
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
                'font-display text-ink text-[18px] leading-tight font-semibold tracking-[-0.015em]',
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
            className={cn('text-mute mt-0.5 text-[12px]', className)}
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
    return <div data-slot="card-content" className={cn('p-[22px]', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-footer"
            className={cn(
                'border-border bg-paper flex items-center border-t px-[22px] py-[14px]',
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
