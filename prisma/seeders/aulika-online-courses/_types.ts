/**
 * Tipos compartidos por el seeder de Aulika Online.
 * Cada curso exporta un `CourseSeed` que el orquestador
 * (`aulika-online.ts`) materializa en Prisma.
 */
export interface LessonSeed {
    title: string;
    type: 'TEXTO' | 'VIDEO' | 'DOCUMENTO' | 'ENLACE';
    durationSec?: number;
    externalLink?: string;
    contentJson?: unknown;
}

export interface ModuleSeed {
    title: string;
    description: string;
    lessons: LessonSeed[];
}

export interface CourseSeed {
    id: string;
    title: string;
    description: string;
    modules: ModuleSeed[];
}