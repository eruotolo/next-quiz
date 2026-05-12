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
}

export const RutInput = forwardRef<HTMLInputElement, RutInputProps>(
    (
        { name, value, onChange, error, isDisabled, label = 'RUT', placeholder = '12.345.678-9' },
        ref,
    ) => {
        const inputId = name ?? 'rut-input';
        return (
            <div className="flex flex-col gap-1.5">
                {label && (
                    <label htmlFor={inputId} className="text-default-700 text-sm font-medium">
                        {label}
                    </label>
                )}
                <IMaskInput
                    id={inputId}
                    mask="00.000.000-[*]"
                    definitions={{ '*': /[0-9kK]/ }}
                    value={value ?? ''}
                    onAccept={(val: string) => onChange?.(val)}
                    disabled={isDisabled}
                    placeholder={placeholder}
                    inputRef={ref as React.Ref<HTMLInputElement>}
                    className={`focus:border-primary h-12 w-full rounded-xl border-2 px-4 text-base font-medium transition-colors outline-none ${
                        error
                            ? 'border-danger bg-danger-50'
                            : 'border-default-200 focus:border-primary bg-white'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    name={name}
                />
                {error && <p className="text-danger text-sm">{error}</p>}
            </div>
        );
    },
);

RutInput.displayName = 'RutInput';
