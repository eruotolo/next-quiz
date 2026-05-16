import { prisma } from '@/shared/lib/prisma';
import { APP_CONFIG_KEY } from '@/features/config/lib/app-config-keys';

export interface SeoMetadata {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
}

/**
 * Obtiene el SEO global de la aplicación desde AppConfig
 */
export async function getGlobalSeo(): Promise<SeoMetadata> {
    const configs = await prisma.appConfig.findMany({
        where: {
            key: {
                in: [
                    APP_CONFIG_KEY.SEO_GLOBAL_TITLE,
                    APP_CONFIG_KEY.SEO_GLOBAL_DESCRIPTION,
                    APP_CONFIG_KEY.SEO_GLOBAL_KEYWORDS,
                    APP_CONFIG_KEY.SEO_GLOBAL_OG_IMAGE,
                ],
            },
        },
    });

    const configMap = configs.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, string>);

    return {
        title: configMap[APP_CONFIG_KEY.SEO_GLOBAL_TITLE] || 'EduNext Quiz',
        description:
            configMap[APP_CONFIG_KEY.SEO_GLOBAL_DESCRIPTION] ||
            'Plataforma líder en exámenes y ensayos PAES para instituciones educativas.',
        keywords: configMap[APP_CONFIG_KEY.SEO_GLOBAL_KEYWORDS]?.split(',').map((k) => k.trim()) || [
            'PAES',
            'Ensayos',
            'Educación',
            'Chile',
        ],
        ogImage: configMap[APP_CONFIG_KEY.SEO_GLOBAL_OG_IMAGE],
    };
}

/**
 * Obtiene el SEO de una institución específica por su slug.
 * Si no tiene SEO propio, retorna el global.
 */
export async function getInstitutionSeo(slug: string): Promise<SeoMetadata> {
    const institution = await prisma.academicInstitution.findUnique({
        where: { slug },
        select: {
            seoTitle: true,
            seoDescription: true,
            seoKeywords: true,
            name: true,
        },
    });

    if (!institution) return getGlobalSeo();

    const global = await getGlobalSeo();

    return {
        title: institution.seoTitle || `${institution.name} | ${global.title}`,
        description: institution.seoDescription || global.description,
        keywords: institution.seoKeywords.length > 0 ? institution.seoKeywords : global.keywords,
        ogImage: global.ogImage, // Por ahora usamos la global, se puede extender luego
    };
}
