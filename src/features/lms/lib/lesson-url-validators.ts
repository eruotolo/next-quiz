import type { LessonType } from '@prisma/client';

export type VideoEmbedKind = 'youtube' | 'vimeo';

export interface VideoEmbedResult {
    kind: VideoEmbedKind;
    embedUrl: string;
}

export type LiveSessionProvider = 'google_meet' | 'zoom';

export interface LiveSessionUrlResult {
    provider: LiveSessionProvider;
}

function safeParseUrl(url: string): URL | null {
    try {
        return new URL(url);
    } catch {
        return null;
    }
}

function parseYoutubeUrl(parsed: URL): VideoEmbedResult | null {
    if (parsed.hostname.replace(/^www\./, '') === 'youtu.be') {
        const id = parsed.pathname.slice(1);
        return id ? { kind: 'youtube', embedUrl: `https://www.youtube.com/embed/${id}` } : null;
    }
    if (parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v');
        return id ? { kind: 'youtube', embedUrl: `https://www.youtube.com/embed/${id}` } : null;
    }
    if (parsed.pathname.startsWith('/embed/')) {
        const id = parsed.pathname.slice('/embed/'.length);
        return id ? { kind: 'youtube', embedUrl: `https://www.youtube.com/embed/${id}` } : null;
    }
    return null;
}

function parseVimeoUrl(parsed: URL): VideoEmbedResult | null {
    if (parsed.hostname.replace(/^www\./, '') === 'vimeo.com') {
        const id = parsed.pathname.slice(1).split('/')[0];
        return id && /^\d+$/.test(id)
            ? { kind: 'vimeo', embedUrl: `https://player.vimeo.com/video/${id}` }
            : null;
    }
    const match = parsed.pathname.match(/^\/video\/(\d+)/);
    return match ? { kind: 'vimeo', embedUrl: `https://player.vimeo.com/video/${match[1]}` } : null;
}

/** Acepta youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID y las variantes de Vimeo. */
export function parseVideoEmbedUrl(url: string): VideoEmbedResult | null {
    const parsed = safeParseUrl(url);
    if (!parsed) return null;
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be' || host === 'youtube.com' || host === 'm.youtube.com') {
        return parseYoutubeUrl(parsed);
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
        return parseVimeoUrl(parsed);
    }
    return null;
}

/** Detecta el proveedor de videollamada a partir del dominio del enlace. */
export function parseLiveSessionUrl(url: string): LiveSessionUrlResult | null {
    const parsed = safeParseUrl(url);
    if (!parsed) return null;
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'meet.google.com') return { provider: 'google_meet' };
    if (host === 'zoom.us' || host.endsWith('.zoom.us') || host === 'zoom.com') {
        return { provider: 'zoom' };
    }
    return null;
}

/** Valida un externalLink según las reglas propias del tipo de lección. */
export function isValidExternalLinkForType(type: LessonType, url: string): boolean {
    if (type === 'VIDEO') return parseVideoEmbedUrl(url) !== null;
    if (type === 'EN_VIVO') return parseLiveSessionUrl(url) !== null;
    if (type === 'ENLACE') return safeParseUrl(url) !== null;
    return true;
}
