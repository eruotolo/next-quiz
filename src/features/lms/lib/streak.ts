// Lógica pura de racha — testeable sin base de datos.
//
// Reglas (versión 1):
// - Si `lastActiveOn` es `null` (usuario nuevo), arrancar racha en 1.
// - Si la actividad fue HOY (mismo día UTC que `lastActiveOn`), no cambia
//   (`didChange = false`). La racha sigue intacta.
// - Si la actividad fue AYER (diferencia de 1 día calendario), `currentStreak += 1`.
// - Si la actividad fue ANTES DE AYER (diferencia >= 2 días):
//   - Si hay `freezeTokens > 0`, consumir uno y `currentStreak += 1`.
//   - Si no, reset a 1.
// - `longestStreak` siempre toma el máximo entre su valor previo y el nuevo
//   `currentStreak`.
//
// Las fechas se comparan en **UTC** para evitar drift por zona horaria del
// servidor. La UI puede ajustar a local al mostrar.

export interface StreakState {
    currentStreak: number;
    longestStreak: number;
    lastActiveOn: Date | null;
    freezeTokens: number;
}

export interface StreakUpdate {
    currentStreak: number;
    longestStreak: number;
    lastActiveOn: Date;
    freezeTokens: number;
    didChange: boolean;
}

export function toUtcDay(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function daysBetween(a: Date, b: Date): number {
    const dayA = toUtcDay(a).getTime();
    const dayB = toUtcDay(b).getTime();
    return Math.round((dayB - dayA) / (1000 * 60 * 60 * 24));
}

export function computeStreakUpdate(current: StreakState, activityAt: Date): StreakUpdate {
    const activityDay = toUtcDay(activityAt);

    if (current.lastActiveOn === null) {
        return {
            currentStreak: 1,
            longestStreak: Math.max(1, current.longestStreak),
            lastActiveOn: activityDay,
            freezeTokens: current.freezeTokens,
            didChange: true,
        };
    }

    const diff = daysBetween(current.lastActiveOn, activityDay);

    if (diff === 0) {
        // Mismo día: no hay cambio.
        return {
            currentStreak: current.currentStreak,
            longestStreak: current.longestStreak,
            lastActiveOn: current.lastActiveOn,
            freezeTokens: current.freezeTokens,
            didChange: false,
        };
    }

    if (diff === 1) {
        // Día consecutivo.
        const next = current.currentStreak + 1;
        return {
            currentStreak: next,
            longestStreak: Math.max(next, current.longestStreak),
            lastActiveOn: activityDay,
            freezeTokens: current.freezeTokens,
            didChange: true,
        };
    }

    // diff >= 2: hay gap. Un freeze token cubre exactamente 1 día intermedio
    // (diff === 2). Para gaps mayores no alcanza un solo token → reset.
    if (diff === 2 && current.freezeTokens > 0) {
        const next = current.currentStreak + 1;
        return {
            currentStreak: next,
            longestStreak: Math.max(next, current.longestStreak),
            lastActiveOn: activityDay,
            freezeTokens: current.freezeTokens - 1,
            didChange: true,
        };
    }

    // Reset (gap sin freeze suficiente).
    return {
        currentStreak: 1,
        longestStreak: Math.max(1, current.longestStreak),
        lastActiveOn: activityDay,
        freezeTokens: current.freezeTokens,
        didChange: true,
    };
}
