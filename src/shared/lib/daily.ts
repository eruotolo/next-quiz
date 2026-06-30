import { prisma } from '@/shared/lib/prisma';
import { APP_CONFIG_KEY } from '@/features/config/lib/app-config-keys';

const DAILY_API_BASE = 'https://api.daily.co/v1';

const configCache = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

async function readConfig(key: string): Promise<string | null> {
    const cached = configCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const row = await prisma.appConfig.findUnique({
        where: { key },
        select: { value: true },
    });

    const value = row?.value ?? null;
    if (value && value.length > 0) {
        configCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    }
    return value;
}

function clearConfigCache(): void {
    configCache.clear();
}

async function getDailyApiKey(): Promise<string | null> {
    return readConfig(APP_CONFIG_KEY.DAILY_API_KEY);
}

async function getDailyWebhookSecret(): Promise<string | null> {
    return readConfig(APP_CONFIG_KEY.DAILY_WEBHOOK_SECRET);
}

export function isDailyConfigured(apiKey: string | null): apiKey is string {
    return typeof apiKey === 'string' && apiKey.length > 10;
}

type DailyFetchOptions = {
    method: 'GET' | 'POST' | 'DELETE' | 'PUT';
    apiKey: string;
    path: string;
    body?: unknown;
};

type DailyFetchResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

async function dailyFetch<T>({
    method,
    apiKey,
    path,
    body,
}: DailyFetchOptions): Promise<DailyFetchResult<T>> {
    const response = await fetch(`${DAILY_API_BASE}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        cache: 'no-store',
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        return {
            ok: false,
            status: response.status,
            error: errorText || `Daily API responded with ${response.status}`,
        };
    }

    if (response.status === 204) {
        return { ok: true, data: undefined as T };
    }

    const data = (await response.json()) as T;
    return { ok: true, data };
}

export interface DailyRoom {
    id: string;
    name: string;
    url: string;
    privacy: 'public' | 'private';
    created_at: string;
    expires_at: string;
    config: {
        max_participants?: number;
        eject_at_room_exp?: boolean;
        eject_after_timeout?: number;
        start_video_off?: boolean;
        start_audio_off?: boolean;
        enable_chat?: boolean;
        enable_screenshare?: boolean;
    };
}

export interface CreateDailyRoomInput {
    name: string;
    expiresAt: Date;
    maxParticipants?: number;
    enableScreenshare?: boolean;
    enableChat?: boolean;
    ejectAtRoomExpires?: boolean;
    ejectAfterSeconds?: number;
    startVideoOff?: boolean;
    startAudioOff?: boolean;
}

export type CreateDailyRoomResult = { ok: true; room: DailyRoom } | { ok: false; error: string };

export async function createDailyRoom(input: CreateDailyRoomInput): Promise<CreateDailyRoomResult> {
    const apiKey = await getDailyApiKey();
    if (!isDailyConfigured(apiKey)) {
        return {
            ok: false,
            error: 'Daily.co no está configurado. Pedile al SuperAdmin que cargue la API key en Configuración.',
        };
    }

    const result = await dailyFetch<DailyRoom>({
        method: 'POST',
        apiKey,
        path: '/rooms',
        body: {
            name: input.name,
            privacy: 'private',
            expires_at: Math.floor(input.expiresAt.getTime() / 1000),
            properties: {
                max_participants: input.maxParticipants ?? 50,
                eject_at_room_exp: input.ejectAtRoomExpires ?? true,
                eject_after_timeout: input.ejectAfterSeconds ?? 7200,
                start_video_off: input.startVideoOff ?? false,
                start_audio_off: input.startAudioOff ?? false,
                enable_chat: input.enableChat ?? true,
                enable_screenshare: input.enableScreenshare ?? true,
                enable_knocking: false,
            },
        },
    });

    if (!result.ok) {
        return {
            ok: false,
            error:
                result.status === 401
                    ? 'API key de Daily.co inválida o revocada.'
                    : `No se pudo crear la sala en Daily.co (${result.status}).`,
        };
    }

    return { ok: true, room: result.data };
}

export async function getDailyRoom(name: string): Promise<DailyRoom | null> {
    const apiKey = await getDailyApiKey();
    if (!isDailyConfigured(apiKey)) return null;

    const result = await dailyFetch<DailyRoom>({
        method: 'GET',
        apiKey,
        path: `/rooms/${encodeURIComponent(name)}`,
    });
    return result.ok ? result.data : null;
}

export type DeleteDailyRoomResult = { ok: true } | { ok: false; error: string };

export async function deleteDailyRoom(name: string): Promise<DeleteDailyRoomResult> {
    const apiKey = await getDailyApiKey();
    if (!isDailyConfigured(apiKey)) {
        return { ok: false, error: 'Daily.co no está configurado.' };
    }

    const result = await dailyFetch<void>({
        method: 'DELETE',
        apiKey,
        path: `/rooms/${encodeURIComponent(name)}`,
    });

    if (!result.ok && result.status !== 404) {
        return { ok: false, error: `No se pudo eliminar la sala (${result.status}).` };
    }
    return { ok: true };
}

export interface DailyMeetingToken {
    token: string;
}

export interface CreateDailyMeetingTokenInput {
    roomName: string;
    userName: string;
    isOwner: boolean;
    expiresAt: Date;
}

export type CreateDailyMeetingTokenResult =
    | { ok: true; token: string }
    | { ok: false; error: string };

export async function createDailyMeetingToken(
    input: CreateDailyMeetingTokenInput,
): Promise<CreateDailyMeetingTokenResult> {
    const apiKey = await getDailyApiKey();
    if (!isDailyConfigured(apiKey)) {
        return { ok: false, error: 'Daily.co no está configurado.' };
    }

    const result = await dailyFetch<DailyMeetingToken>({
        method: 'POST',
        apiKey,
        path: '/meeting-tokens',
        body: {
            properties: {
                room_name: input.roomName,
                user_name: input.userName,
                is_owner: input.isOwner,
                exp: Math.floor(input.expiresAt.getTime() / 1000),
            },
        },
    });

    if (!result.ok) {
        return {
            ok: false,
            error:
                result.status === 401
                    ? 'API key de Daily.co inválida o revocada.'
                    : `No se pudo generar el token de Daily.co (${result.status}).`,
        };
    }

    return { ok: true, token: result.data.token };
}

export type VerifyWebhookResult = { ok: true } | { ok: false; reason: string };

export async function verifyDailyWebhookSignature(
    rawBody: string,
    signatureHeader: string | null,
): Promise<VerifyWebhookResult> {
    if (!signatureHeader) {
        return { ok: false, reason: 'missing_signature' };
    }
    const secret = await getDailyWebhookSecret();
    if (!secret) {
        return { ok: false, reason: 'no_webhook_secret' };
    }

    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );
    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const computed = Buffer.from(signatureBytes).toString('hex');

    if (computed.length !== signatureHeader.length) {
        return { ok: false, reason: 'invalid_signature' };
    }

    let mismatch = 0;
    for (let i = 0; i < computed.length; i += 1) {
        mismatch |= computed.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
    }
    if (mismatch !== 0) {
        return { ok: false, reason: 'invalid_signature' };
    }
    return { ok: true };
}

export interface DailyWebhookPayload {
    type: string;
    payload?: Record<string, unknown>;
}

export function parseDailyWebhookPayload(rawBody: string): DailyWebhookPayload | null {
    try {
        const parsed = JSON.parse(rawBody) as unknown;
        if (typeof parsed === 'object' && parsed !== null && 'type' in parsed) {
            const obj = parsed as { type: unknown; payload?: unknown };
            if (typeof obj.type === 'string') {
                return {
                    type: obj.type,
                    payload:
                        typeof obj.payload === 'object' && obj.payload !== null
                            ? (obj.payload as Record<string, unknown>)
                            : undefined,
                };
            }
        }
        return null;
    } catch {
        return null;
    }
}

// ─── Cloud Recording ──────────────────────────────────────────────────────────

export interface DailyRecording {
    id: string;
    room_name: string;
    status: 'in-progress' | 'finished' | 'error';
    start_ts: number;
    duration?: number;
    download_link?: string;
}

export type StartRecordingResult = { ok: true; recordingId: string } | { ok: false; error: string };

export type StopRecordingResult = { ok: true } | { ok: false; error: string };

export async function startDailyRecording(roomName: string): Promise<StartRecordingResult> {
    const apiKey = await getDailyApiKey();
    if (!isDailyConfigured(apiKey)) {
        return { ok: false, error: 'Daily.co no está configurado.' };
    }

    const result = await dailyFetch<DailyRecording>({
        method: 'POST',
        apiKey,
        path: '/recordings',
        body: { room_name: roomName },
    });

    if (!result.ok) {
        return {
            ok: false,
            error:
                result.status === 422
                    ? 'No hay participantes activos en la sala. La grabación requiere que la sesión esté en curso.'
                    : `No se pudo iniciar la grabación (${result.status}).`,
        };
    }

    return { ok: true, recordingId: result.data.id };
}

export async function stopDailyRecording(recordingId: string): Promise<StopRecordingResult> {
    const apiKey = await getDailyApiKey();
    if (!isDailyConfigured(apiKey)) {
        return { ok: false, error: 'Daily.co no está configurado.' };
    }

    const result = await dailyFetch<void>({
        method: 'DELETE',
        apiKey,
        path: `/recordings/${encodeURIComponent(recordingId)}`,
    });

    if (!result.ok) {
        return { ok: false, error: `No se pudo detener la grabación (${result.status}).` };
    }

    return { ok: true };
}

// Re-exports para tests que importan los cache helpers sin acceder a la red.
export const __testing__ = { readConfig, clearConfigCache };
