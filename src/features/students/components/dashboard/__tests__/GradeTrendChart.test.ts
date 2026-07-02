import { describe, expect, it } from 'vitest';
import { computeTrend, xAt, yAt } from '../GradeTrendChart';

describe('GradeTrendChart · coordinate helpers', () => {
    it('xAt: n=1 devuelve el centro (PAD_X)', () => {
        expect(xAt(0, 1)).toBe(24);
    });

    it('xAt: n>1 reparte entre PAD_X y VIEW_W-PAD_X', () => {
        const n = 5;
        const first = xAt(0, n);
        const last = xAt(n - 1, n);
        expect(first).toBe(24);
        expect(last).toBe(480 - 24);
        expect(xAt(2, n)).toBeGreaterThan(first);
        expect(xAt(2, n)).toBeLessThan(last);
    });

    it('yAt: nota 1.0 cae abajo, nota 7.0 cae arriba', () => {
        expect(yAt(1.0)).toBeGreaterThan(yAt(7.0));
    });

    it('yAt: monotonic decreciente (mayor nota = menor y)', () => {
        expect(yAt(4.0)).toBeGreaterThan(yAt(5.0));
        expect(yAt(5.0)).toBeGreaterThan(yAt(6.0));
    });
});

describe('GradeTrendChart · computeTrend', () => {
    it('devuelve null si hay menos de 2 puntos', () => {
        expect(computeTrend([])).toBeNull();
        expect(
            computeTrend([{ id: '1', grade: 4, maxGrade: 7, examTitle: 'x', completedAt: new Date(), passed: true }]),
        ).toBeNull();
    });

    it('detecta subida', () => {
        const result = computeTrend([
            { id: '1', grade: 3.0, maxGrade: 7, examTitle: 'a', completedAt: new Date(), passed: false },
            { id: '2', grade: 5.5, maxGrade: 7, examTitle: 'b', completedAt: new Date(), passed: true },
        ]);
        expect(result?.direction).toBe('up');
        expect(result?.label).toContain('+2.5');
    });

    it('detecta bajada', () => {
        const result = computeTrend([
            { id: '1', grade: 6.0, maxGrade: 7, examTitle: 'a', completedAt: new Date(), passed: true },
            { id: '2', grade: 3.5, maxGrade: 7, examTitle: 'b', completedAt: new Date(), passed: false },
        ]);
        expect(result?.direction).toBe('down');
        expect(result?.label).toContain('-2.5');
    });

    it('detecta estable cuando delta < 0.05', () => {
        const result = computeTrend([
            { id: '1', grade: 4.0, maxGrade: 7, examTitle: 'a', completedAt: new Date(), passed: true },
            { id: '2', grade: 4.02, maxGrade: 7, examTitle: 'b', completedAt: new Date(), passed: true },
        ]);
        expect(result?.direction).toBe('flat');
        expect(result?.label).toBe('estable');
    });
});
