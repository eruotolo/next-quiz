import { describe, expect, it } from 'vitest';
import {
    identifyAtRiskStudents,
    identifyInactiveStudents,
    identifyFailingCourses,
    type EnrollmentLike,
    type GradeLike,
    type ProgressLike,
} from '../at-risk-detector';

const NOW = new Date('2026-06-29T12:00:00Z');
const daysAgo = (n: number): string => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

function enrollment(overrides: Partial<EnrollmentLike> = {}): EnrollmentLike {
    return {
        userId: 'u1',
        studentName: 'Alumno Test',
        studentRut: '11.111.111-1',
        status: 'ACTIVO',
        progressPct: 50,
        completedAt: null,
        lastActivityAt: daysAgo(1),
        ...overrides,
    };
}

function grade(studentId: string, score: number, daysOld = 10): GradeLike {
    return {
        studentId,
        score,
        recordedAt: daysAgo(daysOld),
    };
}

describe('identifyAtRiskStudents', () => {
    it('returns empty when no students meet risk criteria', () => {
        const enrollments = [enrollment({ progressPct: 80, lastActivityAt: daysAgo(1) })];
        const grades = [grade('u1', 6.0)];
        const result = identifyAtRiskStudents(enrollments, grades, { now: NOW });
        expect(result).toEqual([]);
    });

    it('flags student with low progress (< 30%)', () => {
        const enrollments = [enrollment({ progressPct: 20 })];
        const result = identifyAtRiskStudents(enrollments, [], { now: NOW });
        expect(result).toHaveLength(1);
        expect(result[0]?.riskLevel).toBe('MEDIO');
        expect(result[0]?.reasons[0]).toContain('Progreso bajo');
    });

    it('flags student with no activity for 7+ days', () => {
        const enrollments = [enrollment({ lastActivityAt: daysAgo(10) })];
        const result = identifyAtRiskStudents(enrollments, [], { now: NOW });
        expect(result).toHaveLength(1);
        expect(result[0]?.reasons.some((r) => r.includes('Sin actividad'))).toBe(true);
    });

    it('flags student with no activity record at all', () => {
        const enrollments = [enrollment({ lastActivityAt: null })];
        const result = identifyAtRiskStudents(enrollments, [], { now: NOW });
        expect(result).toHaveLength(1);
        expect(result[0]?.reasons[0]).toContain('Sin actividad registrada');
    });

    it('flags student with low average grade (< 4.0)', () => {
        const enrollments = [enrollment({ progressPct: 80, lastActivityAt: daysAgo(1) })];
        const grades = [grade('u1', 3.5)];
        const result = identifyAtRiskStudents(enrollments, grades, { now: NOW });
        expect(result).toHaveLength(1);
        expect(result[0]?.riskLevel).toBe('MEDIO');
        expect(result[0]?.reasons.some((r) => r.includes('Promedio'))).toBe(true);
        expect(result[0]?.averageGrade).toBe(3.5);
    });

    it('escalates to ALTO when 2+ factors are present', () => {
        const enrollments = [enrollment({ progressPct: 10, lastActivityAt: daysAgo(15) })];
        const grades = [grade('u1', 2.5)];
        const result = identifyAtRiskStudents(enrollments, grades, { now: NOW });
        expect(result).toHaveLength(1);
        expect(result[0]?.riskLevel).toBe('ALTO');
        expect(result[0]?.riskScore).toBeGreaterThanOrEqual(50);
        expect(result[0]?.reasons.length).toBeGreaterThanOrEqual(2);
    });

    it('excludes students in RETIRADO or COMPLETADO state', () => {
        const enrollments = [
            enrollment({ userId: 'u1', status: 'RETIRADO', progressPct: 5 }),
            enrollment({ userId: 'u2', status: 'COMPLETADO', progressPct: 5 }),
        ];
        const result = identifyAtRiskStudents(enrollments, [], { now: NOW });
        expect(result).toEqual([]);
    });

    it('filters out invalid grades (outside 1.0–7.0)', () => {
        const enrollments = [enrollment({ progressPct: 20 })];
        const grades = [grade('u1', 0), grade('u1', 10)];
        const result = identifyAtRiskStudents(enrollments, grades, { now: NOW });
        expect(result).toHaveLength(1);
        expect(result[0]?.averageGrade).toBeNull();
    });

    it('sorts results by descending risk score', () => {
        const enrollments = [
            enrollment({ userId: 'u1', progressPct: 20 }),
            enrollment({ userId: 'u2', progressPct: 10, lastActivityAt: daysAgo(20) }),
        ];
        const result = identifyAtRiskStudents(enrollments, [], { now: NOW });
        expect(result[0]?.studentId).toBe('u2');
    });

    it('respects custom thresholds', () => {
        const enrollments = [enrollment({ progressPct: 50, lastActivityAt: daysAgo(3) })];
        const grades = [grade('u1', 4.5)];
        const resultDefault = identifyAtRiskStudents(enrollments, grades, { now: NOW });
        expect(resultDefault).toEqual([]);

        const resultStrict = identifyAtRiskStudents(enrollments, grades, {
            now: NOW,
            progressThreshold: 60,
            inactivityDays: 2,
        });
        expect(resultStrict).toHaveLength(1);
    });

    it('caps risk score at 100', () => {
        const enrollments = [enrollment({ progressPct: 0, lastActivityAt: daysAgo(90) })];
        const grades = [grade('u1', 1.0)];
        const result = identifyAtRiskStudents(enrollments, grades, { now: NOW });
        expect(result[0]?.riskScore).toBe(100);
    });

    it('handles string and Date inputs for timestamps', () => {
        const enrollments = [
            enrollment({ lastActivityAt: NOW }),
            enrollment({ userId: 'u2', lastActivityAt: new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000) }),
        ];
        const result = identifyAtRiskStudents(enrollments, [], { now: NOW });
        const u2 = result.find((r) => r.studentId === 'u2');
        expect(u2).toBeDefined();
    });
});

describe('identifyInactiveStudents', () => {
    it('returns students with no recent activity', () => {
        const progress: ProgressLike[] = [
            { userId: 'u1', lessonId: 'l1', completed: true, updatedAt: daysAgo(10) },
            { userId: 'u2', lessonId: 'l1', completed: true, updatedAt: daysAgo(2) },
        ];
        const result = identifyInactiveStudents(progress, { now: NOW, inactivityDays: 7 });
        expect(result).toHaveLength(1);
        expect(result[0]?.userId).toBe('u1');
    });

    it('returns empty when all students are active', () => {
        const progress: ProgressLike[] = [
            { userId: 'u1', lessonId: 'l1', completed: true, updatedAt: daysAgo(1) },
        ];
        const result = identifyInactiveStudents(progress, { now: NOW, inactivityDays: 7 });
        expect(result).toEqual([]);
    });

    it('sorts by descending inactivity', () => {
        const progress: ProgressLike[] = [
            { userId: 'u1', lessonId: 'l1', completed: true, updatedAt: daysAgo(10) },
            { userId: 'u2', lessonId: 'l1', completed: true, updatedAt: daysAgo(30) },
        ];
        const result = identifyInactiveStudents(progress, { now: NOW, inactivityDays: 7 });
        expect(result[0]?.userId).toBe('u2');
    });
});

describe('identifyFailingCourses', () => {
    it('computes approval rate and at-risk count', () => {
        const enrollments = [
            enrollment({ userId: 'u1' }),
            enrollment({ userId: 'u2' }),
            enrollment({ userId: 'u3' }),
        ];
        const grades = [grade('u1', 6.0), grade('u2', 3.0), grade('u3', 5.0)];
        const atRisk = [
            {
                studentId: 'u2',
                studentName: 'Alumno Test',
                studentRut: null,
                averageGrade: 3.0,
                lessonsCompleted: 0,
                lessonsTotal: 0,
                lastActivityAt: null,
                daysSinceLastActivity: null,
                riskScore: 50,
                riskLevel: 'ALTO' as const,
                reasons: [],
            },
        ];
        const result = identifyFailingCourses('c1', enrollments, grades, atRisk, 4.0);
        expect(result.totalStudents).toBe(3);
        expect(result.approvedCount).toBe(2);
        expect(result.failedCount).toBe(1);
        expect(result.approvalRate).toBeCloseTo(2 / 3);
        expect(result.atRiskCount).toBe(1);
    });

    it('returns null metrics when no grades', () => {
        const enrollments = [enrollment()];
        const result = identifyFailingCourses('c1', enrollments, [], [], 4.0);
        expect(result.averageGrade).toBeNull();
        expect(result.approvalRate).toBeNull();
    });
});
