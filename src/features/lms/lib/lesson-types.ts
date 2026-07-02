import type { LessonType } from '@prisma/client';

export const LESSON_TYPE_LABEL: Record<LessonType, string> = {
    VIDEO: 'Video',
    DOCUMENTO: 'Documento',
    TEXTO: 'Texto',
    ENLACE: 'Enlace',
    EXAMEN: 'Examen Aulika',
    TAREA: 'Tarea',
    EN_VIVO: 'En vivo',
};

export const LESSON_TYPE_OPTIONS: LessonType[] = [
    'TEXTO',
    'DOCUMENTO',
    'ENLACE',
    'EXAMEN',
    'TAREA',
    'VIDEO',
    'EN_VIVO',
];
