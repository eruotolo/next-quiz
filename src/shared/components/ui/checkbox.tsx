'use client';

import type * as React from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { Check } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

function Checkbox({
    className,
    ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>): React.JSX.Element {
    return (
        <CheckboxPrimitive.Root
            data-slot="checkbox"
            className={cn(
                'peer size-4 shrink-0 rounded-[4px] border border-border bg-white transition-colors outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary',
                'data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'aria-invalid:border-destructive',
                className,
            )}
            {...props}
        >
            <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
                <Check className="size-3 stroke-[2.5]" />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}

export { Checkbox };
