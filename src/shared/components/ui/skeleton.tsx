import type * as React from 'react';

import { cn } from '@/shared/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
    return (
        <div
            data-slot="skeleton"
            className={cn('animate-pulse rounded-[8px] bg-border', className)}
            {...props}
        />
    );
}

export { Skeleton };
