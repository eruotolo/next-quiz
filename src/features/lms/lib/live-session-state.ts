import type { LiveSessionStatus } from '@prisma/client';

export const LIVE_SESSION_TRANSITIONS: Record<LiveSessionStatus, readonly LiveSessionStatus[]> = {
    SCHEDULED: ['LIVE', 'CANCELED'],
    LIVE: ['ENDED', 'CANCELED'],
    ENDED: [],
    CANCELED: [],
} as const;

export function canTransition(
    from: LiveSessionStatus,
    to: LiveSessionStatus,
): boolean {
    return LIVE_SESSION_TRANSITIONS[from].includes(to);
}

export type DeriveStatusResult =
    | { ok: true; status: LiveSessionStatus }
    | { ok: false; reason: string };

export interface DeriveStatusInput {
    scheduledAt: Date;
    durationMin: number;
    now: Date;
    manualStatus?: LiveSessionStatus;
}

export function deriveStatusFromSchedule(input: DeriveStatusInput): DeriveStatusResult {
    if (input.manualStatus === 'CANCELED' || input.manualStatus === 'ENDED') {
        return { ok: true, status: input.manualStatus };
    }
    if (input.manualStatus === 'LIVE') {
        return { ok: true, status: 'LIVE' };
    }

    const start = input.scheduledAt.getTime();
    const end = start + input.durationMin * 60_000;
    const now = input.now.getTime();

    if (manualStatusIsTerminal(input.manualStatus) && now < end) {
        return { ok: false, reason: 'manual_terminal_before_scheduled_end' };
    }

    if (now < start) return { ok: true, status: 'SCHEDULED' };
    if (now >= start && now < end) return { ok: true, status: 'LIVE' };
    return { ok: true, status: 'ENDED' };
}

function manualStatusIsTerminal(status: LiveSessionStatus | undefined): boolean {
    return status === 'CANCELED' || status === 'ENDED';
}

export interface TimeWindowInput {
    scheduledAt: Date;
    durationMin: number;
    now: Date;
    openMinutesBefore?: number;
}

export interface TimeWindowResult {
    isJoinable: boolean;
    isLive: boolean;
    isPast: boolean;
    secondsUntilStart: number;
    secondsUntilEnd: number;
    remainingSec: number | null;
}

export function computeJoinWindow(input: TimeWindowInput): TimeWindowResult {
    const startMs = input.scheduledAt.getTime();
    const endMs = startMs + input.durationMin * 60_000;
    const nowMs = input.now.getTime();
    const openMinutesBefore = input.openMinutesBefore ?? 10;
    const openMs = openMinutesBefore * 60_000;

    const secondsUntilStart = Math.floor((startMs - nowMs) / 1000);
    const secondsUntilEnd = Math.floor((endMs - nowMs) / 1000);

    const isLive = nowMs >= startMs && nowMs < endMs;
    const isPast = nowMs >= endMs;
    const isJoinable =
        (nowMs >= startMs - openMs && nowMs < endMs) || (isLive && nowMs < endMs);

    const remainingSec = isLive ? Math.max(0, secondsUntilEnd) : null;

    return {
        isJoinable,
        isLive,
        isPast,
        secondsUntilStart,
        secondsUntilEnd,
        remainingSec,
    };
}

export interface DailyRoomNameInput {
    courseId: string;
    scheduledAt: Date;
    randomSuffix: () => string;
}

const ROOM_NAME_RE = /^[a-z0-9-]{3,64}$/;

export function buildDailyRoomName(input: DailyRoomNameInput): string {
    const datePart = input.scheduledAt.toISOString().slice(0, 10).replaceAll('-', '');
    const suffix = input.randomSuffix().toLowerCase().replace(/[^a-z0-9]/g, '');
    const idPart = input.courseId.replaceAll('-', '').slice(0, 8);
    const raw = `aulika-${datePart}-${idPart}-${suffix}`;
    return raw.slice(0, 60);
}

export function isValidDailyRoomName(name: string): boolean {
    return ROOM_NAME_RE.test(name);
}

export function minutesToSeconds(minutes: number): number {
    return Math.max(60, Math.floor(minutes * 60));
}
