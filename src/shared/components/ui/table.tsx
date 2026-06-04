'use client';

import type * as React from 'react';

import { cn } from '@/shared/lib/utils';

function Table({ className, ...props }: React.ComponentProps<'table'>): React.JSX.Element {
    return (
        <div data-slot="table-container" className="relative w-full overflow-x-auto">
            <table
                data-slot="table"
                className={cn('w-full caption-bottom text-sm', className)}
                {...props}
            />
        </div>
    );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>): React.JSX.Element {
    return (
        <thead
            data-slot="table-header"
            className={cn('[&_tr]:border-border [&_tr]:border-b', className)}
            {...props}
        />
    );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>): React.JSX.Element {
    return (
        <tbody
            data-slot="table-body"
            className={cn('[&_tr:last-child]:border-0', className)}
            {...props}
        />
    );
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>): React.JSX.Element {
    return (
        <tfoot
            data-slot="table-footer"
            className={cn(
                'border-border bg-paper border-t font-medium [&>tr]:last:border-b-0',
                className,
            )}
            {...props}
        />
    );
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>): React.JSX.Element {
    return (
        <tr
            data-slot="table-row"
            className={cn(
                'border-border hover:bg-paper-warm/50 data-[state=selected]:bg-primary-wash border-b transition-colors',
                className,
            )}
            {...props}
        />
    );
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>): React.JSX.Element {
    return (
        <th
            data-slot="table-head"
            className={cn(
                'text-mute h-10 px-3 text-left align-middle font-mono text-[10px] font-medium tracking-[0.08em] whitespace-nowrap uppercase [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
                className,
            )}
            {...props}
        />
    );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>): React.JSX.Element {
    return (
        <td
            data-slot="table-cell"
            className={cn(
                'text-ink px-3 py-3 align-middle text-[13px] whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
                className,
            )}
            {...props}
        />
    );
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>): React.JSX.Element {
    return (
        <caption
            data-slot="table-caption"
            className={cn('text-mute mt-4 text-sm', className)}
            {...props}
        />
    );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
