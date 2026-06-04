import type * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/shared/lib/utils';

const buttonVariants = cva(
    // base
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[8px] font-semibold whitespace-nowrap leading-none transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                // Aulika primary
                primary: 'bg-primary text-white hover:bg-[#172ae6]',
                // default → alias primary (backward compat)
                default: 'bg-primary text-white hover:bg-[#172ae6]',
                // Ink — dark fill
                ink: 'bg-ink text-white hover:bg-[#1e1f29]',
                // Lime — energy accent
                lime: 'bg-lime text-ink font-bold hover:bg-[#c8f000]',
                // Ghost — border
                ghost: 'bg-transparent text-ink border border-border hover:bg-paper-warm',
                // Soft — warm fill
                soft: 'bg-paper-warm text-ink border-0 hover:bg-[#e5e0d0]',
                // Danger
                danger: 'bg-destructive text-white hover:bg-[#b82a17]',
                // backward compat alias
                destructive: 'bg-destructive text-white hover:bg-[#b82a17]',
                // Ghost on dark backgrounds
                'ghost-dark': 'bg-transparent text-white border border-white/20 hover:bg-white/10',
                // Outline (shadcn compat)
                outline: 'bg-transparent text-ink border border-border hover:bg-paper-warm',
                // Secondary (shadcn compat → soft)
                secondary: 'bg-paper-warm text-ink hover:bg-[#e5e0d0]',
                // Link
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                // Aulika sizes: sm=32 md=38 lg=46
                sm: 'h-8 px-3 text-[12px]',
                default: 'h-[38px] px-4 text-[13px]',
                md: 'h-[38px] px-4 text-[13px]',
                lg: 'h-[46px] px-[22px] text-[14px]',
                // icon sizes
                icon: 'size-[38px]',
                'icon-sm': 'size-8',
                'icon-lg': 'size-[46px]',
                xs: 'h-7 px-2.5 text-[11px]',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

function Button({
    className,
    variant = 'default',
    size = 'default',
    asChild = false,
    ...props
}: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) {
    const Comp = asChild ? Slot.Root : 'button';

    return (
        <Comp
            data-slot="button"
            data-variant={variant}
            data-size={size}
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
