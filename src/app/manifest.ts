import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Aulika',
        short_name: 'Aulika',
        description: 'Sistema de evaluación online para colegios y universidades.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1f2eff',
        icons: [
            {
                src: '/icon',
                sizes: 'any',
                type: 'image/png',
            },
        ],
    };
}
