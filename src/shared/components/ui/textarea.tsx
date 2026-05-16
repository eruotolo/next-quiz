import type * as React from 'react';

import { cn } from '@/shared/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>): React.JSX.Element {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                'border-border placeholder:text-mute min-h-[80px] w-full rounded-[8px] border bg-white px-[14px] py-[11px] text-[14px] text-ink transition-colors outline-none resize-y',
                'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
                'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
                className,
            )}
            {...props}
        />
    );
}

export { Textarea };
