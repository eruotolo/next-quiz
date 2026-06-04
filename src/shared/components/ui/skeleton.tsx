import type * as React from 'react';

import { cn } from '@/shared/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
    return (
        <div
            data-slot="skeleton"
            className={cn('bg-border animate-pulse rounded-[8px]', className)}
            {...props}
        />
    );
}

export { Skeleton };
