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
}: LogoMarkProps): React.JSX.Element {
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
export function LogoWordmark({
    size = 16,
    color,
    className,
}: LogoWordmarkProps): React.JSX.Element {
    return (
        <span
            className={className}
            style={{
                fontFamily:
                    'var(--font-bricolage, "Bricolage Grotesque", "Geist", system-ui, sans-serif)',
                fontSize: size,
                fontWeight: 600,
                letterSpacing: '-0.035em',
                fontFeatureSettings: '"ss01" on',
                color: color ?? 'inherit',
                lineHeight: 1,
            }}
        >
            aulika
        </span>
    );
}

export function LogoLockup({
    size = 36,
    variant = 'cobalto',
    className,
}: LogoLockupProps): React.JSX.Element {
    const markSize = Math.round(size * 1.4);
    const wordSize = size;
    const gap = Math.round(size * 0.33);
    return (
        <div className={`inline-flex items-center ${className ?? ''}`} style={{ gap }}>
            <LogoMark size={markSize} variant={variant} />
            <LogoWordmark size={wordSize} />
        </div>
    );
}

/** @deprecated Use LogoMark */
export function LogoIcon({
    size = 18,
    className,
}: {
    size?: number;
    className?: string;
}): React.JSX.Element {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 80 80"
            fill="none"
            aria-hidden="true"
            className={className}
        >
            <path
                d="M22 60 L40 22 L58 60"
                stroke="currentColor"
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="40" cy="44" r="4.2" fill="currentColor" />
        </svg>
    );
}
