import { describe, expect, it } from 'vitest';
import { calcGrade } from '../grade';

// Default scale: max=7, passing=4, threshold=60%
const DEFAULT = { maxGrade: 7, passingGrade: 4, passingPct: 60 } as const;

describe('calcGrade', () => {
    it('returns max grade on perfect score', () => {
        expect(calcGrade(10, 10, DEFAULT.maxGrade, DEFAULT.passingGrade, DEFAULT.passingPct)).toBe(
            7,
        );
    });

    it('returns 1 on zero score', () => {
        expect(calcGrade(0, 10, DEFAULT.maxGrade, DEFAULT.passingGrade, DEFAULT.passingPct)).toBe(
            1,
        );
    });

    it('returns exactly the passing grade at the threshold', () => {
        expect(calcGrade(6, 10, DEFAULT.maxGrade, DEFAULT.passingGrade, DEFAULT.passingPct)).toBe(
            4,
        );
    });

    it('returns 1 when maxScore is 0 (empty exam guard)', () => {
        expect(calcGrade(0, 0, DEFAULT.maxGrade, DEFAULT.passingGrade, DEFAULT.passingPct)).toBe(1);
    });

    it('interpolates below threshold correctly', () => {
        // 30% → grade = 1 + (0.3/0.6)*(4-1) = 1 + 1.5 = 2.5
        expect(calcGrade(3, 10, DEFAULT.maxGrade, DEFAULT.passingGrade, DEFAULT.passingPct)).toBe(
            2.5,
        );
    });

    it('interpolates above threshold correctly', () => {
        // 90% → 4 + (0.3/0.4)*3 = 4 + 2.25 = 6.25 → rounds to 6.3
        expect(calcGrade(9, 10, DEFAULT.maxGrade, DEFAULT.passingGrade, DEFAULT.passingPct)).toBe(
            6.3,
        );
    });

    it('never exceeds maxGrade', () => {
        expect(
            calcGrade(100, 100, DEFAULT.maxGrade, DEFAULT.passingGrade, DEFAULT.passingPct),
        ).toBe(7);
    });

    it('never returns less than 1', () => {
        expect(calcGrade(0, 100, DEFAULT.maxGrade, DEFAULT.passingGrade, DEFAULT.passingPct)).toBe(
            1,
        );
    });

    it('rounds to one decimal place', () => {
        const grade = calcGrade(7, 10, DEFAULT.maxGrade, DEFAULT.passingGrade, DEFAULT.passingPct);
        const decimalPlaces = (grade.toString().split('.')[1] ?? '').length;
        expect(decimalPlaces).toBeLessThanOrEqual(1);
    });
});
