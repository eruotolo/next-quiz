/**
 * Converts the raw DEMRE PAES Invierno 2026 JSON (public/paes-invierno-2026.json)
 * into the PaesExam format used by src/features/paes/data/
 *
 * Run: node scripts/convert-demre.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const raw = JSON.parse(readFileSync(resolve(ROOT, 'public/paes-invierno-2026.json'), 'utf-8'));

// ──────────────────────────────────────────────────
// EJE HEURISTICS
// ──────────────────────────────────────────────────

function detectLectoraEje(text) {
    const t = text.toLowerCase();
    if (
        t.includes('¿qué afirma') ||
        t.includes('¿qué plantea') ||
        t.includes('según el texto') ||
        t.includes('menciona') ||
        t.includes('indica') ||
        t.includes('señala') ||
        t.includes('datos') ||
        t.includes('información') ||
        t.includes('a diferencia de') ||
        t.includes('¿cuántos') ||
        t.includes('¿cuándo') ||
        t.includes('¿dónde')
    )
        return 'Localizar y recuperar información';

    if (
        t.includes('relación') ||
        t.includes('función') ||
        t.includes('propósito') ||
        t.includes('diferencia') ||
        t.includes('semejanza') ||
        t.includes('analogía') ||
        t.includes('comparar') ||
        t.includes('párrafo') ||
        t.includes('fragmento') ||
        t.includes('estructura') ||
        t.includes('secuencia') ||
        t.includes('¿cuál es la relación') ||
        t.includes('¿por qué')
    )
        return 'Relacionar e interpretar';

    return 'Reflexionar y evaluar';
}

function detectM1Eje(n) {
    // Rough distribution based on official DEMRE temario ordering
    if (n <= 16) return 'Números';
    if (n <= 32) return 'Álgebra y funciones';
    if (n <= 50) return 'Geometría';
    return 'Probabilidad y estadística';
}

function detectM2Eje(n) {
    if (n <= 14) return 'Álgebra';
    if (n <= 28) return 'Funciones';
    if (n <= 42) return 'Geometría analítica';
    return 'Probabilidad y estadística';
}

function detectHistoriaEje(n) {
    if (n <= 16) return 'Historia de Chile';
    if (n <= 32) return 'Historia universal';
    if (n <= 48) return 'Geografía';
    return 'Educación cívica';
}

function detectCienciasEje(text) {
    const t = text.toLowerCase();
    if (
        t.includes('célula') ||
        t.includes('adn') ||
        t.includes('proteína') ||
        t.includes('organismo') ||
        t.includes('evolución') ||
        t.includes('ecosistema') ||
        t.includes('genética') ||
        t.includes('fotosíntesis') ||
        t.includes('reproducción') ||
        t.includes('metabolismo') ||
        t.includes('tejido') ||
        t.includes('especie')
    )
        return 'Biología';

    if (
        t.includes('mol') ||
        t.includes('reacción') ||
        t.includes('ph ') ||
        t.includes('ácido') ||
        t.includes('base') ||
        t.includes('óxido') ||
        t.includes('enlace') ||
        t.includes('átomo') ||
        t.includes('tabla periódica') ||
        t.includes('compuesto') ||
        t.includes('elemento') ||
        t.includes('oxidación') ||
        t.includes('reducción')
    )
        return 'Química';

    return 'Física';
}

// ──────────────────────────────────────────────────
// CONVERSION HELPERS
// ──────────────────────────────────────────────────

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

function convertQuestion(q, index, ejeResolver) {
    // Skip eliminated questions
    if (q.eliminated) return null;
    // Skip questions with image-based options (can't display them)
    if (q.has_image_options) return null;
    // Skip if text is missing
    if (!q.text || q.text.trim().length < 5) return null;
    // Skip if any option is missing
    if (!q.options || OPTION_KEYS.some((k) => !q.options[k] || q.options[k].trim().length < 2))
        return null;

    const id = `${index.prefix}-${String(q.number).padStart(2, '0')}`;
    const correctKey = q.correct_answer?.trim().toUpperCase();

    return {
        id,
        number: q.number,
        statement: q.text.trim(),
        options: OPTION_KEYS.map((key) => ({
            id: `${id}-${key.toLowerCase()}`,
            text: q.options[key].trim(),
            isCorrect: key === correctKey,
        })),
        eje: ejeResolver(q),
        // Pilot questions don't affect score in the real PAES, but we include them
        isPilot: q.excluded_from_score ?? false,
    };
}

function buildExam({ subject, title, timeLimitMinutes, sourceId, questions }) {
    return {
        subject,
        title,
        source: 'DEMRE — PAES Invierno 2026',
        sourceUrl: `https://demre.cl/publicaciones/2026/pruebas-oficiales-paes-invierno-p2026`,
        timeLimitMinutes,
        questions,
    };
}

function getSubjectById(id) {
    return raw.subjects.find((s) => s.id === id);
}

function processSubject(subjectId, prefix, ejeResolver) {
    const subj = getSubjectById(subjectId);
    if (!subj) {
        console.error(`Subject not found: ${subjectId}`);
        return [];
    }
    const result = [];
    for (const q of subj.questions) {
        const converted = convertQuestion(q, { prefix }, ejeResolver);
        if (converted) result.push(converted);
    }
    return result;
}

// ──────────────────────────────────────────────────
// BUILD EACH SUBJECT
// ──────────────────────────────────────────────────

// Competencia Lectora
const lectoraQuestions = processSubject('competencia_lectora', 'cl', (q) =>
    detectLectoraEje(q.text),
);
const lectora = buildExam({
    subject: 'lectora',
    title: 'Competencia Lectora',
    timeLimitMinutes: 150,
    questions: lectoraQuestions,
});

// Matemática M1
const m1Questions = processSubject('matematica_m1', 'm1', (q) => detectM1Eje(q.number));
const m1 = buildExam({
    subject: 'm1',
    title: 'Matemática M1',
    timeLimitMinutes: 140,
    questions: m1Questions,
});

// Matemática M2
const m2Questions = processSubject('matematica_m2', 'm2', (q) => detectM2Eje(q.number));
const m2 = buildExam({
    subject: 'm2',
    title: 'Matemática M2',
    timeLimitMinutes: 140,
    questions: m2Questions,
});

// Historia
const historiaQuestions = processSubject('historia', 'hi', (q) => detectHistoriaEje(q.number));
const historia = buildExam({
    subject: 'historia',
    title: 'Historia y Ciencias Sociales',
    timeLimitMinutes: 120,
    questions: historiaQuestions,
});

// Ciencias — usamos la versión Biología completa (50 comunes + 30 electivo Bio = 80 preguntas)
// Es la opción más frecuente y la más representativa del bloque completo.
// El enunciado de la prueba aclara que preguntas 51-80 son el electivo Biología.
const cienciasQuestions = processSubject('ciencias_biologia', 'ci', (q) =>
    q.number <= 50 ? detectCienciasEje(q.text) : 'Biología',
);

const ciencias = buildExam({
    subject: 'ciencias',
    title: 'Ciencias (Electivo Biología)',
    timeLimitMinutes: 160,
    questions: cienciasQuestions,
});

// ──────────────────────────────────────────────────
// SAVE FILES
// ──────────────────────────────────────────────────

const dataDir = resolve(ROOT, 'src/features/paes/data');

const exams = [
    ['lectora-invierno-2026.json', lectora],
    ['m1-invierno-2026.json', m1],
    ['m2-invierno-2026.json', m2],
    ['historia-invierno-2026.json', historia],
    ['ciencias-invierno-2026.json', ciencias],
];

for (const [filename, exam] of exams) {
    writeFileSync(resolve(dataDir, filename), JSON.stringify(exam, null, 2), 'utf-8');
    console.log(`✓ ${filename} — ${exam.questions.length} preguntas`);
}

console.log(
    '\nDone. Update DATA_LOADERS in [subject]/page.tsx to point to *-invierno-2026.json files.',
);
