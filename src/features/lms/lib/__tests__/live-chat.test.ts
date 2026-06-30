import { describe, expect, it } from 'vitest';
import {
    buildChatPollWindow,
    cleanChatContent,
    evaluateChatRateLimit,
} from '@/features/lms/lib/live-chat';

describe('cleanChatContent', () => {
    it('rechaza string vacío o solo whitespace', () => {
        expect(cleanChatContent({ content: '' }).ok).toBe(false);
        expect(cleanChatContent({ content: '   \n   ' }).ok).toBe(false);
    });

    it('rechaza contenido demasiado largo', () => {
        const long = 'x'.repeat(501);
        const r = cleanChatContent({ content: long });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.reason).toBe('too_long');
    });

    it('rechaza después de sanitizar si queda vacío', () => {
        const r1 = cleanChatContent({ content: '<<<<>>>>>' });
        expect(r1.ok).toBe(false);
        if (!r1.ok) expect(r1.reason).toBe('after_sanitize_empty');

        const r2 = cleanChatContent({ content: '<img src=x>' });
        expect(r2.ok).toBe(false);
        if (!r2.ok) expect(r2.reason).toBe('after_sanitize_empty');
    });

    it('elimina tags HTML pero conserva el resto', () => {
        const r = cleanChatContent({ content: 'Hola <b>mundo</b>' });
        expect(r.ok && r.content).toBe('Hola mundo');
    });

    it('bloquea javascript: scheme aunque venga como texto', () => {
        const r = cleanChatContent({ content: 'ver javascript:alert(1)' });
        expect(r.ok && r.content).not.toMatch(/javascript:/i);
    });

    it('preserva saltos de línea y emojis', () => {
        const r = cleanChatContent({ content: 'Hola\nmundo 🎉' });
        expect(r.ok && r.content).toBe('Hola\nmundo 🎉');
    });
});

describe('evaluateChatRateLimit', () => {
    it('permite el primer mensaje', () => {
        const r = evaluateChatRateLimit({ lastSentAt: null, windowStart: 0, windowCount: 0 }, 1000);
        expect(r.allowed).toBe(true);
        if (r.allowed) {
            expect(r.nextState.lastSentAt).toBe(1000);
            expect(r.nextState.windowCount).toBe(1);
        }
    });

    it('rechaza mensajes demasiado rápidos (< 800ms)', () => {
        const r = evaluateChatRateLimit(
            { lastSentAt: 1000, windowStart: 1000, windowCount: 1 },
            1500,
        );
        expect(r.allowed).toBe(false);
        if (!r.allowed) expect(r.reason).toBe('too_fast');
    });

    it('rechaza ráfagas si supera el máximo por minuto', () => {
        const state = { lastSentAt: 0, windowStart: 0, windowCount: 20 };
        const r = evaluateChatRateLimit(state, 50_000);
        expect(r.allowed).toBe(false);
        if (!r.allowed) expect(r.reason).toBe('burst');
    });

    it('permite mensajes dentro del límite', () => {
        const r1 = evaluateChatRateLimit(
            { lastSentAt: 1000, windowStart: 1000, windowCount: 5 },
            2000,
        );
        expect(r1.allowed).toBe(true);
        if (r1.allowed) {
            expect(r1.nextState.windowCount).toBe(6);
        }
    });

    it('resetea ventana después de 60s', () => {
        const r = evaluateChatRateLimit(
            { lastSentAt: 1000, windowStart: 1000, windowCount: 18 },
            70_000,
        );
        expect(r.allowed).toBe(true);
        if (r.allowed) {
            expect(r.nextState.windowStart).toBe(70_000);
            expect(r.nextState.windowCount).toBe(1);
        }
    });
});

describe('buildChatPollWindow', () => {
    const now = new Date('2026-07-01T19:00:00Z');

    it('filtra mensajes posteriores a since', () => {
        const messages = [
            { id: 'a', sentAt: new Date('2026-07-01T18:00:00Z') },
            { id: 'b', sentAt: new Date('2026-07-01T18:30:00Z') },
            { id: 'c', sentAt: new Date('2026-07-01T18:45:00Z') },
        ];
        const r = buildChatPollWindow({
            messages,
            since: new Date('2026-07-01T18:20:00Z'),
            now,
        });
        expect(r.newMessages).toHaveLength(2);
        expect(r.newMessages.map((m) => m.id)).toEqual(['b', 'c']);
    });

    it('usa cutoff de hace 60min si since es null', () => {
        const messages = [
            { id: 'old', sentAt: new Date('2026-07-01T16:30:00Z') },
            { id: 'recent', sentAt: new Date('2026-07-01T18:30:00Z') },
        ];
        const r = buildChatPollWindow({ messages, since: null, now });
        expect(r.newMessages.map((m) => m.id)).toEqual(['recent']);
    });

    it('actualiza nextCursor al último mensaje devuelto', () => {
        const messages = [
            { id: 'a', sentAt: new Date('2026-07-01T18:30:00Z') },
            { id: 'b', sentAt: new Date('2026-07-01T18:45:00Z') },
        ];
        const r = buildChatPollWindow({
            messages,
            since: new Date('2026-07-01T18:00:00Z'),
            now,
        });
        expect(r.nextCursor?.getTime()).toBe(new Date('2026-07-01T18:45:00Z').getTime());
    });
});
