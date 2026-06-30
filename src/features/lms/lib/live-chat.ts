import { sanitizeChatText } from '@/shared/lib/sanitize';

export const LIVE_CHAT_MAX_LENGTH = 500;
export const LIVE_CHAT_MIN_INTERVAL_MS = 800;
export const LIVE_CHAT_MAX_MESSAGES_PER_MINUTE = 20;

export interface ChatRateLimitState {
    lastSentAt: number | null;
    windowStart: number;
    windowCount: number;
}

export type ChatRateLimitResult =
    | { allowed: true; nextState: ChatRateLimitState }
    | { allowed: false; reason: 'too_fast' | 'burst'; nextState: ChatRateLimitState };

export function evaluateChatRateLimit(
    state: ChatRateLimitState,
    nowMs: number,
): ChatRateLimitResult {
    const sinceLastSent = state.lastSentAt === null ? Number.POSITIVE_INFINITY : nowMs - state.lastSentAt;
    if (sinceLastSent < LIVE_CHAT_MIN_INTERVAL_MS) {
        return {
            allowed: false,
            reason: 'too_fast',
            nextState: state,
        };
    }

    const window = 60_000;
    if (state.lastSentAt !== null && nowMs - state.windowStart < window) {
        if (state.windowCount >= LIVE_CHAT_MAX_MESSAGES_PER_MINUTE) {
            return { allowed: false, reason: 'burst', nextState: state };
        }
        return {
            allowed: true,
            nextState: {
                lastSentAt: nowMs,
                windowStart: state.windowStart,
                windowCount: state.windowCount + 1,
            },
        };
    }

    return {
        allowed: true,
        nextState: {
            lastSentAt: nowMs,
            windowStart: nowMs,
            windowCount: 1,
        },
    };
}

export interface CleanChatContentInput {
    content: string;
    maxLength?: number;
}

export type CleanChatContentResult =
    | { ok: true; content: string }
    | { ok: false; reason: 'too_long' | 'empty' | 'after_sanitize_empty' };

export function cleanChatContent(input: CleanChatContentInput): CleanChatContentResult {
    const maxLength = input.maxLength ?? LIVE_CHAT_MAX_LENGTH;
    const trimmed = input.content.trim();
    if (trimmed.length === 0) return { ok: false, reason: 'empty' };
    if (trimmed.length > maxLength) return { ok: false, reason: 'too_long' };

    const sanitized = sanitizeChatText(trimmed);
    if (sanitized.length === 0) return { ok: false, reason: 'after_sanitize_empty' };
    if (sanitized.length > maxLength) return { ok: false, reason: 'too_long' };

    return { ok: true, content: sanitized };
}

export interface ChatPollWindowInput {
    messages: ReadonlyArray<{ sentAt: Date; id: string }>;
    since: Date | null;
    now: Date;
    maxAge?: number;
}

export interface ChatPollWindowResult {
    newMessages: ReadonlyArray<{ sentAt: Date; id: string }>;
    nextCursor: Date | null;
}

export function buildChatPollWindow(input: ChatPollWindowInput): ChatPollWindowResult {
    const cutoffMs = input.now.getTime() - (input.maxAge ?? 60 * 60_000);
    const cutoffDate = new Date(cutoffMs);
    const since = input.since ?? cutoffDate;
    const filtered = input.messages.filter((m) => m.sentAt > since && m.sentAt >= cutoffDate);

    let nextCursor: Date | null = input.since;
    for (const m of filtered) {
        if (!nextCursor || m.sentAt > nextCursor) nextCursor = m.sentAt;
    }
    return { newMessages: filtered, nextCursor };
}
