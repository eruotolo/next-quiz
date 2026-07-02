import { describe, expect, it } from 'vitest';
import {
    NOTIFICATION_TYPE,
    formatAssignmentDueSoonMessage,
    formatCourseNewItemMessage,
    formatLmsPlanExpiringMessage,
} from '../notification-events';

const UTC_MIDDAY = (y: number, m: number, d: number) =>
    new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));

describe('NOTIFICATION_TYPE', () => {
    it('expone los 3 tipos acordados', () => {
        expect(NOTIFICATION_TYPE.LMS_PLAN_EXPIRING).toBe('LMS_PLAN_EXPIRING');
        expect(NOTIFICATION_TYPE.COURSE_NEW_ITEM).toBe('COURSE_NEW_ITEM');
        expect(NOTIFICATION_TYPE.ASSIGNMENT_DUE_SOON).toBe('ASSIGNMENT_DUE_SOON');
    });
});

describe('formatLmsPlanExpiringMessage', () => {
    it('incluye la fecha formateada en español', () => {
        const msg = formatLmsPlanExpiringMessage({ expiresAt: UTC_MIDDAY(2026, 7, 15) });
        expect(msg).toContain('15');
        expect(msg).toContain('julio');
        expect(msg).toContain('2026');
        expect(msg.toLowerCase()).toContain('aula virtual');
    });
});

describe('formatCourseNewItemMessage', () => {
    it('usa el nombre del docente cuando se pasa', () => {
        const msg = formatCourseNewItemMessage({
            teacherName: 'Juan Pérez',
            lessonTitle: 'Lección 1',
            courseTitle: 'Matemáticas',
        });
        expect(msg).toContain('Juan Pérez');
        expect(msg).toContain('Lección 1');
        expect(msg).toContain('Matemáticas');
    });

    it('usa "Un docente" cuando teacherName es null', () => {
        const msg = formatCourseNewItemMessage({
            teacherName: null,
            lessonTitle: 'Lección 1',
            courseTitle: 'Matemáticas',
        });
        expect(msg).toContain('Un docente');
        expect(msg).not.toContain('null');
    });

    it('usa "Un docente" cuando teacherName es string vacío o whitespace', () => {
        const msg = formatCourseNewItemMessage({
            teacherName: '   ',
            lessonTitle: 'Lección 1',
            courseTitle: 'Matemáticas',
        });
        expect(msg).toContain('Un docente');
    });
});

describe('formatAssignmentDueSoonMessage', () => {
    it('incluye título del assignment, curso y fecha corta', () => {
        const msg = formatAssignmentDueSoonMessage({
            assignmentTitle: 'Ensayo final',
            courseTitle: 'Lenguaje',
            dueAt: UTC_MIDDAY(2026, 8, 5),
        });
        expect(msg).toContain('Ensayo final');
        expect(msg).toContain('Lenguaje');
        expect(msg).toContain('5');
    });
});
