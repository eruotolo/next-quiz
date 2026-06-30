import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateActivationToken } from '../activation-token';

describe('generateActivationToken', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('genera un token hex de 64 chars (32 bytes)', () => {
        const { token } = generateActivationToken();
        expect(token).toHaveLength(64);
        expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('expiresAt es exactamente 24h en el futuro', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-30T12:00:00Z'));
        const { expiresAt } = generateActivationToken();
        expect(expiresAt.toISOString()).toBe('2026-07-01T12:00:00.000Z');
    });

    it('produce tokens distintos en cada llamada', () => {
        const a = generateActivationToken();
        const b = generateActivationToken();
        const c = generateActivationToken();
        expect(a.token).not.toBe(b.token);
        expect(b.token).not.toBe(c.token);
        expect(a.token).not.toBe(c.token);
    });

    it('expiresAt está siempre en el futuro', () => {
        const before = Date.now();
        const { expiresAt } = generateActivationToken();
        const after = Date.now();
        expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 24 * 60 * 60 * 1000);
        expect(expiresAt.getTime()).toBeLessThanOrEqual(after + 24 * 60 * 60 * 1000);
    });
});