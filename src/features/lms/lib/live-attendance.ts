import type { LiveAttendanceRole } from '@prisma/client';

export interface AttendanceJoinInput {
    sessionId: string;
    userId: string;
    role: LiveAttendanceRole;
    displayName: string;
    joinedAt: Date;
    dailyParticipantId?: string | null;
}

export interface AttendanceLeaveInput {
    leftAt: Date;
    previousJoinedAt: Date;
}

export function computeAttendanceDurationSec(input: AttendanceLeaveInput): number {
    const deltaMs = input.leftAt.getTime() - input.previousJoinedAt.getTime();
    if (deltaMs <= 0) return 0;
    return Math.floor(deltaMs / 1000);
}

export interface OpenAttendanceWindowInput {
    session: { scheduledAt: Date; durationMin: number };
    now: Date;
    openMinutesBefore?: number;
    closeMinutesAfter?: number;
}

export function isWithinAttendanceWindow(input: OpenAttendanceWindowInput): boolean {
    const startMs = input.session.scheduledAt.getTime();
    const endMs = startMs + input.session.durationMin * 60_000;
    const nowMs = input.now.getTime();
    const openMs = (input.openMinutesBefore ?? 10) * 60_000;
    const closeMs = (input.closeMinutesAfter ?? 30) * 60_000;
    return nowMs >= startMs - openMs && nowMs <= endMs + closeMs;
}

export interface AttendanceSummaryInput {
    attendances: ReadonlyArray<{ durationSec: number | null; joinedAt: Date; leftAt: Date | null }>;
    sessionDurationMin: number;
    joinThreshold?: number;
}

export interface AttendanceRow {
    userId: string;
    totalDurationSec: number;
    joinCount: number;
    lastJoinedAt: Date | null;
    lastLeftAt: Date | null;
    isPresent: boolean;
    attendancePct: number;
}

export function summarizeAttendance(
    rows: ReadonlyArray<{
        userId: string;
        durationSec: number | null;
        joinedAt: Date;
        leftAt: Date | null;
    }>,
    sessionDurationMin: number,
): AttendanceRow[] {
    const byUser = new Map<string, AttendanceRow>();

    for (const row of rows) {
        const existing = byUser.get(row.userId);
        if (!existing) {
            byUser.set(row.userId, {
                userId: row.userId,
                totalDurationSec: row.durationSec ?? 0,
                joinCount: 1,
                lastJoinedAt: row.joinedAt,
                lastLeftAt: row.leftAt,
                isPresent: row.leftAt === null,
                attendancePct: clampPct(((row.durationSec ?? 0) / 60 / sessionDurationMin) * 100),
            });
            continue;
        }

        existing.totalDurationSec += row.durationSec ?? 0;
        existing.joinCount += 1;
        if (row.joinedAt > (existing.lastJoinedAt ?? new Date(0))) {
            existing.lastJoinedAt = row.joinedAt;
        }
        if (row.leftAt && (!existing.lastLeftAt || row.leftAt > existing.lastLeftAt)) {
            existing.lastLeftAt = row.leftAt;
        }
        if (row.leftAt === null) existing.isPresent = true;
        existing.attendancePct = clampPct(
            (existing.totalDurationSec / 60 / sessionDurationMin) * 100,
        );
    }

    return Array.from(byUser.values()).sort((a, b) => b.totalDurationSec - a.totalDurationSec);
}

function clampPct(value: number): number {
    if (!Number.isFinite(value)) return 0;
    if (value < 0) return 0;
    if (value > 100) return 100;
    return Math.round(value * 10) / 10;
}
