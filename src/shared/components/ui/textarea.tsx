import type * as React from 'react';

import { cn } from '@/shared/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                'border-border placeholder:text-mute text-ink min-h-[80px] w-full resize-y rounded-[8px] border bg-white px-[14px] py-[11px] text-[14px] transition-colors outline-none',
                'focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-2',
                'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                'aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-2',
                className,
            )}
            {...props}
        />
    );
}

export { Textarea };
