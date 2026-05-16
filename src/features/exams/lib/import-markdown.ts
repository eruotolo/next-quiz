import type { ParseResult, QuestionDraft } from './import-excel';

function normalizeType(raw: string): 'UNICA' | 'MULTIPLE' {
    const s = raw.toLowerCase().trim();
    if (s === 'multiple' || s === 'múltiple' || s === 'multi') return 'MULTIPLE';
    return 'UNICA';
}

// Parses the custom markdown format:
// ## ¿Pregunta? [N pts] [unica|multiple]
// - [x] correct option
// - [ ] incorrect option
export function parseMarkdownFile(text: string): ParseResult {
    const ok: QuestionDraft[] = [];
    const errors: { row: number; message: string }[] = [];

    // Split into blocks by "## " at the start of a line
    const blocks = text
        .split(/^## /m)
        .map((b) => b.trim())
        .filter(Boolean);

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: legacy complex UI component
    blocks.forEach((block, i) => {
        const lines = block.split('\n').map((l) => l.trim());
        const header = lines[0] ?? '';

        // Extract optional [N pts] and [tipo]
        const ptsMatch = header.match(/\[(\d+)\s*pts?\]/i);
        const typeMatch = header.match(/\[(unica|única|multiple|múltiple|multi)\]/i);

        const points = ptsMatch?.[1] ? Math.max(1, Math.min(100, Number.parseInt(ptsMatch[1], 10))) : 1;
        const questionType = typeMatch?.[1] ? normalizeType(typeMatch[1]) : 'UNICA';

        // Remove the bracket annotations from the header to get the question text
        const questionText = header
            .replace(/\[\d+\s*pts?\]/gi, '')
            .replace(/\[(unica|única|multiple|múltiple|multi)\]/gi, '')
            .trim();

        if (!questionText) {
            errors.push({ row: i + 1, message: `Bloque ${i + 1}: texto de pregunta vacío.` });
            return;
        }

        const options: { text: string; isCorrect: boolean }[] = [];
        for (const line of lines.slice(1)) {
            if (!line.startsWith('- ')) continue;
            const correctMatch = line.match(/^- \[x\]\s+(.+)$/i);
            const incorrectMatch = line.match(/^- \[ \]\s+(.+)$/);
            if (correctMatch?.[1]) {
                options.push({ text: correctMatch[1].trim(), isCorrect: true });
            } else if (incorrectMatch?.[1]) {
                options.push({ text: incorrectMatch[1].trim(), isCorrect: false });
            }
        }

        if (options.length < 2) {
            errors.push({
                row: i + 1,
                message: `Bloque ${i + 1} ("${questionText.slice(0, 40)}"): se necesitan al menos 2 opciones.`,
            });
            return;
        }

        const correctCount = options.filter((o) => o.isCorrect).length;
        if (questionType === 'UNICA' && correctCount !== 1) {
            errors.push({
                row: i + 1,
                message: `Bloque ${i + 1}: opción única necesita exactamente 1 respuesta correcta (encontradas: ${correctCount}).`,
            });
            return;
        }
        if (questionType === 'MULTIPLE' && correctCount < 2) {
            errors.push({
                row: i + 1,
                message: `Bloque ${i + 1}: opción múltiple necesita al menos 2 respuestas correctas (encontradas: ${correctCount}).`,
            });
            return;
        }

        ok.push({ text: questionText, questionType, points, options });
    });

    return { ok, errors };
}
