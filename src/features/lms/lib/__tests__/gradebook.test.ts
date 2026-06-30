import { describe, expect, it } from 'vitest';
import {
    calculateCourseFinalGrade,
    calculateFinalGrade,
    clipChilenGrade,
    isPassing,
    syncExamGrade,
    validateGradebookWeights,
} from '../gradebook';

// Datos base para tests de cálculo de promedio ponderado.
const ALL_EXCELLENT = [
    { score: 7.0, weight: 0.4 },
    { score: 6.5, weight: 0.6 },
];
const MIXED = [
    { score: 5.5, weight: 0.5 },
    { score: 3.0, weight: 0.5 },
];
const WITH_NULL = [
    { score: 6.0, weight: 0.3 },
    { score: null, weight: 0.7 },
];

describe('clipChilenGrade', () => {
    it('devuelve CHILEAN_MIN (1.0) cuando score es NaN', () => {
        expect(clipChilenGrade(Number.NaN)).toBe(1.0);
    });

    it('clipea valores por debajo del mínimo', () => {
        expect(clipChilenGrade(0.5)).toBe(1.0);
        expect(clipChilenGrade(-2.0)).toBe(1.0);
    });

    it('clipea valores por encima del máximo', () => {
        expect(clipChilenGrade(8.5)).toBe(7.0);
        expect(clipChilenGrade(7.01)).toBe(7.0);
    });

    it('preserva valores dentro del rango', () => {
        expect(clipChilenGrade(4.0)).toBe(4.0);
        expect(clipChilenGrade(5.5)).toBe(5.5);
    });
});

describe('isPassing', () => {
    it('aprueba con 4.0 exacto', () => {
        expect(isPassing(4.0)).toBe(true);
    });

    it('aprueba con notas superiores a 4.0', () => {
        expect(isPassing(5.5)).toBe(true);
        expect(isPassing(7.0)).toBe(true);
    });

    it('reprueba con notas bajo 4.0', () => {
        expect(isPassing(3.99)).toBe(false);
        expect(isPassing(2.0)).toBe(false);
    });

    it('retorna null cuando no hay promedio', () => {
        expect(isPassing(null)).toBeNull();
    });
});

describe('calculateFinalGrade', () => {
    it('retorna null cuando no hay items', () => {
        expect(calculateFinalGrade([])).toBeNull();
    });

    it('retorna null cuando todas las notas son null', () => {
        expect(
            calculateFinalGrade([
                { score: null, weight: 0.5 },
                { score: null, weight: 0.5 },
            ]),
        ).toBeNull();
    });

    it('retorna null cuando todos los pesos son <= 0', () => {
        expect(
            calculateFinalGrade([
                { score: 6.0, weight: 0 },
                { score: 4.0, weight: -1 },
            ]),
        ).toBeNull();
    });

    it('retorna la nota misma cuando hay un solo item con peso 1', () => {
        expect(calculateFinalGrade([{ score: 5.5, weight: 1 }])).toBe(5.5);
    });

    it('calcula promedio aritmético con pesos iguales', () => {
        // (5.5 + 3.0) / 2 = 4.25
        expect(calculateFinalGrade(MIXED)).toBe(4.25);
    });

    it('calcula promedio ponderado con pesos distintos', () => {
        // 7.0*0.4 + 6.5*0.6 = 2.8 + 3.9 = 6.7
        expect(calculateFinalGrade(ALL_EXCELLENT)).toBe(6.7);
    });

    it('ignora entradas sin nota', () => {
        // solo 6.0*0.3 = 1.8 / 0.3 = 6.0
        expect(calculateFinalGrade(WITH_NULL)).toBe(6.0);
    });

    it('clipea notas fuera de rango antes de promediar', () => {
        // 7.0 (clipeada de 8.0) + 1.0 (clipeada de 0) / 2 = 4.0
        expect(
            calculateFinalGrade([
                { score: 8.0, weight: 0.5 },
                { score: 0, weight: 0.5 },
            ]),
        ).toBe(4.0);
    });

    it('redondea a 2 decimales (formato X,XX)', () => {
        // Caso con división no exacta: 5.5*0.3 + 4.0*0.7 = 1.65 + 2.8 = 4.45
        expect(
            calculateFinalGrade([
                { score: 5.5, weight: 0.3 },
                { score: 4.0, weight: 0.7 },
            ]),
        ).toBe(4.45);
    });

    it('maneja items con peso 1.0 (>1) sin distorsionar el cálculo', () => {
        // Si un peso está fuera de rango por error, debe seguir dando un número
        // dentro del rango — pero los pesos no se validan aquí; eso es responsabilidad
        // de `validateGradebookWeights`.
        const avg = calculateFinalGrade([
            { score: 5.0, weight: 1.5 },
            { score: 6.0, weight: 0.5 },
        ]);
        expect(avg).not.toBeNull();
        expect(avg).toBeGreaterThanOrEqual(1);
        expect(avg).toBeLessThanOrEqual(7);
    });
});

describe('calculateCourseFinalGrade', () => {
    it('incluye metadata de UI: total, completados y estado de aprobación', () => {
        const result = calculateCourseFinalGrade('u1', [
            { id: 'i1', title: 'Tarea 1', score: 6.0, weight: 0.5 },
            { id: 'i2', title: 'Examen', score: null, weight: 0.5 },
            { id: 'i3', title: 'Participación', score: 5.5, weight: 0.0 },
        ]);
        expect(result.studentId).toBe('u1');
        expect(result.totalItems).toBe(3);
        expect(result.completedItems).toBe(2);
        // promedio: i1 aporta (6.0*0.5) → 3.0 / 0.5 = 6.0; i3 peso 0 no entra; i2 null no entra.
        expect(result.average).toBe(6.0);
        expect(result.passed).toBe(true);
    });

    it('marca passed=null si no hay promedio aplicable', () => {
        const result = calculateCourseFinalGrade('u1', [
            { id: 'i1', title: 'A', score: null, weight: 0.5 },
            { id: 'i2', title: 'B', score: null, weight: 0.5 },
        ]);
        expect(result.average).toBeNull();
        expect(result.passed).toBeNull();
        expect(result.completedItems).toBe(0);
        expect(result.totalItems).toBe(2);
    });

    it('marca passed=false con promedio bajo 4.0', () => {
        const result = calculateCourseFinalGrade('u1', [
            { id: 'i1', title: 'A', score: 3.0, weight: 0.5 },
            { id: 'i2', title: 'B', score: 3.5, weight: 0.5 },
        ]);
        expect(result.passed).toBe(false);
    });
});

describe('syncExamGrade', () => {
    it('retorna null si el resultado es null o undefined', () => {
        expect(syncExamGrade(null)).toBeNull();
        expect(syncExamGrade(undefined)).toBeNull();
    });

    it('retorna null si el resultado es NaN o no finito', () => {
        expect(syncExamGrade(Number.NaN)).toBeNull();
        expect(syncExamGrade(Number.POSITIVE_INFINITY)).toBeNull();
    });

    it('clipea el score del examen al rango chileno', () => {
        expect(syncExamGrade(0)).toBe(1.0);
        expect(syncExamGrade(8)).toBe(7.0);
        expect(syncExamGrade(4.5)).toBe(4.5);
    });
});

describe('validateGradebookWeights', () => {
    it('acepta una suma de pesos exactamente 1.0', () => {
        expect(validateGradebookWeights([{ weight: 0.4 }, { weight: 0.6 }])).toBe(true);
    });

    it('acepta pesos con tolerancia de punto flotante', () => {
        expect(
            validateGradebookWeights([
                { weight: 0.1 },
                { weight: 0.2 },
                { weight: 0.3 },
                { weight: 0.4 },
            ]),
        ).toBe(true);
    });

    it('rechaza suma de pesos mayor a 1.0', () => {
        expect(validateGradebookWeights([{ weight: 0.6 }, { weight: 0.6 }])).toBe(false);
    });

    it('ignora items con peso 0 o negativo en la suma', () => {
        expect(
            validateGradebookWeights([
                { weight: 0.4 },
                { weight: 0 },
                { weight: -0.5 },
                { weight: 0.6 },
            ]),
        ).toBe(true);
    });
});
