import { describe, expect, it } from 'vitest';
import { computeStreakUpdate, daysBetween, toUtcDay, type StreakState } from '../streak';

const UTC_MIDDAY = (y: number, m: number, d: number) =>
    new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));

const baseState = (overrides: Partial<StreakState> = {}): StreakState => ({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveOn: null,
    freezeTokens: 0,
    ...overrides,
});

describe('toUtcDay', () => {
    it('trunca la hora a 00:00:00 UTC', () => {
        const d = new Date(Date.UTC(2026, 5, 15, 18, 32, 11));
        const day = toUtcDay(d);
        expect(day.getUTCHours()).toBe(0);
        expect(day.getUTCMinutes()).toBe(0);
        expect(day.getUTCSeconds()).toBe(0);
        expect(day.getUTCDate()).toBe(15);
    });
});

describe('daysBetween', () => {
    it('devuelve 0 para el mismo día con horas distintas', () => {
        const a = UTC_MIDDAY(2026, 6, 29);
        const b = new Date(Date.UTC(2026, 5, 29, 23, 59, 59));
        expect(daysBetween(a, b)).toBe(0);
    });
    it('devuelve 1 para el día siguiente', () => {
        expect(daysBetween(UTC_MIDDAY(2026, 6, 29), UTC_MIDDAY(2026, 6, 30))).toBe(1);
    });
    it('devuelve 7 para una semana exacta', () => {
        expect(daysBetween(UTC_MIDDAY(2026, 6, 1), UTC_MIDDAY(2026, 6, 8))).toBe(7);
    });
});

describe('computeStreakUpdate', () => {
    it('arranca racha en 1 cuando lastActiveOn es null', () => {
        const next = computeStreakUpdate(baseState(), UTC_MIDDAY(2026, 6, 29));
        expect(next.currentStreak).toBe(1);
        expect(next.longestStreak).toBe(1);
        expect(next.didChange).toBe(true);
    });

    it('no cambia cuando la actividad es el mismo día', () => {
        const state = baseState({
            currentStreak: 5,
            longestStreak: 8,
            lastActiveOn: UTC_MIDDAY(2026, 6, 29),
        });
        const next = computeStreakUpdate(state, UTC_MIDDAY(2026, 6, 29));
        expect(next.currentStreak).toBe(5);
        expect(next.longestStreak).toBe(8);
        expect(next.didChange).toBe(false);
    });

    it('incrementa cuando la actividad es al día siguiente', () => {
        const state = baseState({
            currentStreak: 4,
            longestStreak: 5,
            lastActiveOn: UTC_MIDDAY(2026, 6, 29),
        });
        const next = computeStreakUpdate(state, UTC_MIDDAY(2026, 6, 30));
        expect(next.currentStreak).toBe(5);
        expect(next.longestStreak).toBe(5);
        expect(next.didChange).toBe(true);
    });

    it('actualiza longestStreak si supera el máximo previo', () => {
        const state = baseState({
            currentStreak: 9,
            longestStreak: 9,
            lastActiveOn: UTC_MIDDAY(2026, 6, 29),
        });
        const next = computeStreakUpdate(state, UTC_MIDDAY(2026, 6, 30));
        expect(next.currentStreak).toBe(10);
        expect(next.longestStreak).toBe(10);
    });

    it('resetea a 1 cuando hay gap de 2+ días sin freeze tokens', () => {
        const state = baseState({
            currentStreak: 12,
            longestStreak: 12,
            lastActiveOn: UTC_MIDDAY(2026, 6, 25),
        });
        const next = computeStreakUpdate(state, UTC_MIDDAY(2026, 6, 29));
        expect(next.currentStreak).toBe(1);
        expect(next.longestStreak).toBe(12);
        expect(next.freezeTokens).toBe(0);
        expect(next.didChange).toBe(true);
    });

    it('consume freeze token cuando el gap es de exactamente 1 día intermedio', () => {
        // lastActiveOn=25, activity=27 → diff=2 (un día intermedio, el 26).
        const state = baseState({
            currentStreak: 5,
            longestStreak: 5,
            lastActiveOn: UTC_MIDDAY(2026, 6, 25),
            freezeTokens: 1,
        });
        const next = computeStreakUpdate(state, UTC_MIDDAY(2026, 6, 27));
        expect(next.currentStreak).toBe(6);
        expect(next.longestStreak).toBe(6);
        expect(next.freezeTokens).toBe(0);
        expect(next.didChange).toBe(true);
    });

    it('resetea cuando el gap es > 1 día aunque haya freeze tokens', () => {
        // lastActiveOn=25, activity=29 → diff=4. Un freeze no alcanza.
        const state = baseState({
            currentStreak: 3,
            longestStreak: 3,
            lastActiveOn: UTC_MIDDAY(2026, 6, 25),
            freezeTokens: 5,
        });
        const next = computeStreakUpdate(state, UTC_MIDDAY(2026, 6, 29));
        expect(next.currentStreak).toBe(1);
        expect(next.longestStreak).toBe(3);
        expect(next.freezeTokens).toBe(5);
    });

    it('resetea cuando hay gap de 2 días pero no hay freeze tokens', () => {
        const state = baseState({
            currentStreak: 3,
            longestStreak: 3,
            lastActiveOn: UTC_MIDDAY(2026, 6, 25),
            freezeTokens: 0,
        });
        const next = computeStreakUpdate(state, UTC_MIDDAY(2026, 6, 27));
        expect(next.currentStreak).toBe(1);
        expect(next.freezeTokens).toBe(0);
    });

    it('preserva freeze tokens cuando hay actividad el mismo día', () => {
        const state = baseState({
            currentStreak: 7,
            longestStreak: 7,
            lastActiveOn: UTC_MIDDAY(2026, 6, 29),
            freezeTokens: 3,
        });
        const next = computeStreakUpdate(state, UTC_MIDDAY(2026, 6, 29));
        expect(next.freezeTokens).toBe(3);
        expect(next.didChange).toBe(false);
    });
});
