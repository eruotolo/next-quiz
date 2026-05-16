import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Aulika - EduNext Quiz',
        short_name: 'Aulika',
        description: 'Plataforma líder en exámenes y ensayos PAES para instituciones educativas.',
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
