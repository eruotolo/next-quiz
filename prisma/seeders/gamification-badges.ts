// Seeder del catálogo inicial de insignias del Aula Virtual (Fase 4).
// Idempotente: usa upsert por `code` (UNIQUE). Se ejecuta en `pnpm db:seed`
// para poblar la plataforma en cualquier deploy. Las insignias inactivas
// (`active: false`) no se evalúan contra los estudiantes.
//
// Criterios soportados (ver `badges.ts`):
// - TOTAL_POINTS           → X puntos acumulados
// - LESSONS_COMPLETED      → X lecciones completadas
// - ASSIGNMENTS_SUBMITTED  → X tareas entregadas
// - EXAMS_PASSED           → X exámenes aprobados
// - FORUM_POSTS            → X mensajes publicados
// - LONGEST_STREAK         → X días de racha máxima
import { PrismaClient } from '@prisma/client';

interface BadgeSeed {
    code: string;
    name: string;
    description: string;
    icon: string;
    pointsReward: number;
    criteria: { type: string; threshold: number };
    active: boolean;
}

export const BADGE_SEED: BadgeSeed[] = [
    {
        code: 'first_lesson',
        name: 'Primer paso',
        description: 'Completaste tu primera lección',
        icon: 'Footprints',
        pointsReward: 5,
        criteria: { type: 'LESSONS_COMPLETED', threshold: 1 },
        active: true,
    },
    {
        code: 'first_assignment',
        name: 'Primera entrega',
        description: 'Enviaste tu primera tarea',
        icon: 'Send',
        pointsReward: 10,
        criteria: { type: 'ASSIGNMENTS_SUBMITTED', threshold: 1 },
        active: true,
    },
    {
        code: 'first_perfect',
        name: 'Perfección inaugural',
        description: 'Obtuviste 7.0 en un examen por primera vez',
        icon: 'Star',
        pointsReward: 25,
        criteria: { type: 'EXAMS_PASSED', threshold: 1 },
        active: true,
    },
    {
        code: 'streak_week',
        name: 'Racha de 7 días',
        description: 'Mantuviste actividad durante 7 días consecutivos',
        icon: 'Flame',
        pointsReward: 50,
        criteria: { type: 'LONGEST_STREAK', threshold: 7 },
        active: true,
    },
    {
        code: 'streak_month',
        name: 'Racha mensual',
        description: 'Mantuviste actividad durante 30 días consecutivos',
        icon: 'Flame',
        pointsReward: 150,
        criteria: { type: 'LONGEST_STREAK', threshold: 30 },
        active: true,
    },
    {
        code: 'first_post',
        name: 'Voz del aula',
        description: 'Publicaste tu primer mensaje en un foro',
        icon: 'MessageSquare',
        pointsReward: 2,
        criteria: { type: 'FORUM_POSTS', threshold: 1 },
        active: true,
    },
    {
        code: 'ten_posts',
        name: 'Conversador',
        description: 'Publicaste 10 mensajes en los foros',
        icon: 'MessagesSquare',
        pointsReward: 25,
        criteria: { type: 'FORUM_POSTS', threshold: 10 },
        active: true,
    },
    {
        code: 'hundred_points',
        name: '100 puntos',
        description: 'Acumulaste 100 puntos en total',
        icon: 'Trophy',
        pointsReward: 25,
        criteria: { type: 'TOTAL_POINTS', threshold: 100 },
        active: true,
    },
];

export async function seedGamificationBadges(prisma: PrismaClient): Promise<number> {
    let upserted = 0;
    for (const badge of BADGE_SEED) {
        await prisma.lmsBadge.upsert({
            where: { code: badge.code },
            create: {
                code: badge.code,
                name: badge.name,
                description: badge.description,
                icon: badge.icon,
                pointsReward: badge.pointsReward,
                criteria: badge.criteria,
                active: badge.active,
            },
            update: {
                name: badge.name,
                description: badge.description,
                icon: badge.icon,
                pointsReward: badge.pointsReward,
                criteria: badge.criteria,
                active: badge.active,
            },
        });
        upserted += 1;
    }
    return upserted;
}
