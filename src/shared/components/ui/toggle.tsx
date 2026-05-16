'use client';

import type * as React from 'react';
import { Toggle as TogglePrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/lib/utils';

const toggleVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-[8px] font-medium text-[13px] transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 [&>svg]:pointer-events-none [&>svg]:size-4',
    {
        variants: {
            variant: {
                default:
                    'bg-transparent text-ink-dim hover:bg-paper-warm hover:text-ink data-[state=on]:bg-paper-warm data-[state=on]:text-ink',
                outline:
                    'border border-border bg-transparent text-ink-dim hover:bg-paper-warm data-[state=on]:bg-paper-warm data-[state=on]:text-ink',
            },
            size: {
                sm: 'h-8 px-2.5',
                default: 'h-[38px] px-3',
                lg: 'h-[46px] px-4',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

function Toggle({
    className,
    variant,
    size,
    ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>): React.JSX.Element {
    return (
        <TogglePrimitive.Root
            data-slot="toggle"
            className={cn(toggleVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Toggle, toggleVariants };
