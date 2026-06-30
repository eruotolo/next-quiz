import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.aulika.cl';

    const ROUTES: MetadataRoute.Sitemap = [
        // Home
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },

        // PAES — página SEO de mayor potencial de tráfico
        {
            url: `${baseUrl}/paes`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.95,
        },

        // Cursos — vitrina B2C de Aulika Online (preuniversitario PAES)
        {
            url: `${baseUrl}/cursos`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },

        // Audiencias — páginas de producto con alta intención comercial
        {
            url: `${baseUrl}/audiencias/colegios`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.85,
        },
        {
            url: `${baseUrl}/audiencias/universidades`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.85,
        },
        {
            url: `${baseUrl}/audiencias/preuniversitarios`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.85,
        },
        {
            url: `${baseUrl}/audiencias/utps`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/audiencias/directores`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },

        // Demo — conversión
        {
            url: `${baseUrl}/demo`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.75,
        },

        // Recursos
        {
            url: `${baseUrl}/recursos/guia-profes`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/recursos/plantillas-paes`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/recursos/ayuda`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.65,
        },

        // Empresa
        {
            url: `${baseUrl}/empresa/manifiesto`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.55,
        },
        {
            url: `${baseUrl}/empresa/historia`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/empresa/equipo`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.5,
        },

        // Legal — indexables para confianza y cumplimiento
        {
            url: `${baseUrl}/empresa/privacidad`,
            lastModified: new Date('2026-06-26'),
            changeFrequency: 'yearly',
            priority: 0.4,
        },
        {
            url: `${baseUrl}/empresa/terminos`,
            lastModified: new Date('2026-06-26'),
            changeFrequency: 'yearly',
            priority: 0.4,
        },

        // Excluidos intencionalmente:
        // /login, /examen/login → páginas de autenticación, no contenido indexable
        // /recursos/estado → página operacional, no contenido
        // /demo/exam → protegido por sesión demo
        // /registro/* → flujos de pago, no indexables
    ];

    return ROUTES;
}
