// Evaluación de criterios de insignia — funciones puras testeables.
//
// El catálogo de insignias persiste su criterio en `LmsBadge.criteria` como
// JSON con la forma `{type, threshold}`. Esta lib convierte ese JSON en una
// decisión booleana contra las estadísticas del usuario.
//
// Mantener las reglas centralizadas permite agregar nuevos tipos de criterio
// sin migrar la base de datos (basta con añadir el caso al switch).

import type { UserStats } from './user-stats';

export type BadgeCriterionType =
    | 'TOTAL_POINTS'
    | 'LESSONS_COMPLETED'
    | 'ASSIGNMENTS_SUBMITTED'
    | 'EXAMS_PASSED'
    | 'FORUM_POSTS'
    | 'LONGEST_STREAK';

export interface BadgeCriterion {
    type: BadgeCriterionType;
    threshold: number;
}

export function isBadgeCriterion(value: unknown): value is BadgeCriterion {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    if (typeof v.type !== 'string') return false;
    if (typeof v.threshold !== 'number' || !Number.isFinite(v.threshold)) return false;
    const validTypes: BadgeCriterionType[] = [
        'TOTAL_POINTS',
        'LESSONS_COMPLETED',
        'ASSIGNMENTS_SUBMITTED',
        'EXAMS_PASSED',
        'FORUM_POSTS',
        'LONGEST_STREAK',
    ];
    return validTypes.includes(v.type as BadgeCriterionType);
}

export function evaluateCriterion(criterion: BadgeCriterion, stats: UserStats): boolean {
    switch (criterion.type) {
        case 'TOTAL_POINTS':
            return stats.totalPoints >= criterion.threshold;
        case 'LESSONS_COMPLETED':
            return stats.lessonsCompleted >= criterion.threshold;
        case 'ASSIGNMENTS_SUBMITTED':
            return stats.assignmentsSubmitted >= criterion.threshold;
        case 'EXAMS_PASSED':
            return stats.examsPassed >= criterion.threshold;
        case 'FORUM_POSTS':
            return stats.forumPosts >= criterion.threshold;
        case 'LONGEST_STREAK':
            return stats.longestStreak >= criterion.threshold;
    }
}