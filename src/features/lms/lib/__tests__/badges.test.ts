import { describe, expect, it } from 'vitest';
import { evaluateCriterion, isBadgeCriterion } from '../badges';
import { EMPTY_USER_STATS, type UserStats } from '../user-stats';

const stats = (overrides: Partial<UserStats> = {}): UserStats => ({
    ...EMPTY_USER_STATS,
    ...overrides,
});

describe('isBadgeCriterion', () => {
    it('acepta criterios válidos', () => {
        expect(isBadgeCriterion({ type: 'TOTAL_POINTS', threshold: 100 })).toBe(true);
        expect(isBadgeCriterion({ type: 'LONGEST_STREAK', threshold: 7 })).toBe(true);
    });
    it('rechaza criterios inválidos', () => {
        expect(isBadgeCriterion(null)).toBe(false);
        expect(isBadgeCriterion({})).toBe(false);
        expect(isBadgeCriterion({ type: 'TOTAL_POINTS' })).toBe(false);
        expect(isBadgeCriterion({ type: 'FOO', threshold: 1 })).toBe(false);
        expect(isBadgeCriterion({ type: 'TOTAL_POINTS', threshold: 'mucho' })).toBe(false);
    });
});

describe('evaluateCriterion', () => {
    it('TOTAL_POINTS', () => {
        expect(evaluateCriterion({ type: 'TOTAL_POINTS', threshold: 100 }, stats({ totalPoints: 99 }))).toBe(false);
        expect(evaluateCriterion({ type: 'TOTAL_POINTS', threshold: 100 }, stats({ totalPoints: 100 }))).toBe(true);
    });
    it('LESSONS_COMPLETED', () => {
        expect(evaluateCriterion({ type: 'LESSONS_COMPLETED', threshold: 5 }, stats({ lessonsCompleted: 4 }))).toBe(false);
        expect(evaluateCriterion({ type: 'LESSONS_COMPLETED', threshold: 5 }, stats({ lessonsCompleted: 5 }))).toBe(true);
    });
    it('ASSIGNMENTS_SUBMITTED', () => {
        expect(evaluateCriterion({ type: 'ASSIGNMENTS_SUBMITTED', threshold: 1 }, stats({ assignmentsSubmitted: 0 }))).toBe(false);
        expect(evaluateCriterion({ type: 'ASSIGNMENTS_SUBMITTED', threshold: 1 }, stats({ assignmentsSubmitted: 1 }))).toBe(true);
    });
    it('EXAMS_PASSED', () => {
        expect(evaluateCriterion({ type: 'EXAMS_PASSED', threshold: 3 }, stats({ examsPassed: 2 }))).toBe(false);
        expect(evaluateCriterion({ type: 'EXAMS_PASSED', threshold: 3 }, stats({ examsPassed: 3 }))).toBe(true);
    });
    it('FORUM_POSTS', () => {
        expect(evaluateCriterion({ type: 'FORUM_POSTS', threshold: 10 }, stats({ forumPosts: 9 }))).toBe(false);
        expect(evaluateCriterion({ type: 'FORUM_POSTS', threshold: 10 }, stats({ forumPosts: 10 }))).toBe(true);
    });
    it('LONGEST_STREAK', () => {
        expect(evaluateCriterion({ type: 'LONGEST_STREAK', threshold: 7 }, stats({ longestStreak: 6 }))).toBe(false);
        expect(evaluateCriterion({ type: 'LONGEST_STREAK', threshold: 7 }, stats({ longestStreak: 7 }))).toBe(true);
    });
});