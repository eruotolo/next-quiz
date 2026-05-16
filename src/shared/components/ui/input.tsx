import type * as React from 'react';

import { cn } from '@/shared/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>): React.JSX.Element {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                'border-border placeholder:text-mute h-[38px] w-full min-w-0 rounded-[8px] border bg-white px-[14px] py-[11px] text-[14px] text-ink transition-colors outline-none',
                'file:text-ink file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
                'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
                'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
                className,
            )}
            {...props}
        />
    );
}

// ── InputWrapper — label + icon + prefix + hint + error ───────────────────
interface InputFieldProps extends React.ComponentProps<'input'> {
    label?: string;
    hint?: string;
    error?: string;
    prefix?: string;
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
    wrapperClassName?: string;
}

function InputField({
    label,
    hint,
    error,
    prefix,
    iconLeft,
    iconRight,
    wrapperClassName,
    className,
    id,
    ...props
}: InputFieldProps): React.JSX.Element {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const hasDecorator = Boolean(prefix ?? iconLeft ?? iconRight);

    return (
        <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-dim"
                >
                    {label}
                </label>
            )}
            {hasDecorator ? (
                <div className="relative flex items-center">
                    {iconLeft && (
                        <span className="pointer-events-none absolute left-[14px] flex items-center text-mute [&>svg]:size-4">
                            {iconLeft}
                        </span>
                    )}
                    {prefix && (
                        <span className="pointer-events-none absolute left-[14px] font-mono text-[13px] text-mute">
                            {prefix}
                        </span>
                    )}
                    <Input
                        id={inputId}
                        aria-invalid={Boolean(error)}
                        className={cn(
                            iconLeft && 'pl-10',
                            prefix && `pl-[${String(prefix.length * 8 + 22)}px]`,
                            iconRight && 'pr-10',
                            className,
                        )}
                        {...props}
                    />
                    {iconRight && (
                        <span className="pointer-events-none absolute right-[14px] flex items-center text-mute [&>svg]:size-4">
                            {iconRight}
                        </span>
                    )}
                </div>
            ) : (
                <Input
                    id={inputId}
                    aria-invalid={Boolean(error)}
                    className={className}
                    {...props}
                />
            )}
            {error && (
                <p className="text-[12px] text-destructive">{error}</p>
            )}
            {hint && !error && (
                <p className="text-[12px] text-mute">{hint}</p>
            )}
        </div>
    );
}

export { Input, InputField };
