import type * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { buttonVariants } from '@/shared/components/ui/button';

function Pagination({ className, ...props }: React.ComponentProps<'nav'>): React.JSX.Element {
    return (
        <nav
            aria-label="pagination"
            data-slot="pagination"
            className={cn('mx-auto flex w-full justify-center', className)}
            {...props}
        />
    );
}

function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>): React.JSX.Element {
    return (
        <ul
            data-slot="pagination-content"
            className={cn('flex flex-row items-center gap-1', className)}
            {...props}
        />
    );
}

function PaginationItem({ className, ...props }: React.ComponentProps<'li'>): React.JSX.Element {
    return <li data-slot="pagination-item" className={cn(className)} {...props} />;
}

type PaginationLinkProps = {
    isActive?: boolean;
} & React.ComponentProps<'a'>;

function PaginationLink({ className, isActive, ...props }: PaginationLinkProps): React.JSX.Element {
    return (
        <a
            aria-current={isActive ? 'page' : undefined}
            className={cn(
                buttonVariants({ variant: isActive ? 'primary' : 'ghost', size: 'icon-sm' }),
                'font-mono text-[11px]',
                className,
            )}
            {...props}
        />
    );
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<'a'>): React.JSX.Element {
    return (
        <PaginationLink
            aria-label="Go to previous page"
            className={cn('gap-1', className)}
            {...props}
        >
            <ChevronLeft className="size-4" />
        </PaginationLink>
    );
}

function PaginationNext({ className, ...props }: React.ComponentProps<'a'>): React.JSX.Element {
    return (
        <PaginationLink
            aria-label="Go to next page"
            className={cn('gap-1', className)}
            {...props}
        >
            <ChevronRight className="size-4" />
        </PaginationLink>
    );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>): React.JSX.Element {
    return (
        <span
            aria-hidden
            data-slot="pagination-ellipsis"
            className={cn('flex size-8 items-center justify-center text-mute', className)}
            {...props}
        >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">More pages</span>
        </span>
    );
}

export {
    Pagination,
    PaginationContent,
    PaginationLink,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
};
