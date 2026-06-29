// Constantes compartidas del sistema de gamificación (Fase 4).
// `BADGE_DEFINITIONS` re-exporta el seed pero con la forma exacta que
// consume el componente `LmsAchievementsClient` (Sonnet).

import type { BadgeCriterion } from './badges';

export interface BadgeDefinition {
    code: string;
    name: string;
    description: string;
    icon: string;
    pointsReward: number;
    criteria: BadgeCriterion;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
    {
        code: 'first_lesson',
        name: 'Primer paso',
        description: 'Completaste tu primera lección',
        icon: 'Footprints',
        pointsReward: 5,
        criteria: { type: 'LESSONS_COMPLETED', threshold: 1 },
    },
    {
        code: 'first_assignment',
        name: 'Primera entrega',
        description: 'Enviaste tu primera tarea',
        icon: 'Send',
        pointsReward: 10,
        criteria: { type: 'ASSIGNMENTS_SUBMITTED', threshold: 1 },
    },
    {
        code: 'first_perfect',
        name: 'Perfección inaugural',
        description: 'Obtuviste 7.0 en un examen por primera vez',
        icon: 'Star',
        pointsReward: 25,
        criteria: { type: 'EXAMS_PASSED', threshold: 1 },
    },
    {
        code: 'streak_week',
        name: 'Racha de 7 días',
        description: 'Mantuviste actividad durante 7 días consecutivos',
        icon: 'Flame',
        pointsReward: 50,
        criteria: { type: 'LONGEST_STREAK', threshold: 7 },
    },
    {
        code: 'streak_month',
        name: 'Racha mensual',
        description: 'Mantuviste actividad durante 30 días consecutivos',
        icon: 'Flame',
        pointsReward: 150,
        criteria: { type: 'LONGEST_STREAK', threshold: 30 },
    },
    {
        code: 'first_post',
        name: 'Voz del aula',
        description: 'Publicaste tu primer mensaje en un foro',
        icon: 'MessageSquare',
        pointsReward: 2,
        criteria: { type: 'FORUM_POSTS', threshold: 1 },
    },
    {
        code: 'ten_posts',
        name: 'Conversador',
        description: 'Publicaste 10 mensajes en los foros',
        icon: 'MessagesSquare',
        pointsReward: 25,
        criteria: { type: 'FORUM_POSTS', threshold: 10 },
    },
    {
        code: 'hundred_points',
        name: '100 puntos',
        description: 'Acumulaste 100 puntos en total',
        icon: 'Trophy',
        pointsReward: 25,
        criteria: { type: 'TOTAL_POINTS', threshold: 100 },
    },
];