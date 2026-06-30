'use server';

import { prisma } from '@/shared/lib/prisma';
import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { ok, fail } from '@/shared/types/action';
import type { ActionResult } from '@/shared/types/action';
import { identifyAtRiskStudents, type EnrollmentLike, type GradeLike } from '@/features/lms/lib/at-risk-detector';

export interface CourseAnalytics {
    enrollment: {
        total: number;
        active: number;
        completed: number;
        retired: number;
    };
    progress: {
        average: number;
        distribution: { range: string; count: number }[];
    };
    assignments: {
        total: number;
        submitted: number;
        graded: number;
        submissionRate: number;
    };
    grades: {
        average: number | null;
        passing: number;
        failing: number;
    };
    atRisk: AtRiskStudent[];
    completedCertificates: number;
}

export interface AtRiskStudent {
    userId: string;
    name: string;
    lastname: string;
    progressPct: number;
    lastActivity: string | null;
    daysSinceActivity: number | null;
    riskLevel: 'BAJO' | 'MEDIO' | 'ALTO';
    reasons: string[];
    averageGrade: number | null;
}

export async function getCourseAnalytics(
    slug: string,
    courseId: string,
): Promise<ActionResult<CourseAnalytics>> {
    try {
        const ctx = await requireInstitutionAccess(slug);

        const course = await prisma.lmsCourse.findFirst({
            where: { id: courseId, academicInstitutionId: ctx.institutionId },
            select: { id: true },
        });
        if (!course) return fail('Curso no encontrado.');

        const [enrollments, assignments, grades, certificates] = await Promise.all([
            prisma.lmsEnrollment.findMany({
                where: { courseId },
                select: {
                    userId: true,
                    status: true,
                    progressPct: true,
                    completedAt: true,
                    user: { select: { name: true, lastname: true } },
                },
            }),
            prisma.lmsAssignment.findMany({
                where: { lesson: { module: { courseId } } },
                select: {
                    id: true,
                    submissions: { select: { status: true, studentId: true } },
                },
            }),
            prisma.lmsGrade.findMany({
                where: { gradebookItem: { courseId } },
                select: { score: true, studentId: true },
            }),
            prisma.lmsCertificate.count({
                where: { courseId, revokedAt: null },
            }),
        ]);

        const enrollmentStats = {
            total: enrollments.length,
            active: enrollments.filter((e) => e.status === 'ACTIVO').length,
            completed: enrollments.filter((e) => e.status === 'COMPLETADO').length,
            retired: enrollments.filter((e) => e.status === 'RETIRADO').length,
        };

        const progressValues = enrollments.map((e) => e.progressPct);
        const avgProgress =
            progressValues.length > 0
                ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
                : 0;

        const distribution = [
            { range: '0–25%', count: progressValues.filter((p) => p <= 25).length },
            { range: '26–50%', count: progressValues.filter((p) => p > 25 && p <= 50).length },
            { range: '51–75%', count: progressValues.filter((p) => p > 50 && p <= 75).length },
            { range: '76–100%', count: progressValues.filter((p) => p > 75).length },
        ];

        const enrolledUserIds = new Set(enrollments.map((e) => e.userId));
        const totalAssignmentSlots = assignments.reduce(
            (acc, a) => acc + enrolledUserIds.size,
            0,
        );
        const submittedCount = assignments.reduce(
            (acc, a) =>
                acc + a.submissions.filter((s) => s.status !== 'PENDIENTE').length,
            0,
        );
        const gradedCount = assignments.reduce(
            (acc, a) => acc + a.submissions.filter((s) => s.status === 'CALIFICADO').length,
            0,
        );
        const submissionRate =
            totalAssignmentSlots > 0
                ? Math.round((submittedCount / totalAssignmentSlots) * 100)
                : 0;

        const validGrades = grades.map((g) => Number(g.score)).filter((s) => s >= 1 && s <= 7);
        const avgGrade =
            validGrades.length > 0
                ? Math.round((validGrades.reduce((a, b) => a + b, 0) / validGrades.length) * 10) / 10
                : null;
        const passing = validGrades.filter((g) => g >= 4).length;
        const failing = validGrades.filter((g) => g < 4).length;

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentProgress = await prisma.lmsLessonProgress.findMany({
            where: {
                lesson: { module: { courseId } },
            },
            select: { userId: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
        });

        const lastActivityMap = new Map<string, Date>();
        for (const p of recentProgress) {
            if (!lastActivityMap.has(p.userId) || p.updatedAt > lastActivityMap.get(p.userId)!) {
                lastActivityMap.set(p.userId, p.updatedAt);
            }
        }

        const now = new Date();
        const enrollmentInputs: EnrollmentLike[] = enrollments.map((e) => ({
            userId: e.userId,
            studentName: `${e.user.name} ${e.user.lastname}`.trim(),
            studentRut: null,
            status: e.status,
            progressPct: e.progressPct,
            completedAt: e.completedAt,
            lastActivityAt: lastActivityMap.get(e.userId) ?? null,
        }));
        const enrollmentByUser = new Map(enrollments.map((e) => [e.userId, e]));
        const gradeInputs: GradeLike[] = grades.map((g) => ({
            studentId: g.studentId,
            score: Number(g.score),
            recordedAt: sevenDaysAgo,
        }));

        const detected = identifyAtRiskStudents(enrollmentInputs, gradeInputs, { now });
        const atRisk: AtRiskStudent[] = detected.map((d) => {
            const source = enrollmentByUser.get(d.studentId);
            return {
                userId: d.studentId,
                name: source?.user.name ?? d.studentName,
                lastname: source?.user.lastname ?? '',
                progressPct: source?.progressPct ?? 0,
                lastActivity: d.lastActivityAt,
                daysSinceActivity: d.daysSinceLastActivity,
                riskLevel: d.riskLevel,
                reasons: d.reasons,
                averageGrade: d.averageGrade,
            };
        });

        return ok({
            enrollment: enrollmentStats,
            progress: { average: avgProgress, distribution },
            assignments: {
                total: assignments.length,
                submitted: submittedCount,
                graded: gradedCount,
                submissionRate,
            },
            grades: { average: avgGrade, passing, failing },
            atRisk,
            completedCertificates: certificates,
        });
    } catch {
        return fail('Error al cargar las analíticas.');
    }
}
