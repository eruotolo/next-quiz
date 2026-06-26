import type { GeneratedQuestion } from '../schemas/generation.schemas';

interface ParseResult {
    ok: GeneratedQuestion[];
    errors: string[];
}

interface RawOption {
    text?: string;
    isCorrect?: boolean;
}

interface RawQuestion {
    text?: string;
    options?: RawOption[];
}

function validateQuestion(
    item: unknown,
    index: number,
    questionType: 'UNICA' | 'MULTIPLE',
): { question: GeneratedQuestion | null; error: string | null } {
    const q = item as RawQuestion | null;

    if (!q || typeof q !== 'object') {
        return { question: null, error: `Pregunta ${index + 1}: formato inválido` };
    }

    const text = typeof q.text === 'string' ? q.text.trim() : '';
    if (!text) {
        return { question: null, error: `Pregunta ${index + 1}: sin texto` };
    }
    if (text.length > 2000) {
        return { question: null, error: `Pregunta ${index + 1}: texto demasiado largo (máx 2000)` };
    }

    if (!Array.isArray(q.options) || q.options.length < 2) {
        return { question: null, error: `Pregunta ${index + 1}: debe tener al menos 2 opciones` };
    }

    const options = q.options
        .filter((o: unknown) => o && typeof o === 'object')
        .map((o: unknown) => {
            const opt = o as RawOption;
            return { text: String(opt.text ?? '').trim(), isCorrect: Boolean(opt.isCorrect) };
        })
        .filter((o) => o.text.length > 0);

    if (options.length < 2) {
        return { question: null, error: `Pregunta ${index + 1}: opciones con texto vacío` };
    }

    const correctCount = options.filter((o) => o.isCorrect).length;
    if (correctCount === 0) {
        return { question: null, error: `Pregunta ${index + 1}: sin respuesta correcta marcada` };
    }
    if (questionType === 'MULTIPLE' && correctCount < 2) {
        return {
            question: null,
            error: `Pregunta ${index + 1}: tipo múltiple requiere al menos 2 correctas (tiene ${correctCount})`,
        };
    }

    return { question: { text, questionType: 'UNICA', points: 1, options }, error: null };
}

export function parseGeminiResponse(
    raw: string,
    questionType: 'UNICA' | 'MULTIPLE',
    points: number,
): ParseResult {
    const json = extractJson(raw);
    if (!json) {
        return { ok: [], errors: ['La IA no devolvió un formato válido. Intenta de nuevo.'] };
    }

    if (!Array.isArray(json)) {
        return { ok: [], errors: ['La respuesta no es un arreglo de preguntas.'] };
    }

    const ok: GeneratedQuestion[] = [];
    const errors: string[] = [];

    for (let i = 0; i < json.length; i++) {
        const { question, error } = validateQuestion(json[i], i, questionType);
        if (error) {
            errors.push(error);
        } else if (question) {
            ok.push({ ...question, questionType, points });
        }
    }

    return { ok, errors };
}

function extractJson(raw: string): unknown {
    const trimmed = raw.trim();

    if (trimmed.startsWith('[')) {
        try {
            return JSON.parse(trimmed);
        } catch {
            return null;
        }
    }

    const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenceMatch?.[1]) {
        try {
            return JSON.parse(fenceMatch[1].trim());
        } catch {
            return null;
        }
    }

    const bracketStart = trimmed.indexOf('[');
    const bracketEnd = trimmed.lastIndexOf(']');
    if (bracketStart !== -1 && bracketEnd > bracketStart) {
        try {
            return JSON.parse(trimmed.slice(bracketStart, bracketEnd + 1));
        } catch {
            return null;
        }
    }

    return null;
}
