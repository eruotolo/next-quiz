'use client';

import type * as React from 'react';
import { Switch as SwitchPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib/utils';

function Switch({
    className,
    ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>): React.JSX.Element {
    return (
        <SwitchPrimitive.Root
            data-slot="switch"
            className={cn(
                'peer focus-visible:ring-primary/20 data-[state=checked]:bg-primary data-[state=unchecked]:bg-border inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            {...props}
        >
            <SwitchPrimitive.Thumb
                data-slot="switch-thumb"
                className="pointer-events-none block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5"
            />
        </SwitchPrimitive.Root>
    );
}

export { Switch };
