// Cálculo del Libro de Calificaciones (Gradebook) — escala chilena 1.0–7.0.
//
// Reglas de cálculo (escala chilena 1.0–7.0, aprobación >= 4.0):
// - Cada GradebookItem tiene un peso (`weight`). La suma de pesos válidos define
//   el divisor (los items sin nota o con peso <= 0 no entran).
// - Cada nota se clippea a [1.0, 7.0] antes de promediar (defensa contra
//   inputs fuera de escala).
// - El promedio se redondea a 2 decimales (formato típico chileno X,XX).
// - Si no hay items válidos (sin notas o todos los pesos son 0), el resultado
//   es `null` (no aplicable / pendiente), no `1.0` ni `0.0`.
// - El redondeo aplica solo al promedio final; las notas individuales
//   permanecen con su valor original.

const CHILEAN_MIN = 1.0;
const CHILEAN_MAX = 7.0;
const CHILEAN_PASSING = 4.0;

export interface GradebookEntry {
    /** Nota en escala 1.0–7.0. `null` indica aún no calificada. */
    score: number | null;
    /** Peso del item como porcentaje (0–1). Por defecto 1 = 100%. */
    weight: number;
}

export interface GradebookItemWithGrade extends GradebookEntry {
    id: string;
    title: string;
}

export interface CourseFinalGrade {
    studentId: string;
    average: number | null;
    completedItems: number;
    totalItems: number;
    /** `true` cuando el promedio es >= 4.0. `null` cuando no hay promedio. */
    passed: boolean | null;
}

export function clipChilenGrade(score: number): number {
    if (Number.isNaN(score)) return CHILEAN_MIN;
    return Math.min(CHILEAN_MAX, Math.max(CHILEAN_MIN, score));
}

export function isPassing(average: number | null): boolean | null {
    if (average === null) return null;
    return average >= CHILEAN_PASSING;
}

/**
 * Calcula el promedio final ponderado de un estudiante en un curso.
 * - Filtra entradas sin nota (`score === null`).
 * - Filtra entradas con peso <= 0 (no cuentan en el divisor).
 * - Clippea cada nota al rango [1.0, 7.0].
 * - Retorna `null` si ninguna entrada aporta.
 */
export function calculateFinalGrade(entries: GradebookEntry[]): number | null {
    let weightedSum = 0;
    let totalWeight = 0;
    for (const entry of entries) {
        if (entry.score === null || entry.score === undefined) continue;
        const weight = Number(entry.weight);
        if (!Number.isFinite(weight) || weight <= 0) continue;
        weightedSum += clipChilenGrade(entry.score) * weight;
        totalWeight += weight;
    }
    if (totalWeight === 0) return null;
    const average = weightedSum / totalWeight;
    // Redondeo a 2 decimales (regla de tres simple).
    return Math.round(average * 100) / 100;
}

/**
 * Calcula el promedio final de un estudiante agregando metadata útil para UI
 * (cantidad de items calificados, total, estado de aprobación).
 */
export function calculateCourseFinalGrade(
    studentId: string,
    items: GradebookItemWithGrade[],
): CourseFinalGrade {
    let completedItems = 0;
    const totalItems = items.length;
    for (const item of items) {
        if (item.score !== null && item.score !== undefined) completedItems += 1;
    }
    const entries: GradebookEntry[] = items.map((it) => ({
        score: it.score,
        weight: it.weight,
    }));
    const average = calculateFinalGrade(entries);
    return {
        studentId,
        average,
        completedItems,
        totalItems,
        passed: isPassing(average),
    };
}

/**
 * Sincroniza una nota desde Result de un examen al GradebookItem vinculado.
 * La nota se clippea al rango [1.0, 7.0] para mantener consistencia.
 * Retorna el score normalizado o `null` si result.score es null/NaN.
 */
export function syncExamGrade(resultScore: number | null | undefined): number | null {
    if (resultScore === null || resultScore === undefined) return null;
    if (!Number.isFinite(resultScore)) return null;
    return clipChilenGrade(resultScore);
}

/**
 * Helper: cuenta los pesos únicos de un set de items para validar que la
 * suma de pesos no exceda 1.0 (100%). Retorna `true` si la suma está OK.
 * Items con peso 0 son "no evaluados" y se permiten sin tope.
 */
export function validateGradebookWeights(items: Array<{ weight: number }>): boolean {
    const evaluatedWeight = items
        .filter((i) => Number(i.weight) > 0)
        .reduce((sum, i) => sum + Number(i.weight), 0);
    // Tolerancia de 0.001 para errores de punto flotante.
    return evaluatedWeight - 1.0 < 0.001;
}
