import { describe, expect, it } from 'vitest';
import { intensityClass } from '../StreakHeatmap';

describe('StreakHeatmap · intensityClass', () => {
    it('count=0 siempre devuelve bg-paper-warm', () => {
        expect(intensityClass(0, 10)).toBe('bg-paper-warm');
        expect(intensityClass(0, 0)).toBe('bg-paper-warm');
    });

    it('count/max < 0.25 devuelve bg-primary/20', () => {
        expect(intensityClass(2, 100)).toBe('bg-primary/20');
    });

    it('count/max < 0.5 devuelve bg-primary/40', () => {
        expect(intensityClass(4, 10)).toBe('bg-primary/40');
    });

    it('count/max < 0.75 devuelve bg-primary/65', () => {
        expect(intensityClass(6, 10)).toBe('bg-primary/65');
    });

    it('count/max >= 0.75 devuelve bg-primary', () => {
        expect(intensityClass(10, 10)).toBe('bg-primary');
        expect(intensityClass(8, 10)).toBe('bg-primary');
    });

    it('con max=1 trata count=1 como full intensity', () => {
        expect(intensityClass(1, 1)).toBe('bg-primary');
    });
});
