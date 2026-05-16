import { describe, expect, it } from 'vitest';
import { buildQuestionSeed, seededShuffle } from '../shuffle';

describe('seededShuffle', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

    it('returns same order for same seed (determinism)', () => {
        const seed = 'attempt-abc:exam-xyz:q';
        const first = seededShuffle(items, seed);
        const second = seededShuffle(items, seed);
        expect(first).toEqual(second);
    });

    it('returns different order for different attemptKeys', () => {
        const seedA = buildQuestionSeed('attempt-aaa', 'exam-xyz');
        const seedB = buildQuestionSeed('attempt-bbb', 'exam-xyz');
        const orderA = seededShuffle(items, seedA);
        const orderB = seededShuffle(items, seedB);
        expect(orderA).not.toEqual(orderB);
    });

    it('preserves all elements (no loss or duplication)', () => {
        const seed = buildQuestionSeed('attempt-123', 'exam-456');
        const result = seededShuffle(items, seed);
        expect(result).toHaveLength(items.length);
        expect(result.sort()).toEqual([...items].sort());
    });

    it('does not mutate the original array', () => {
        const original = ['x', 'y', 'z'];
        const seed = 'test-seed';
        seededShuffle(original, seed);
        expect(original).toEqual(['x', 'y', 'z']);
    });

    it('returns single-element array unchanged', () => {
        expect(seededShuffle(['only'], 'any-seed')).toEqual(['only']);
    });
});

describe('buildQuestionSeed', () => {
    it('produces expected format', () => {
        expect(buildQuestionSeed('attempt-key', 'exam-id')).toBe('attempt-key:exam-id:q');
    });

    it('different examIds produce different seeds', () => {
        const s1 = buildQuestionSeed('same-key', 'exam-1');
        const s2 = buildQuestionSeed('same-key', 'exam-2');
        expect(s1).not.toBe(s2);
    });
});
