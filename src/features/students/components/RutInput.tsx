'use client';
import { forwardRef } from 'react';
import { IMaskInput } from 'react-imask';

interface RutInputProps {
    name?: string;
    value?: string;
    onChange?: (value: string) => void;
    error?: string;
    isDisabled?: boolean;
    label?: string;
    placeholder?: string;
    labelPlacement?: 'inside' | 'outside' | 'outside-left';
}

export const RutInput = forwardRef<HTMLInputElement, RutInputProps>(
    (
        {
            name,
            value,
            onChange,
            error,
            isDisabled,
            label = 'RUT',
            placeholder = '12.345.678-9',
            labelPlacement = 'inside',
        },
        ref,
    ) => {
        const inputId = name ?? 'rut-input';
        return (
            <div className="flex flex-col gap-1.5">
                {label && labelPlacement === 'outside' && (
                    <label htmlFor={inputId} className="text-foreground text-sm font-medium">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <IMaskInput
                        id={inputId}
                        mask="00.000.000-[*]"
                        definitions={{ '*': /[0-9kK]/ }}
                        value={value ?? ''}
                        onAccept={(val: string) => onChange?.(val)}
                        disabled={isDisabled}
                        placeholder={placeholder}
                        inputRef={ref as React.Ref<HTMLInputElement>}
                        className={`group h-[48px] w-full rounded-xl border-2 px-4 text-[15px] font-medium transition-all outline-none ${
                            error
                                ? 'border-destructive bg-destructive/10'
                                : 'border-border hover:border-foreground focus:border-foreground bg-white'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                        name={name}
                    />
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
            </div>
        );
    },
);

RutInput.displayName = 'RutInput';
