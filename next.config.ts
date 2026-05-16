import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactStrictMode: true,
    devIndicators: {
        position: 'bottom-right', // 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
    },
};

export default nextConfig;
