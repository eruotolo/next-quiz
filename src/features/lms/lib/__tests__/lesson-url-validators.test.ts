import { describe, expect, it } from 'vitest';
import {
    isValidExternalLinkForType,
    parseLiveSessionUrl,
    parseVideoEmbedUrl,
} from '../lesson-url-validators';

describe('parseVideoEmbedUrl', () => {
    it('acepta youtube.com/watch?v=ID', () => {
        expect(parseVideoEmbedUrl('https://www.youtube.com/watch?v=abc123')).toEqual({
            kind: 'youtube',
            embedUrl: 'https://www.youtube.com/embed/abc123',
        });
    });

    it('acepta youtu.be/ID', () => {
        expect(parseVideoEmbedUrl('https://youtu.be/abc123')).toEqual({
            kind: 'youtube',
            embedUrl: 'https://www.youtube.com/embed/abc123',
        });
    });

    it('acepta youtube.com/embed/ID', () => {
        expect(parseVideoEmbedUrl('https://www.youtube.com/embed/abc123')).toEqual({
            kind: 'youtube',
            embedUrl: 'https://www.youtube.com/embed/abc123',
        });
    });

    it('rechaza URL que no es YouTube ni Vimeo', () => {
        expect(parseVideoEmbedUrl('https://example.com/watch?v=abc')).toBeNull();
        expect(parseVideoEmbedUrl('https://meet.google.com/abc-defg-hij')).toBeNull();
        expect(parseVideoEmbedUrl('not-a-url')).toBeNull();
        expect(parseVideoEmbedUrl('')).toBeNull();
    });

    it('acepta vimeo.com/ID', () => {
        expect(parseVideoEmbedUrl('https://vimeo.com/123456789')).toEqual({
            kind: 'vimeo',
            embedUrl: 'https://player.vimeo.com/video/123456789',
        });
    });

    it('acepta player.vimeo.com/video/ID', () => {
        expect(parseVideoEmbedUrl('https://player.vimeo.com/video/123456789')).toEqual({
            kind: 'vimeo',
            embedUrl: 'https://player.vimeo.com/video/123456789',
        });
    });
});

describe('parseLiveSessionUrl', () => {
    it('detecta Google Meet', () => {
        expect(parseLiveSessionUrl('https://meet.google.com/abc-defg-hij')).toEqual({
            provider: 'google_meet',
        });
    });

    it('acepta Google Meet con query string y fragmentos', () => {
        expect(parseLiveSessionUrl('https://meet.google.com/abc-defg-hij?hs=122')).toEqual({
            provider: 'google_meet',
        });
    });

    it('detecta Zoom con subdominio regional', () => {
        expect(parseLiveSessionUrl('https://us02web.zoom.us/j/123456789')).toEqual({
            provider: 'zoom',
        });
    });

    it('rechaza dominio que no es Meet ni Zoom', () => {
        expect(parseLiveSessionUrl('https://teams.microsoft.com/meeting/123')).toBeNull();
        expect(parseLiveSessionUrl('https://example.com')).toBeNull();
        expect(parseLiveSessionUrl('not-a-url')).toBeNull();
    });
});

describe('isValidExternalLinkForType', () => {
    it('VIDEO acepta YouTube y Vimeo', () => {
        expect(isValidExternalLinkForType('VIDEO', 'https://youtu.be/abc')).toBe(true);
        expect(isValidExternalLinkForType('VIDEO', 'https://vimeo.com/123')).toBe(true);
    });

    it('VIDEO rechaza Meet y Zoom', () => {
        expect(isValidExternalLinkForType('VIDEO', 'https://meet.google.com/abc-defg-hij')).toBe(
            false,
        );
        expect(isValidExternalLinkForType('VIDEO', 'https://us02web.zoom.us/j/123')).toBe(false);
    });

    it('EN_VIVO acepta Meet y Zoom', () => {
        expect(isValidExternalLinkForType('EN_VIVO', 'https://meet.google.com/abc-defg-hij')).toBe(
            true,
        );
        expect(isValidExternalLinkForType('EN_VIVO', 'https://us02web.zoom.us/j/123')).toBe(true);
    });

    it('EN_VIVO rechaza YouTube', () => {
        expect(isValidExternalLinkForType('EN_VIVO', 'https://youtu.be/abc')).toBe(false);
    });

    it('ENLACE acepta cualquier URL válida', () => {
        expect(isValidExternalLinkForType('ENLACE', 'https://example.com/recurso')).toBe(true);
        expect(isValidExternalLinkForType('ENLACE', 'https://docs.google.com/document/d/xyz')).toBe(
            true,
        );
    });

    it('ENLACE rechaza string no-URL', () => {
        expect(isValidExternalLinkForType('ENLACE', 'no-es-url')).toBe(false);
    });

    it('TEXTO, DOCUMENTO, TAREA, EXAMEN no validan externalLink', () => {
        expect(isValidExternalLinkForType('TEXTO', '')).toBe(true);
        expect(isValidExternalLinkForType('DOCUMENTO', '')).toBe(true);
        expect(isValidExternalLinkForType('TAREA', '')).toBe(true);
        expect(isValidExternalLinkForType('EXAMEN', '')).toBe(true);
    });
});