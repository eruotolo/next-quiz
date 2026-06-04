'use client';

import type * as React from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib/utils';

function Tabs({ ...props }: React.ComponentProps<typeof TabsPrimitive.Root>): React.JSX.Element {
    return <TabsPrimitive.Root data-slot="tabs" {...props} />;
}

function TabsList({
    className,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.List>): React.JSX.Element {
    return (
        <TabsPrimitive.List
            data-slot="tabs-list"
            className={cn(
                'bg-paper-warm inline-flex h-9 items-center gap-1 rounded-[8px] p-1',
                className,
            )}
            {...props}
        />
    );
}

function TabsTrigger({
    className,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>): React.JSX.Element {
    return (
        <TabsPrimitive.Trigger
            data-slot="tabs-trigger"
            className={cn(
                'text-mute inline-flex items-center justify-center gap-1.5 rounded-[6px] px-3 py-1 font-mono text-[11px] font-medium tracking-[0.06em] whitespace-nowrap uppercase transition-colors',
                'hover:text-ink',
                'data-[state=active]:text-ink data-[state=active]:bg-white data-[state=active]:shadow-sm',
                'disabled:pointer-events-none disabled:opacity-50',
                '[&>svg]:pointer-events-none [&>svg]:size-3',
                className,
            )}
            {...props}
        />
    );
}

function TabsContent({
    className,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>): React.JSX.Element {
    return (
        <TabsPrimitive.Content
            data-slot="tabs-content"
            className={cn('mt-4 outline-none', className)}
            {...props}
        />
    );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
