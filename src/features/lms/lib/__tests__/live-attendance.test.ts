import { describe, expect, it } from 'vitest';
import {
    computeAttendanceDurationSec,
    isWithinAttendanceWindow,
    summarizeAttendance,
} from '@/features/lms/lib/live-attendance';

describe('computeAttendanceDurationSec', () => {
    it('calcula duración en segundos', () => {
        const joined = new Date('2026-07-01T18:00:00Z');
        const left = new Date('2026-07-01T18:30:00Z');
        expect(computeAttendanceDurationSec({ previousJoinedAt: joined, leftAt: left })).toBe(1800);
    });

    it('retorna 0 si left es anterior a joined', () => {
        expect(
            computeAttendanceDurationSec({
                previousJoinedAt: new Date('2026-07-01T19:00:00Z'),
                leftAt: new Date('2026-07-01T18:00:00Z'),
            }),
        ).toBe(0);
    });

    it('maneja diferencias de milisegundos truncando', () => {
        const joined = new Date('2026-07-01T18:00:00.000Z');
        const left = new Date('2026-07-01T18:00:01.999Z');
        expect(computeAttendanceDurationSec({ previousJoinedAt: joined, leftAt: left })).toBe(1);
    });
});

describe('isWithinAttendanceWindow', () => {
    const scheduledAt = new Date('2026-07-01T18:00:00Z');

    it('rechaza antes de la ventana de apertura', () => {
        const r = isWithinAttendanceWindow({
            session: { scheduledAt, durationMin: 60 },
            now: new Date('2026-07-01T17:40:00Z'),
            openMinutesBefore: 10,
        });
        expect(r).toBe(false);
    });

    it('acepta dentro de la sesión', () => {
        const r = isWithinAttendanceWindow({
            session: { scheduledAt, durationMin: 60 },
            now: new Date('2026-07-01T18:30:00Z'),
        });
        expect(r).toBe(true);
    });

    it('acepta dentro del margen post-sesión', () => {
        const r = isWithinAttendanceWindow({
            session: { scheduledAt, durationMin: 60 },
            now: new Date('2026-07-01T19:15:00Z'),
            closeMinutesAfter: 30,
        });
        expect(r).toBe(true);
    });

    it('rechaza después del margen post-sesión', () => {
        const r = isWithinAttendanceWindow({
            session: { scheduledAt, durationMin: 60 },
            now: new Date('2026-07-01T20:00:00Z'),
            closeMinutesAfter: 30,
        });
        expect(r).toBe(false);
    });
});

describe('summarizeAttendance', () => {
    it('agrega múltiples join/leave por usuario', () => {
        const rows = [
            {
                userId: 'u1',
                joinedAt: new Date('2026-07-01T18:00:00Z'),
                leftAt: new Date('2026-07-01T18:20:00Z'),
                durationSec: 1200,
            },
            {
                userId: 'u1',
                joinedAt: new Date('2026-07-01T18:30:00Z'),
                leftAt: new Date('2026-07-01T18:50:00Z'),
                durationSec: 1200,
            },
        ];
        const summary = summarizeAttendance(rows, 60);
        const u1 = summary.find((r) => r.userId === 'u1');
        expect(u1?.totalDurationSec).toBe(2400);
        expect(u1?.joinCount).toBe(2);
    });

    it('marca isPresent cuando leftAt es null', () => {
        const rows = [
            {
                userId: 'u1',
                joinedAt: new Date('2026-07-01T18:00:00Z'),
                leftAt: null,
                durationSec: null,
            },
        ];
        const summary = summarizeAttendance(rows, 60);
        expect(summary[0]?.isPresent).toBe(true);
    });

    it('calcula attendancePct en base a duración total', () => {
        const rows = [
            {
                userId: 'u1',
                joinedAt: new Date('2026-07-01T18:00:00Z'),
                leftAt: new Date('2026-07-01T18:30:00Z'),
                durationSec: 1800,
            },
        ];
        const summary = summarizeAttendance(rows, 60);
        expect(summary[0]?.attendancePct).toBe(50);
    });

    it('clamp de attendancePct a [0, 100]', () => {
        const rows = [
            {
                userId: 'u1',
                joinedAt: new Date('2026-07-01T18:00:00Z'),
                leftAt: new Date('2026-07-01T19:30:00Z'),
                durationSec: 4500,
            },
        ];
        const summary = summarizeAttendance(rows, 60);
        expect(summary[0]?.attendancePct).toBe(100);
    });

    it('ordena por totalDurationSec desc', () => {
        const rows = [
            {
                userId: 'low',
                joinedAt: new Date('2026-07-01T18:00:00Z'),
                leftAt: new Date('2026-07-01T18:05:00Z'),
                durationSec: 300,
            },
            {
                userId: 'high',
                joinedAt: new Date('2026-07-01T18:00:00Z'),
                leftAt: new Date('2026-07-01T18:55:00Z'),
                durationSec: 3300,
            },
        ];
        const summary = summarizeAttendance(rows, 60);
        expect(summary[0]?.userId).toBe('high');
        expect(summary[1]?.userId).toBe('low');
    });
});
