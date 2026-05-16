import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon(): ImageResponse {
    return new ImageResponse(
        <div
            style={{
                width: 32,
                height: 32,
                borderRadius: 7,
                background: '#1f2eff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <svg width="21" height="21" viewBox="0 0 80 80" fill="none" aria-hidden="true">
                <path
                    d="M22 60 L40 22 L58 60"
                    stroke="white"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <circle cx="40" cy="44" r="5" fill="#d6ff1f" />
            </svg>
        </div>,
        { ...size },
    );
}
