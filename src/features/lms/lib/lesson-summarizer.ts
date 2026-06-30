import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

const MIN_CONTENT_CHARS = 200;
const MAX_CONTENT_CHARS = 50_000;

export interface LessonSummary {
    summary: string;
    keyPoints: string[];
    generatedAt: string;
}

export interface SummarizeResult {
    ok: boolean;
    summary?: LessonSummary;
    error?: string;
}

interface RawSummary {
    summary?: unknown;
    keyPoints?: unknown;
}

function extractJson(raw: string): unknown {
    const trimmed = raw.trim();

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            return JSON.parse(trimmed);
        } catch {
            // fall through
        }
    }

    const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenceMatch?.[1]) {
        try {
            return JSON.parse(fenceMatch[1].trim());
        } catch {
            // fall through
        }
    }

    const braceStart = trimmed.indexOf('{');
    const braceEnd = trimmed.lastIndexOf('}');
    if (braceStart !== -1 && braceEnd > braceStart) {
        try {
            return JSON.parse(trimmed.slice(braceStart, braceEnd + 1));
        } catch {
            return null;
        }
    }

    return null;
}

function validateSummary(parsed: unknown): LessonSummary | null {
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as RawSummary;

    if (typeof obj.summary !== 'string' || obj.summary.trim().length < 30) return null;
    if (!Array.isArray(obj.keyPoints)) return null;

    const keyPoints = obj.keyPoints
        .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
        .map((p) => p.trim())
        .slice(0, 8);

    if (keyPoints.length === 0) return null;

    return {
        summary: obj.summary.trim().slice(0, 4000),
        keyPoints,
        generatedAt: new Date().toISOString(),
    };
}

const SUMMARY_PROMPT = (content: string): string =>
    `Sos un asistente pedagógico. Recibís el contenido de una lección en español y debés generar un resumen ejecutivo.

Devolvé EXCLUSIVAMENTE un JSON válido con esta forma:
{
  "summary": "párrafo de 80-150 palabras que sintetice la lección en español",
  "keyPoints": ["punto 1", "punto 2", "punto 3", "punto 4", "punto 5"]
}

Reglas:
- Resumí en español neutro.
- keyPoints: entre 3 y 6 bullets cortos (≤ 18 palabras cada uno).
- No inventes información que no esté en el contenido.
- Si el contenido no parece ser una lección, devolvé un objeto con summary vacío y keyPoints vacío.

Contenido de la lección:
"""
${content}
"""`;

export async function summarizeLessonText(content: string): Promise<SummarizeResult> {
    const trimmed = content.trim();
    if (trimmed.length < MIN_CONTENT_CHARS) {
        return { ok: false, error: `El contenido debe tener al menos ${MIN_CONTENT_CHARS} caracteres.` };
    }
    if (trimmed.length > MAX_CONTENT_CHARS) {
        return { ok: false, error: `El contenido no puede superar los ${MAX_CONTENT_CHARS} caracteres.` };
    }
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return { ok: false, error: 'Configurá la API key de Google Generative AI para usar resúmenes IA.' };
    }

    try {
        const { text } = await generateText({
            model: google('gemini-2.5-flash'),
            prompt: SUMMARY_PROMPT(trimmed),
        });

        const json = extractJson(text);
        const summary = validateSummary(json);
        if (!summary) {
            return { ok: false, error: 'La IA no devolvió un resumen válido. Probá de nuevo.' };
        }
        return { ok: true, summary };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        console.error('[lesson-summarizer] failed:', message);
        return { ok: false, error: message };
    }
}
