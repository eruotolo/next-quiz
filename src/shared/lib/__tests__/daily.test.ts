import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaFindUniqueMock, fetchMock } = vi.hoisted(() => ({
    prismaFindUniqueMock: vi.fn(),
    fetchMock: vi.fn(),
}));

vi.mock('@/shared/lib/prisma', () => ({
    prisma: {
        appConfig: {
            findUnique: prismaFindUniqueMock,
        },
    },
}));

vi.stubGlobal('fetch', fetchMock);

import {
    createDailyMeetingToken,
    createDailyRoom,
    deleteDailyRoom,
    getDailyRoom,
    isDailyConfigured,
    parseDailyWebhookPayload,
    verifyDailyWebhookSignature,
    __testing__,
} from '@/shared/lib/daily';

function mockApiKey() {
    prismaFindUniqueMock.mockImplementation(async ({ where }: { where: { key: string } }) => {
        if (where.key === 'DAILY_API_KEY') {
            return { value: 'fake-api-key-1234567890' };
        }
        if (where.key === 'DAILY_WEBHOOK_SECRET') {
            return { value: 'webhook-secret-xyz' };
        }
        return null;
    });
}

function mockFetchOnce(status: number, body: unknown) {
    fetchMock.mockResolvedValueOnce(
        new Response(typeof body === 'string' ? body : JSON.stringify(body), {
            status,
            headers: { 'content-type': 'application/json' },
        }),
    );
}

describe('isDailyConfigured', () => {
    beforeEach(() => {
        prismaFindUniqueMock.mockReset();
        __testing__.clearConfigCache();
    });
    afterEach(() => vi.resetAllMocks());

    it('true con api key > 10 chars', () => {
        expect(isDailyConfigured('1234567890abcdef')).toBe(true);
    });

    it('false con api key null', () => {
        expect(isDailyConfigured(null)).toBe(false);
    });

    it('false con api key vacía o corta', () => {
        expect(isDailyConfigured('')).toBe(false);
        expect(isDailyConfigured('short')).toBe(false);
    });
});

describe('createDailyRoom', () => {
    beforeEach(() => {
        prismaFindUniqueMock.mockReset();
        fetchMock.mockReset();
        __testing__.clearConfigCache();
    });
    afterEach(() => vi.resetAllMocks());

    it('falla si Daily no está configurado', async () => {
        prismaFindUniqueMock.mockResolvedValueOnce(null);
        const result = await createDailyRoom({
            name: 'aulika-test',
            expiresAt: new Date(Date.now() + 3_600_000),
        });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toMatch(/Daily.co no está configurado/);
    });

    it('crea room exitosamente', async () => {
        mockApiKey();
        mockFetchOnce(201, {
            id: 'room-id',
            name: 'aulika-test',
            url: 'https://aulika.daily.co/aulika-test',
            privacy: 'private',
            created_at: '2026-07-01T18:00:00.000Z',
            expires_at: '2026-07-01T19:00:00.000Z',
            config: { max_participants: 50 },
        });
        const result = await createDailyRoom({
            name: 'aulika-test',
            expiresAt: new Date('2026-07-01T19:00:00Z'),
            maxParticipants: 50,
        });
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.room.name).toBe('aulika-test');
            expect(result.room.url).toMatch(/^https:\/\//);
        }
    });

    it('rechaza 401 con mensaje claro', async () => {
        mockApiKey();
        mockFetchOnce(401, { error: 'unauthorized' });
        const result = await createDailyRoom({
            name: 'aulika-test',
            expiresAt: new Date(),
        });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toMatch(/API key de Daily\.co inválida/);
    });
});

describe('deleteDailyRoom', () => {
    beforeEach(() => {
        prismaFindUniqueMock.mockReset();
        fetchMock.mockReset();
        __testing__.clearConfigCache();
    });
    afterEach(() => vi.resetAllMocks());

    it('considera 404 como éxito', async () => {
        mockApiKey();
        mockFetchOnce(404, { error: 'not found' });
        const result = await deleteDailyRoom('aulika-test');
        expect(result.ok).toBe(true);
    });

    it('falla con error genérico para 500', async () => {
        mockApiKey();
        mockFetchOnce(500, 'internal');
        const result = await deleteDailyRoom('aulika-test');
        expect(result.ok).toBe(false);
    });
});

describe('getDailyRoom', () => {
    beforeEach(() => {
        prismaFindUniqueMock.mockReset();
        fetchMock.mockReset();
        __testing__.clearConfigCache();
    });
    afterEach(() => vi.resetAllMocks());

    it('retorna null si Daily no configurado', async () => {
        prismaFindUniqueMock.mockResolvedValueOnce(null);
        const result = await getDailyRoom('aulika-test');
        expect(result).toBeNull();
    });

    it('retorna room si OK', async () => {
        mockApiKey();
        mockFetchOnce(200, {
            id: 'room-id',
            name: 'aulika-test',
            url: 'https://aulika.daily.co/aulika-test',
        });
        const result = await getDailyRoom('aulika-test');
        expect(result?.name).toBe('aulika-test');
    });
});

describe('createDailyMeetingToken', () => {
    beforeEach(() => {
        prismaFindUniqueMock.mockReset();
        fetchMock.mockReset();
        __testing__.clearConfigCache();
    });
    afterEach(() => vi.resetAllMocks());

    it('genera token correctamente', async () => {
        mockApiKey();
        mockFetchOnce(200, { token: 'tok-abc-123' });
        const result = await createDailyMeetingToken({
            roomName: 'aulika-test',
            userName: 'Juan',
            isOwner: false,
            expiresAt: new Date(),
        });
        expect(result.ok && result.token).toBe('tok-abc-123');
    });
});

describe('parseDailyWebhookPayload', () => {
    it('parsea payload válido', () => {
        const r = parseDailyWebhookPayload(
            JSON.stringify({ type: 'meeting.ended', payload: { room: { name: 'r' } } }),
        );
        expect(r?.type).toBe('meeting.ended');
    });

    it('retorna null para JSON inválido', () => {
        expect(parseDailyWebhookPayload('not json')).toBeNull();
    });

    it('retorna null si no tiene type', () => {
        expect(parseDailyWebhookPayload(JSON.stringify({ foo: 'bar' }))).toBeNull();
    });
});

describe('verifyDailyWebhookSignature', () => {
    beforeEach(() => {
        prismaFindUniqueMock.mockReset();
    });
    afterEach(() => vi.resetAllMocks());

    it('rechaza sin signature header', async () => {
        prismaFindUniqueMock.mockResolvedValueOnce({ value: 'webhook-secret-xyz' });
        const r = await verifyDailyWebhookSignature('body', null);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.reason).toBe('missing_signature');
    });

    it('rechaza si no hay secret configurado', async () => {
        prismaFindUniqueMock.mockResolvedValueOnce(null);
        const r = await verifyDailyWebhookSignature('body', 'sig');
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.reason).toBe('no_webhook_secret');
    });

    it('verifica firma HMAC SHA-256 válida', async () => {
        prismaFindUniqueMock.mockResolvedValueOnce({ value: 'webhook-secret-xyz' });
        const body = '{"type":"meeting.ended"}';
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode('webhook-secret-xyz'),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign'],
        );
        const sigBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
        const sig = Buffer.from(sigBytes).toString('hex');
        const r = await verifyDailyWebhookSignature(body, sig);
        expect(r.ok).toBe(true);
    });

    it('rechaza firma incorrecta', async () => {
        prismaFindUniqueMock.mockResolvedValueOnce({ value: 'webhook-secret-xyz' });
        const r = await verifyDailyWebhookSignature('body', 'deadbeef');
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.reason).toBe('invalid_signature');
    });
});
