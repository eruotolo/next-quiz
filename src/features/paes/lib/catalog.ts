import type { PaesSubject } from '@/features/paes/types/paes.types';

export interface PaesSubjectMeta {
    subject: PaesSubject;
    label: string;
    description: string;
    timeLimitMinutes: number;
    officialQuestionCount: number;
    practiceQuestionCount: number;
    color: string;
}

export const PAES_CATALOG: PaesSubjectMeta[] = [
    {
        subject: 'lectora',
        label: 'Competencia Lectora',
        description:
            'Comprensión, interpretación y reflexión crítica sobre textos de distinta naturaleza y complejidad.',
        timeLimitMinutes: 150,
        officialQuestionCount: 65,
        practiceQuestionCount: 65,
        color: 'bg-primary/5 border-primary/20 hover:border-primary/50',
    },
    {
        subject: 'm1',
        label: 'Matemática M1',
        description:
            'Habilidades matemáticas fundamentales: números, álgebra, geometría, probabilidad y estadística.',
        timeLimitMinutes: 140,
        officialQuestionCount: 65,
        practiceQuestionCount: 51,
        color: 'bg-success/5 border-success/20 hover:border-success/50',
    },
    {
        subject: 'm2',
        label: 'Matemática M2',
        description:
            'Álgebra avanzada, funciones, geometría analítica y cálculo introductorio para ciencias exactas.',
        timeLimitMinutes: 140,
        officialQuestionCount: 55,
        practiceQuestionCount: 46,
        color: 'bg-warning/5 border-warning/20 hover:border-warning/50',
    },
    {
        subject: 'historia',
        label: 'Historia y Ciencias Sociales',
        description:
            'Historia de Chile, historia universal, geografía, pensamiento crítico y educación cívica.',
        timeLimitMinutes: 120,
        officialQuestionCount: 65,
        practiceQuestionCount: 65,
        color: 'bg-coral/5 border-coral/20 hover:border-coral/50',
    },
    {
        subject: 'ciencias',
        label: 'Ciencias',
        description:
            'Biología, química y física con un bloque común y una sección electiva según especialidad.',
        timeLimitMinutes: 160,
        officialQuestionCount: 80,
        practiceQuestionCount: 78,
        color: 'bg-lime/10 border-lime/30 hover:border-lime/60',
    },
];

export function getSubjectMeta(subject: PaesSubject): PaesSubjectMeta | undefined {
    return PAES_CATALOG.find((s) => s.subject === subject);
}

export function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
}
