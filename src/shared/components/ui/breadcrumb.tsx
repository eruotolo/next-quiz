import type * as React from 'react';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { Slot } from 'radix-ui';

import { cn } from '@/shared/lib/utils';

function Breadcrumb({ ...props }: React.ComponentProps<'nav'>): React.JSX.Element {
    return <nav data-slot="breadcrumb" aria-label="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<'ol'>): React.JSX.Element {
    return (
        <ol
            data-slot="breadcrumb-list"
            className={cn(
                'text-mute flex flex-wrap items-center gap-1 font-mono text-[11px] font-medium tracking-[0.08em] uppercase',
                className,
            )}
            {...props}
        />
    );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>): React.JSX.Element {
    return (
        <li
            data-slot="breadcrumb-item"
            className={cn('inline-flex items-center gap-1', className)}
            {...props}
        />
    );
}

function BreadcrumbLink({
    asChild,
    className,
    ...props
}: React.ComponentProps<'a'> & { asChild?: boolean }): React.JSX.Element {
    const Comp = asChild ? Slot.Root : 'a';
    return (
        <Comp
            data-slot="breadcrumb-link"
            className={cn('hover:text-ink transition-colors', className)}
            {...props}
        />
    );
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>): React.JSX.Element {
    return (
        <span
            data-slot="breadcrumb-page"
            aria-current="page"
            className={cn('text-ink', className)}
            {...props}
        />
    );
}

function BreadcrumbSeparator({
    children,
    className,
    ...props
}: React.ComponentProps<'li'>): React.JSX.Element {
    return (
        <li
            data-slot="breadcrumb-separator"
            role="presentation"
            aria-hidden="true"
            className={cn('text-mute [&>svg]:size-3', className)}
            {...props}
        >
            {children ?? <ChevronRight />}
        </li>
    );
}

function BreadcrumbEllipsis({
    className,
    ...props
}: React.ComponentProps<'span'>): React.JSX.Element {
    return (
        <span
            data-slot="breadcrumb-ellipsis"
            role="presentation"
            aria-hidden="true"
            className={cn('flex size-6 items-center justify-center', className)}
            {...props}
        >
            <MoreHorizontal className="size-3" />
            <span className="sr-only">More</span>
        </span>
    );
}

export {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
};
