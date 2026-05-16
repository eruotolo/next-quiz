import type * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/shared/lib/utils';

// ── Tag (Aulika native) ───────────────────────────────────────────────────
const tagVariants = cva(
    'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full font-mono font-medium whitespace-nowrap tracking-[0.04em] transition-colors [&>svg]:pointer-events-none [&>svg]:size-3',
    {
        variants: {
            tone: {
                default: 'bg-paper-warm text-ink',
                primary: 'bg-primary-wash text-primary',
                lime: 'bg-lime text-ink',
                ink: 'bg-ink text-white',
                success: 'bg-success-wash text-success',
                warning: 'bg-warning-wash text-warning',
                danger: 'bg-danger-wash text-destructive',
                outline: 'bg-transparent text-ink-dim border border-border',
            },
            size: {
                sm: 'px-2 py-0.5 text-[10px]',
                md: 'px-2.5 py-[5px] text-[11px]',
                lg: 'px-3 py-1.5 text-[12px]',
            },
        },
        defaultVariants: {
            tone: 'default',
            size: 'md',
        },
    },
);

function Tag({
    className,
    tone = 'default',
    size = 'md',
    asChild = false,
    ...props
}: React.ComponentProps<'span'> &
    VariantProps<typeof tagVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot.Root : 'span';
    return (
        <Comp
            data-slot="tag"
            className={cn(tagVariants({ tone, size, className }))}
            {...props}
        />
    );
}

// ── Badge (shadcn compat — maps to Tag under the hood) ────────────────────
const badgeVariants = cva(
    'inline-flex w-fit shrink-0 items-center gap-1 rounded-full font-mono font-medium whitespace-nowrap tracking-[0.04em] transition-colors [&>svg]:pointer-events-none [&>svg]:size-3',
    {
        variants: {
            variant: {
                default: 'bg-primary-wash text-primary px-2.5 py-[5px] text-[11px]',
                secondary: 'bg-paper-warm text-ink px-2.5 py-[5px] text-[11px]',
                destructive: 'bg-danger-wash text-destructive px-2.5 py-[5px] text-[11px]',
                outline: 'bg-transparent text-ink-dim border border-border px-2.5 py-[5px] text-[11px]',
                success: 'bg-success-wash text-success px-2.5 py-[5px] text-[11px]',
                warning: 'bg-warning-wash text-warning px-2.5 py-[5px] text-[11px]',
            },
        },
        defaultVariants: { variant: 'default' },
    },
);

function Badge({
    className,
    variant = 'default',
    asChild = false,
    ...props
}: React.ComponentProps<'span'> &
    VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot.Root : 'span';
    return (
        <Comp
            data-slot="badge"
            className={cn(badgeVariants({ variant }), className)}
            {...props}
        />
    );
}

export { Tag, tagVariants, Badge, badgeVariants };
