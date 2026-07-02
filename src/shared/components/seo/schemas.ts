const BASE_URL = 'https://www.aulika.cl';

export const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    name: 'Aulika',
    url: BASE_URL,
    logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/icon`,
        width: 512,
        height: 512,
    },
    description:
        'Sistema de evaluación en línea para colegios y universidades de Chile. Corrección automática, banco de preguntas y resultados en tiempo real.',
    foundingLocation: {
        '@type': 'Place',
        addressCountry: 'CL',
    },
    areaServed: {
        '@type': 'Country',
        name: 'Chile',
    },
    sameAs: [] as string[],
} as const;

export const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${BASE_URL}/#app`,
    name: 'Aulika',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    url: BASE_URL,
    description:
        'Plataforma de evaluación online para instituciones educativas en Chile. Crea exámenes, aplícalos con login por RUT y obtén resultados automáticos al instante.',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'CLP',
        description:
            'Plan gratuito disponible. Planes pagos para instituciones desde $9.990 CLP/mes.',
    },
    publisher: {
        '@id': `${BASE_URL}/#organization`,
    },
    inLanguage: 'es-CL',
    featureList: [
        'Corrección automática de evaluaciones',
        'Login de estudiantes por RUT',
        'Tablero en vivo para docentes',
        'Banco de preguntas reutilizable',
        'Importación desde Excel y Google Forms',
        'Detección de copia',
        'Exportación de resultados',
        'Compatible con móviles y tablets',
    ],
    screenshot: `${BASE_URL}/opengraph-image`,
} as const;

export const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    url: BASE_URL,
    name: 'Aulika',
    description: 'Sistema de evaluación online para colegios y universidades de Chile',
    publisher: { '@id': `${BASE_URL}/#organization` },
    inLanguage: 'es-CL',
} as const;

export function faqSchema(faqs: Array<{ q: string; a: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a,
            },
        })),
    };
}

/**
 * Schema `Course` para cursos del Aula Virtual que se exhiben en el catálogo
 * B2C (`/[slug]/cursos`). Inyectar tanto en la grilla como en la página de
 * detalle para que Google los indexe como productos educativos.
 */
export interface CourseSchemaInput {
    name: string;
    description: string | null;
    providerName: string;
    url: string;
    priceClp: number | null;
    isFree: boolean;
}

export function courseSchema(course: CourseSchemaInput) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: course.name,
        description: course.description ?? undefined,
        provider: {
            '@type': 'Organization',
            name: course.providerName,
            sameAs: BASE_URL,
        },
        url: course.url,
        inLanguage: 'es-CL',
        isAccessibleForFree: course.isFree,
        offers: course.isFree
            ? {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'CLP',
                  availability: 'https://schema.org/InStock',
                  url: course.url,
              }
            : {
                  '@type': 'Offer',
                  price: course.priceClp ?? 0,
                  priceCurrency: 'CLP',
                  availability: 'https://schema.org/InStock',
                  url: course.url,
              },
    };
}
