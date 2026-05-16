'use client';

import type * as React from 'react';
import { Dialog as SheetPrimitive } from 'radix-ui';
import { X } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>): React.JSX.Element {
    return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>): React.JSX.Element {
    return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>): React.JSX.Element {
    return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>): React.JSX.Element {
    return <SheetPrimitive.Portal {...props} />;
}

function SheetOverlay({
    className,
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>): React.JSX.Element {
    return (
        <SheetPrimitive.Overlay
            data-slot="sheet-overlay"
            className={cn(
                'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm',
                className,
            )}
            {...props}
        />
    );
}

interface SheetContentProps extends React.ComponentProps<typeof SheetPrimitive.Content> {
    side?: 'left' | 'right' | 'top' | 'bottom';
}

function SheetContent({
    className,
    side = 'right',
    children,
    ...props
}: SheetContentProps): React.JSX.Element {
    return (
        <SheetPortal>
            <SheetOverlay />
            <SheetPrimitive.Content
                data-slot="sheet-content"
                className={cn(
                    'fixed z-50 flex flex-col gap-4 bg-white shadow-xl transition ease-in-out',
                    'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-300',
                    side === 'right' && 'inset-y-0 right-0 h-full w-3/4 max-w-sm border-l border-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
                    side === 'left' && 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r border-border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
                    side === 'top' && 'inset-x-0 top-0 h-auto border-b border-border data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
                    side === 'bottom' && 'inset-x-0 bottom-0 h-auto border-t border-border data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
                    className,
                )}
                {...props}
            >
                {children}
                <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none">
                    <X className="size-4" />
                    <span className="sr-only">Cerrar</span>
                </SheetPrimitive.Close>
            </SheetPrimitive.Content>
        </SheetPortal>
    );
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
    return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
    return (
        <div className={cn('mt-auto flex flex-col gap-2 p-6', className)} {...props} />
    );
}

function SheetTitle({
    className,
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>): React.JSX.Element {
    return (
        <SheetPrimitive.Title
            data-slot="sheet-title"
            className={cn('font-display text-[20px] font-semibold text-ink tracking-[-0.02em]', className)}
            {...props}
        />
    );
}

function SheetDescription({
    className,
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>): React.JSX.Element {
    return (
        <SheetPrimitive.Description
            data-slot="sheet-description"
            className={cn('text-[13px] text-ink-dim', className)}
            {...props}
        />
    );
}

export {
    Sheet,
    SheetTrigger,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
};
