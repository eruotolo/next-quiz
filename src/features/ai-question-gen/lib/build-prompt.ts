import type { GenerationInput } from '../schemas/generation.schemas';

const DIFFICULTY_LABEL: Record<string, string> = {
    FACIL: 'básico (conceptos fundamentales, definiciones simples)',
    MEDIA: 'intermedio (aplicación de conceptos, análisis de situaciones)',
    DIFICIL: 'avanzado (análisis crítico, resolución de problemas complejos)',
};

export function buildPrompt(input: GenerationInput): string {
    const {
        subject,
        topic,
        questionCount,
        optionsPerQuestion,
        correctAnswers,
        difficulty,
        points,
    } = input;

    const questionType =
        correctAnswers === 1
            ? 'opción única (exactamente 1 respuesta correcta)'
            : 'opción múltiple (más de 1 respuesta correcta)';

    return [
        `Eres un profesor experto en "${subject}".`,
        '',
        `Genera exactamente ${questionCount} preguntas de ${questionType} sobre "${topic}".`,
        `Nivel de dificultad: ${DIFFICULTY_LABEL[difficulty] ?? difficulty}.`,
        `Cada pregunta debe tener exactamente ${optionsPerQuestion} opciones.`,
        `De esas opciones, exactamente ${correctAnswers} deben ser correctas.`,
        `Todas las preguntas valen ${points} punto${points !== 1 ? 's' : ''}.`,
        '',
        'Reglas estrictas:',
        '- Las opciones incorrectas deben ser plausibles y no triviales.',
        '- No uses opciones como "Todas las anteriores" ni "Ninguna de las anteriores".',
        '- Las preguntas deben ser variadas (no repetir la misma estructura).',
        '- El lenguaje debe ser claro, en español, apropiado para un contexto educativo chileno.',
        '',
        'Reglas de concisión (obligatorias):',
        '- Cada enunciado: MÁXIMO 200 caracteres. Pregunta directa, sin párrafos introductorios ni contexto redundante.',
        '- Cada opción: MÁXIMO 80 caracteres.',
        '- No repitas el contexto de la pregunta dentro de cada opción.',
        '- Evita condicionales largas y casos hipotéticos extensos.',
        '',
        'Devuelve ÚNICAMENTE un JSON array sin texto adicional, sin markdown, sin comentarios.',
        'Cada elemento debe tener esta estructura exacta:',
        '{ "text": "enunciado de la pregunta", "options": [{ "text": "texto de opción", "isCorrect": true/false }] }',
        '',
        `Genera exactamente ${questionCount} preguntas.`,
    ].join('\n');
}
