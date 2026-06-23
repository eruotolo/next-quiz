'use client';

import { cn } from '@/shared/lib/utils';
import { IMaskInput } from 'react-imask';

/**
 * Configuración de máscara RUT chileno compartida. Úsala en cualquier
 * `IMaskInput` que necesite distinto envoltorio visual al de `RutField`
 * (ej. formularios públicos con label-icono inline).
 */
export const RUT_MASK = '00.000.000-[*]' as const;
export const RUT_MASK_DEFINITIONS = { '*': /[0-9kK]/ } as const;

interface RutFieldProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

export function RutField({
    id,
    value,
    onChange,
    disabled,
    className,
}: RutFieldProps) {
    return (
        <IMaskInput
            id={id}
            mask={RUT_MASK}
            definitions={RUT_MASK_DEFINITIONS}
            value={value}
            onAccept={(val: string) => onChange(val)}
            disabled={disabled}
            placeholder="12.345.678-9"
            className={cn(
                'border-input selection:bg-primary selection:text-primary-foreground file:text-foreground placeholder:text-muted-foreground dark:bg-input/30 h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                className,
            )}
        />
    );
}
