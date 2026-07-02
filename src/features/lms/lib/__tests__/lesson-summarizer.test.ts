import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { generateTextMock, googleMock } = vi.hoisted(() => ({
    generateTextMock: vi.fn(),
    googleMock: vi.fn(() => 'google-model-mock'),
}));

vi.mock('ai', () => ({
    generateText: generateTextMock,
}));
vi.mock('@ai-sdk/google', () => ({
    google: googleMock,
}));

import { summarizeLessonText } from '../lesson-summarizer';

const LONG_TEXT = 'a'.repeat(300);

describe('summarizeLessonText', () => {
    beforeEach(() => {
        generateTextMock.mockReset();
        googleMock.mockClear();
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key';
    });

    afterEach(() => {
        delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    });

    it('rejects content shorter than 200 chars', async () => {
        const result = await summarizeLessonText('Hola mundo');
        expect(result.ok).toBe(false);
        expect(result.error).toContain('200');
    });

    it('rejects content larger than 50000 chars', async () => {
        const huge = 'a'.repeat(50_001);
        const result = await summarizeLessonText(huge);
        expect(result.ok).toBe(false);
        expect(result.error).toContain('50000');
    });

    it('returns config error when API key missing', async () => {
        delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        const result = await summarizeLessonText(LONG_TEXT);
        expect(result.ok).toBe(false);
        expect(result.error).toContain('API key');
    });

    it('parses valid JSON response', async () => {
        generateTextMock.mockResolvedValueOnce({
            text: JSON.stringify({
                summary: 'Esta lección introduce los conceptos básicos de cálculo diferencial.',
                keyPoints: ['Límites', 'Derivadas', 'Regla de la cadena'],
            }),
        });
        const result = await summarizeLessonText(LONG_TEXT);
        expect(result.ok).toBe(true);
        expect(result.summary?.summary).toContain('cálculo');
        expect(result.summary?.keyPoints).toEqual(['Límites', 'Derivadas', 'Regla de la cadena']);
        expect(googleMock).toHaveBeenCalledWith('gemini-2.5-flash');
    });

    it('parses JSON inside markdown fences', async () => {
        generateTextMock.mockResolvedValueOnce({
            text: `\`\`\`json\n${JSON.stringify({
                summary: 'Resumen válido dentro de fences de markdown.',
                keyPoints: ['Punto 1', 'Punto 2'],
            })}\n\`\`\``,
        });
        const result = await summarizeLessonText(LONG_TEXT);
        expect(result.ok).toBe(true);
    });

    it('rejects response without keyPoints', async () => {
        generateTextMock.mockResolvedValueOnce({
            text: JSON.stringify({ summary: 'Resumen sin keyPoints válidos' }),
        });
        const result = await summarizeLessonText(LONG_TEXT);
        expect(result.ok).toBe(false);
    });

    it('rejects short summary text', async () => {
        generateTextMock.mockResolvedValueOnce({
            text: JSON.stringify({ summary: 'Corto', keyPoints: ['ok'] }),
        });
        const result = await summarizeLessonText(LONG_TEXT);
        expect(result.ok).toBe(false);
    });

    it('caps keyPoints to 8 items', async () => {
        const tenPoints = Array.from({ length: 10 }, (_, i) => `Punto ${i + 1}`);
        generateTextMock.mockResolvedValueOnce({
            text: JSON.stringify({
                summary: 'Resumen largo con suficiente detalle para pasar la validación.',
                keyPoints: tenPoints,
            }),
        });
        const result = await summarizeLessonText(LONG_TEXT);
        expect(result.ok).toBe(true);
        expect(result.summary?.keyPoints).toHaveLength(8);
    });

    it('returns error when AI throws', async () => {
        generateTextMock.mockRejectedValueOnce(new Error('Rate limit exceeded'));
        const result = await summarizeLessonText(LONG_TEXT);
        expect(result.ok).toBe(false);
        expect(result.error).toContain('Rate limit');
    });

    it('returns error when AI returns garbage', async () => {
        generateTextMock.mockResolvedValueOnce({ text: 'No soy JSON válido' });
        const result = await summarizeLessonText(LONG_TEXT);
        expect(result.ok).toBe(false);
    });
});
