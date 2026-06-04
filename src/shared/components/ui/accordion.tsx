'use client';

import type * as React from 'react';
import { Accordion as AccordionPrimitive } from 'radix-ui';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

function Accordion({
    ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>): React.JSX.Element {
    return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
    className,
    ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>): React.JSX.Element {
    return (
        <AccordionPrimitive.Item
            data-slot="accordion-item"
            className={cn('border-border border-b', className)}
            {...props}
        />
    );
}

function AccordionTrigger({
    className,
    children,
    ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>): React.JSX.Element {
    return (
        <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger
                data-slot="accordion-trigger"
                className={cn(
                    'text-ink hover:text-primary flex flex-1 items-center justify-between gap-4 py-4 text-left text-[14px] font-medium transition-colors outline-none',
                    '[&>svg]:transition-transform [&>svg]:duration-200',
                    'data-[state=open]:[&>svg]:rotate-180',
                    className,
                )}
                {...props}
            >
                {children}
                <ChevronDown className="text-mute size-4 shrink-0" />
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    );
}

function AccordionContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>): React.JSX.Element {
    return (
        <AccordionPrimitive.Content
            data-slot="accordion-content"
            className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden"
            {...props}
        >
            <div className={cn('text-ink-dim pt-0 pb-4 text-[13px]', className)}>{children}</div>
        </AccordionPrimitive.Content>
    );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
