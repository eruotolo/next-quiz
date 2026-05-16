import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage(): ImageResponse {
    return new ImageResponse(
        <div
            style={{
                width: 1200,
                height: 630,
                background: '#0b0b11',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                padding: '80px 100px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
        >
            {/* Radial glow */}
            <div
                style={{
                    position: 'absolute',
                    top: -200,
                    left: -100,
                    width: 600,
                    height: 600,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(31,46,255,0.35) 0%, transparent 70%)',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: -150,
                    right: 100,
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(214,255,31,0.18) 0%, transparent 70%)',
                }}
            />

            {/* Lockup */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 52 }}>
                <div
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 13,
                        background: '#1f2eff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <svg width="36" height="36" viewBox="0 0 80 80" fill="none" aria-hidden="true">
                        <path
                            d="M22 60 L40 22 L58 60"
                            stroke="white"
                            strokeWidth="7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <circle cx="40" cy="44" r="5" fill="#d6ff1f" />
                    </svg>
                </div>
                <span
                    style={{
                        color: '#ffffff',
                        fontSize: 32,
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                    }}
                >
                    aulika
                </span>
            </div>

            {/* Headline */}
            <h1
                style={{
                    color: '#ffffff',
                    fontSize: 68,
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    lineHeight: 1.05,
                    margin: 0,
                    maxWidth: 900,
                }}
            >
                El examen de aula deja de ser un trámite
            </h1>

            {/* Sub */}
            <p
                style={{
                    color: '#75716b',
                    fontSize: 22,
                    marginTop: 24,
                    margin: '24px 0 0',
                    letterSpacing: '-0.01em',
                }}
            >
                Plataforma de exámenes en línea para instituciones educativas
            </p>
        </div>,
        { ...size },
    );
}
