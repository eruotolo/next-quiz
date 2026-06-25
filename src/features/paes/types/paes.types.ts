// Módulo PAES — INDEPENDIENTE de la jerarquía académica (Program / AcademicPeriod
// / CourseSection). Decisión D15 del plan `.doc/jerarquia-educacional.md`: PAES
// queda FUERA de scope de la jerarquía en V1. `PaesSubject` es su propia noción
// de "materia" y no se mapea a `CourseSection`. Un PreUniversitario que quiera
// integrarlo puede crear un `Program` "PAES" con materias normales aparte.
export type PaesSubject = 'lectora' | 'm1' | 'm2' | 'ciencias' | 'historia';

export interface PaesOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

export interface PaesQuestion {
    id: string;
    number: number;
    contextTitle?: string;
    context?: string;
    statement: string;
    options: PaesOption[];
    eje: string;
}

export interface PaesExam {
    subject: PaesSubject;
    title: string;
    source: string;
    sourceUrl: string;
    timeLimitMinutes: number;
    questions: PaesQuestion[];
}

export interface PaesQuestionResult {
    questionId: string;
    isCorrect: boolean;
    selected: string[];
    eje: string;
}

export interface PaesEjeResult {
    eje: string;
    correct: number;
    total: number;
}

export interface PaesResult {
    correct: number;
    incorrect: number;
    unanswered: number;
    total: number;
    percent: number;
    estimatedScore: number;
    byEje: PaesEjeResult[];
    perQuestion: PaesQuestionResult[];
}
