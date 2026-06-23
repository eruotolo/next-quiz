import type { CSSProperties } from 'react';
import { cn } from '@/shared/lib/utils';

interface LogoMarkProps {
    size?: number;
    variant?: 'cobalto' | 'tinta' | 'lima' | 'papel';
    radius?: number;
    className?: string;
}

interface LogoWordmarkProps {
    size?: number;
    color?: string;
    className?: string;
}

interface LogoLockupProps {
    size?: number;
    variant?: 'cobalto' | 'tinta' | 'lima' | 'papel';
    className?: string;
}

// Source truth from aulika-brand.jsx
const MARK_VARIANTS = {
    cobalto: { bg: '#1f2eff', mark: '#ffffff', dot: '#d6ff1f', hairline: false },
    tinta: { bg: '#0b0b11', mark: '#ffffff', dot: '#d6ff1f', hairline: false },
    lima: { bg: '#d6ff1f', mark: '#0b0b11', dot: '#1f2eff', hairline: false },
    papel: { bg: '#ffffff', mark: '#0b0b11', dot: '#1f2eff', hairline: true },
} as const;

export function LogoMark({
    size = 36,
    variant = 'cobalto',
    radius = 18,
    className,
}: LogoMarkProps) {
    const v = MARK_VARIANTS[variant];
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 80 80"
            aria-hidden="true"
            className={className}
        >
            <rect
                x="0.5"
                y="0.5"
                width="79"
                height="79"
                rx={radius}
                fill={v.bg}
                stroke={v.hairline ? '#0b0b11' : 'transparent'}
                strokeOpacity={v.hairline ? 0.08 : 0}
            />
            <path
                d="M22 60 L40 22 L58 60"
                stroke={v.mark}
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            <circle cx="40" cy="44" r="4.2" fill={v.dot} />
        </svg>
    );
}

// Wordmark: "aulika" in Bricolage Grotesque 600, tracking -3.5%
// style only provides CSS vars; className consumes them via Tailwind arbitrary values.
export function LogoWordmark({
    size = 16,
    color,
    className,
}: LogoWordmarkProps) {
    return (
        <span
            className={cn(
                'font-display font-semibold leading-none tracking-[-0.035em] [font-feature-settings:"ss01"_on] [font-size:var(--lw-size)] [color:var(--lw-color)]',
                className,
            )}
            style={
                {
                    '--lw-size': `${size}px`,
                    '--lw-color': color ?? 'inherit',
                } as CSSProperties
            }
        >
            aulika
        </span>
    );
}

export function LogoLockup({
    size = 36,
    variant = 'cobalto',
    className,
}: LogoLockupProps) {
    const markSize = Math.round(size * 1.4);
    const wordSize = size;
    const gap = Math.round(size * 0.33);
    return (
        <div
            className={cn('inline-flex items-center gap-[var(--lw-gap)]', className)}
            style={{ '--lw-gap': `${gap}px` } as CSSProperties}
        >
            <LogoMark size={markSize} variant={variant} />
            <LogoWordmark size={wordSize} />
        </div>
    );
}
