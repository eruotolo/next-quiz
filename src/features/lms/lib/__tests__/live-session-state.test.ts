import { describe, expect, it } from 'vitest';
import {
    buildDailyRoomName,
    canTransition,
    computeJoinWindow,
    deriveStatusFromSchedule,
    isValidDailyRoomName,
    minutesToSeconds,
} from '@/features/lms/lib/live-session-state';

describe('canTransition', () => {
    it('permite SCHEDULED → LIVE y SCHEDULED → CANCELED', () => {
        expect(canTransition('SCHEDULED', 'LIVE')).toBe(true);
        expect(canTransition('SCHEDULED', 'CANCELED')).toBe(true);
    });

    it('rechaza SCHEDULED → ENDED (debe pasar por LIVE)', () => {
        expect(canTransition('SCHEDULED', 'ENDED')).toBe(false);
    });

    it('permite LIVE → ENDED y LIVE → CANCELED', () => {
        expect(canTransition('LIVE', 'ENDED')).toBe(true);
        expect(canTransition('LIVE', 'CANCELED')).toBe(true);
    });

    it('rechaza transiciones desde ENDED o CANCELED', () => {
        expect(canTransition('ENDED', 'LIVE')).toBe(false);
        expect(canTransition('ENDED', 'SCHEDULED')).toBe(false);
        expect(canTransition('CANCELED', 'LIVE')).toBe(false);
        expect(canTransition('CANCELED', 'ENDED')).toBe(false);
    });
});

describe('computeJoinWindow', () => {
    it('marca no-unirse antes de la ventana', () => {
        const scheduledAt = new Date('2026-07-01T18:00:00Z');
        const now = new Date('2026-07-01T17:00:00Z');
        const w = computeJoinWindow({ scheduledAt, durationMin: 60, now });
        expect(w.isJoinable).toBe(false);
        expect(w.isLive).toBe(false);
        expect(w.isPast).toBe(false);
        expect(w.secondsUntilStart).toBeGreaterThan(0);
    });

    it('permite unirse 5 minutos antes del inicio', () => {
        const scheduledAt = new Date('2026-07-01T18:00:00Z');
        const now = new Date('2026-07-01T17:55:00Z');
        const w = computeJoinWindow({ scheduledAt, durationMin: 60, now, openMinutesBefore: 10 });
        expect(w.isJoinable).toBe(true);
        expect(w.isLive).toBe(false);
    });

    it('marca Live durante la ventana de la sesión', () => {
        const scheduledAt = new Date('2026-07-01T18:00:00Z');
        const now = new Date('2026-07-01T18:30:00Z');
        const w = computeJoinWindow({ scheduledAt, durationMin: 60, now });
        expect(w.isLive).toBe(true);
        expect(w.isJoinable).toBe(true);
        expect(w.remainingSec).not.toBeNull();
        expect(w.remainingSec).toBeGreaterThan(0);
    });

    it('marca pasada después del final', () => {
        const scheduledAt = new Date('2026-07-01T18:00:00Z');
        const now = new Date('2026-07-01T19:30:00Z');
        const w = computeJoinWindow({ scheduledAt, durationMin: 60, now });
        expect(w.isLive).toBe(false);
        expect(w.isPast).toBe(true);
        expect(w.isJoinable).toBe(false);
        expect(w.remainingSec).toBeNull();
    });
});

describe('deriveStatusFromSchedule', () => {
    const scheduled = new Date('2026-07-01T18:00:00Z');
    const during = new Date('2026-07-01T18:30:00Z');
    const past = new Date('2026-07-01T20:00:00Z');

    it('informa SCHEDULED antes del inicio', () => {
        const r = deriveStatusFromSchedule({
            scheduledAt: scheduled,
            durationMin: 60,
            now: new Date('2026-07-01T17:00:00Z'),
        });
        expect(r.ok).toBe(true);
        expect(r.ok && r.status).toBe('SCHEDULED');
    });

    it('informa LIVE durante la sesión', () => {
        const r = deriveStatusFromSchedule({
            scheduledAt: scheduled,
            durationMin: 60,
            now: during,
        });
        expect(r.ok && r.status).toBe('LIVE');
    });

    it('informa ENDED después del cierre', () => {
        const r = deriveStatusFromSchedule({
            scheduledAt: scheduled,
            durationMin: 60,
            now: past,
        });
        expect(r.ok && r.status).toBe('ENDED');
    });

    it('respeta override manual CANCELED/ENDED', () => {
        const r = deriveStatusFromSchedule({
            scheduledAt: scheduled,
            durationMin: 60,
            now: during,
            manualStatus: 'CANCELED',
        });
        expect(r.ok && r.status).toBe('CANCELED');
    });
});

describe('buildDailyRoomName', () => {
    it('genera nombre válido dentro del regex', () => {
        const name = buildDailyRoomName({
            courseId: '550e8400-e29b-41d4-a716-446655440000',
            scheduledAt: new Date('2026-07-01T18:00:00Z'),
            randomSuffix: () => 'abc123',
        });
        expect(name).toMatch(/^aulika-20260701-[0-9a-z]{1,8}-abc123$/);
        expect(isValidDailyRoomName(name)).toBe(true);
    });

    it('rechaza nombres vacíos o con chars inválidos', () => {
        expect(isValidDailyRoomName('')).toBe(false);
        expect(isValidDailyRoomName('CON MAYÚSCULAS')).toBe(false);
        expect(isValidDailyRoomName('name with spaces')).toBe(false);
    });

    it('no excede 60 caracteres', () => {
        const name = buildDailyRoomName({
            courseId: '550e8400-e29b-41d4-a716-446655440000',
            scheduledAt: new Date('2026-07-01T18:00:00Z'),
            randomSuffix: () => 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
        });
        expect(name.length).toBeLessThanOrEqual(60);
    });
});

describe('minutesToSeconds', () => {
    it('convierte minutos a segundos', () => {
        expect(minutesToSeconds(60)).toBe(3600);
        expect(minutesToSeconds(90)).toBe(5400);
    });

    it('piso a 60 segundos mínimo', () => {
        expect(minutesToSeconds(0)).toBe(60);
        expect(minutesToSeconds(0.5)).toBe(60);
    });
});
