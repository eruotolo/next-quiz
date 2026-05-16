import * as XLSX from 'xlsx';

export interface QuestionDraft {
    text: string;
    questionType: 'UNICA' | 'MULTIPLE';
    points: number;
    options: { text: string; isCorrect: boolean }[];
}

export interface ParseResult {
    ok: QuestionDraft[];
    errors: { row: number; message: string }[];
}

const TRUTHY = new Set(['x', 'X', '1', 'true', 'sí', 'si', 'TRUE', 'SÍ', 'SI', 'yes', 'YES']);

function isTruthy(val: unknown): boolean {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val === 1;
    if (typeof val === 'string') return TRUTHY.has(val.trim());
    return false;
}

function normalizeType(raw: unknown): 'UNICA' | 'MULTIPLE' {
    const s = String(raw ?? '').toLowerCase().trim();
    if (s === 'multiple' || s === 'múltiple' || s === 'multi') return 'MULTIPLE';
    return 'UNICA';
}

export function parseExcelFile(buffer: ArrayBuffer): ParseResult {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
    if (!sheetName || !sheet) {
        return { ok: [], errors: [{ row: 0, message: 'El archivo no contiene hojas.' }] };
    }

    const rows = XLSX.utils.sheet_to_json(sheet, {
        defval: '',
        raw: false,
    }) as Record<string, unknown>[];

    const ok: QuestionDraft[] = [];
    const errors: { row: number; message: string }[] = [];

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: legacy complex UI component
    rows.forEach((row, i) => {
        const rowNum = i + 2; // Excel row (header is row 1)
        const text = String(row.pregunta ?? '').trim();
        if (!text) return; // skip blank rows silently

        const questionType = normalizeType(row.tipo);
        const points = Math.max(1, Math.min(100, Number.parseInt(String(row.puntos ?? '1'), 10) || 1));

        const options: { text: string; isCorrect: boolean }[] = [];
        for (let n = 1; n <= 6; n++) {
            const optText = String(row[`opcion${n}`] ?? '').trim();
            if (!optText) continue;
            options.push({ text: optText, isCorrect: isTruthy(row[`correcta${n}`]) });
        }

        if (options.length < 2) {
            errors.push({ row: rowNum, message: `Fila ${rowNum}: se necesitan al menos 2 opciones.` });
            return;
        }

        const correctCount = options.filter((o) => o.isCorrect).length;
        if (questionType === 'UNICA' && correctCount !== 1) {
            errors.push({
                row: rowNum,
                message: `Fila ${rowNum}: opción única necesita exactamente 1 respuesta correcta (encontradas: ${correctCount}).`,
            });
            return;
        }
        if (questionType === 'MULTIPLE' && correctCount < 2) {
            errors.push({
                row: rowNum,
                message: `Fila ${rowNum}: opción múltiple necesita al menos 2 respuestas correctas (encontradas: ${correctCount}).`,
            });
            return;
        }

        ok.push({ text, questionType, points, options });
    });

    return { ok, errors };
}
