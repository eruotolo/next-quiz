interface LogoProps {
    size?: number;
    className?: string;
}

// Full mark — self-contained with background rect. Use standalone.
export function LogoMark({ size = 36, className }: LogoProps): React.JSX.Element {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
            className={className}
        >
            <rect x="2" y="2" width="60" height="60" rx="14" fill="#006FEE" />
            <rect
                x="2"
                y="2"
                width="60"
                height="60"
                rx="14"
                fill="url(#logo-shine)"
                opacity="0.35"
            />
            <defs>
                <linearGradient
                    id="logo-shine"
                    x1="0"
                    y1="0"
                    x2="64"
                    y2="64"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#fff" stopOpacity="0.3" />
                    <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path
                d="M32 14a14 14 0 1 1 -9.9 23.9"
                stroke="#fff"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
            />
            <path
                d="M28 36l5 5 9-11"
                stroke="#fff"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
}

// Icon paths only — use inside an existing colored container (inherits currentColor).
export function LogoIcon({ size = 18, className }: LogoProps): React.JSX.Element {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
            className={className}
        >
            <path
                d="M32 14a14 14 0 1 1 -9.9 23.9"
                stroke="currentColor"
                strokeWidth="5.5"
                strokeLinecap="round"
                fill="none"
            />
            <path
                d="M28 36l5 5 9-11"
                stroke="currentColor"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
}
