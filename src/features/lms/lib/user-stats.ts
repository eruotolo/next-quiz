// Estadísticas del estudiante para evaluación de insignias.
// Una sola fuente de verdad para evitar drift entre el motor de puntos y la UI.

export interface UserStats {
    totalPoints: number;
    lessonsCompleted: number;
    assignmentsSubmitted: number;
    examsPassed: number;
    forumPosts: number;
    longestStreak: number;
}

export const EMPTY_USER_STATS: UserStats = {
    totalPoints: 0,
    lessonsCompleted: 0,
    assignmentsSubmitted: 0,
    examsPassed: 0,
    forumPosts: 0,
    longestStreak: 0,
};
