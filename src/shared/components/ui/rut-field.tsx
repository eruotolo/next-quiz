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

export function RutField({ id, value, onChange, disabled, className }: RutFieldProps) {
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

interface RutInputFieldProps {
    id?: string;
    label?: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    error?: string;
    className?: string;
}

/**
 * Variante de RutField con el mismo lenguaje visual que `InputField`
 * (`@/shared/components/ui/input`): label mono arriba + input con borde,
 * fondo blanco y foco primary. Pensada para formularios públicos
 * (checkout, registro) que ya usan `InputField` para el resto de los campos.
 */
export function RutInputField({
    id = 'rut',
    label = 'RUT',
    value,
    onChange,
    disabled,
    error,
    className,
}: RutInputFieldProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label
                htmlFor={id}
                className="text-ink-dim font-mono text-[11px] font-medium tracking-[0.08em] uppercase"
            >
                {label}
            </label>
            <IMaskInput
                id={id}
                mask={RUT_MASK}
                definitions={RUT_MASK_DEFINITIONS}
                value={value}
                onAccept={(val: string) => onChange(val)}
                disabled={disabled}
                placeholder="12.345.678-9"
                aria-invalid={Boolean(error)}
                className={cn(
                    'border-border placeholder:text-mute text-ink h-[38px] w-full min-w-0 rounded-[8px] border bg-white px-[14px] py-[11px] text-[14px] transition-colors outline-none',
                    'focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-2',
                    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                    'aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-2',
                    className,
                )}
            />
            {error && <p className="text-destructive text-[12px]">{error}</p>}
        </div>
    );
}
