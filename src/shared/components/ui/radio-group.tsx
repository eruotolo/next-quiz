'use client';

import type * as React from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { Circle } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

function RadioGroup({
    className,
    ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>): React.JSX.Element {
    return (
        <RadioGroupPrimitive.Root
            data-slot="radio-group"
            className={cn('flex flex-col gap-2', className)}
            {...props}
        />
    );
}

function RadioGroupItem({
    className,
    ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>): React.JSX.Element {
    return (
        <RadioGroupPrimitive.Item
            data-slot="radio-group-item"
            className={cn(
                'aspect-square size-4 rounded-full border border-border bg-white text-primary transition-colors outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary',
                'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            {...props}
        >
            <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                <Circle className="size-2 fill-white stroke-white" />
            </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
    );
}

export { RadioGroup, RadioGroupItem };
