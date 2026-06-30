// ─── Fase 5: Detector puro de estudiantes en riesgo ──────────────────────────
// Lógica determinista testeable sin DB. Recibe arrays de inputs y retorna
// métricas agregadas. Usada por `actions/analytics.ts` para evitar duplicar
// cálculo y permitir tests unitarios rápidos.

export interface EnrollmentLike {
    userId: string;
    studentName: string;
    studentRut: string | null;
    status: 'ACTIVO' | 'COMPLETADO' | 'RETIRADO' | string;
    progressPct: number;
    completedAt: Date | string | null;
    lastActivityAt: Date | string | null;
}

export interface GradeLike {
    studentId: string;
    score: number;
    recordedAt: Date | string;
}

export interface ProgressLike {
    userId: string;
    lessonId: string;
    completed: boolean;
    updatedAt: Date | string;
}

export interface AtRiskStudent {
    studentId: string;
    studentName: string;
    studentRut: string | null;
    averageGrade: number | null;
    lessonsCompleted: number;
    lessonsTotal: number;
    lastActivityAt: string | null;
    daysSinceLastActivity: number | null;
    riskScore: number;
    riskLevel: 'BAJO' | 'MEDIO' | 'ALTO';
    reasons: string[];
}

export interface CourseFailingMetrics {
    courseId: string;
    totalStudents: number;
    averageGrade: number | null;
    approvedCount: number;
    failedCount: number;
    approvalRate: number | null;
    atRiskCount: number;
}

export interface AtRiskOptions {
    progressThreshold?: number;
    inactivityDays?: number;
    gradeThreshold?: number;
    now?: Date;
    weights?: {
        lowProgress?: number;
        inactivity?: number;
        lowGrade?: number;
    };
}

const DEFAULT_OPTIONS: Required<AtRiskOptions> = {
    progressThreshold: 30,
    inactivityDays: 7,
    gradeThreshold: 4.0,
    now: new Date(0),
    weights: {
        lowProgress: 40,
        inactivity: 30,
        lowGrade: 40,
    },
};

function toDate(value: Date | string | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(a: Date, b: Date): number {
    const ms = Math.abs(a.getTime() - b.getTime());
    return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function averageGrade(grades: GradeLike[]): number | null {
    const valid = grades.filter((g) => g.score >= 1 && g.score <= 7);
    if (valid.length === 0) return null;
    const sum = valid.reduce((acc, g) => acc + g.score, 0);
    return sum / valid.length;
}

function computeRiskScore(
    enrollment: EnrollmentLike,
    avg: number | null,
    options: Required<AtRiskOptions>,
): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const lowProgress = options.weights.lowProgress ?? DEFAULT_OPTIONS.weights.lowProgress!;
    const inactivity = options.weights.inactivity ?? DEFAULT_OPTIONS.weights.inactivity!;
    const lowGrade = options.weights.lowGrade ?? DEFAULT_OPTIONS.weights.lowGrade!;

    if (enrollment.progressPct < options.progressThreshold) {
        score += lowProgress;
        reasons.push(`Progreso bajo (${enrollment.progressPct}%)`);
    }

    const last = toDate(enrollment.lastActivityAt);
    if (last) {
        const days = daysBetween(options.now, last);
        if (days >= options.inactivityDays) {
            score += inactivity;
            reasons.push(`Sin actividad hace ${days} días`);
        }
    } else if (enrollment.status === 'ACTIVO') {
        score += inactivity;
        reasons.push('Sin actividad registrada');
    }

    if (avg !== null && avg < options.gradeThreshold) {
        score += lowGrade;
        reasons.push(`Promedio ${avg.toFixed(1)} (< ${options.gradeThreshold})`);
    }

    return { score: Math.min(score, 100), reasons };
}

function levelFromScore(score: number): 'BAJO' | 'MEDIO' | 'ALTO' {
    if (score >= 50) return 'ALTO';
    if (score >= 25) return 'MEDIO';
    return 'BAJO';
}

export function identifyAtRiskStudents(
    enrollments: EnrollmentLike[],
    grades: GradeLike[],
    options: AtRiskOptions = {},
): AtRiskStudent[] {
    const opts: Required<AtRiskOptions> = {
        ...DEFAULT_OPTIONS,
        ...options,
        now: options.now ?? new Date(),
        weights: { ...DEFAULT_OPTIONS.weights, ...(options.weights ?? {}) },
    };

    const gradesByUser = new Map<string, GradeLike[]>();
    for (const g of grades) {
        const arr = gradesByUser.get(g.studentId) ?? [];
        arr.push(g);
        gradesByUser.set(g.studentId, arr);
    }

    const atRisk: AtRiskStudent[] = [];
    for (const e of enrollments) {
        if (e.status === 'RETIRADO' || e.status === 'COMPLETADO') continue;

        const avg = averageGrade(gradesByUser.get(e.userId) ?? []);
        const { score, reasons } = computeRiskScore(e, avg, opts);

        if (score === 0) continue;

        const last = toDate(e.lastActivityAt);
        const days = last ? daysBetween(opts.now, last) : null;
        const userGrades = gradesByUser.get(e.userId) ?? [];

        atRisk.push({
            studentId: e.userId,
            studentName: e.studentName,
            studentRut: e.studentRut,
            averageGrade: avg,
            lessonsCompleted: userGrades.length,
            lessonsTotal: 0,
            lastActivityAt: last?.toISOString() ?? null,
            daysSinceLastActivity: days,
            riskScore: score,
            riskLevel: levelFromScore(score),
            reasons,
        });
    }

    return atRisk.sort((a, b) => b.riskScore - a.riskScore);
}

export function identifyInactiveStudents(
    progress: ProgressLike[],
    options: AtRiskOptions = {},
): { userId: string; lastActivityAt: string | null; daysSinceLastActivity: number | null }[] {
    const opts: Required<AtRiskOptions> = {
        ...DEFAULT_OPTIONS,
        ...options,
        now: options.now ?? new Date(),
        weights: { ...DEFAULT_OPTIONS.weights, ...(options.weights ?? {}) },
    };

    const lastByUser = new Map<string, Date>();
    for (const p of progress) {
        const d = toDate(p.updatedAt);
        if (!d) continue;
        const current = lastByUser.get(p.userId);
        if (!current || d > current) {
            lastByUser.set(p.userId, d);
        }
    }

    const inactive: {
        userId: string;
        lastActivityAt: string | null;
        daysSinceLastActivity: number | null;
    }[] = [];
    for (const [userId, last] of lastByUser) {
        const days = daysBetween(opts.now, last);
        if (days >= opts.inactivityDays) {
            inactive.push({
                userId,
                lastActivityAt: last.toISOString(),
                daysSinceLastActivity: days,
            });
        }
    }
    return inactive.sort((a, b) => (b.daysSinceLastActivity ?? 0) - (a.daysSinceLastActivity ?? 0));
}

export function identifyFailingCourses(
    courseId: string,
    enrollments: EnrollmentLike[],
    grades: GradeLike[],
    atRisk: AtRiskStudent[],
    gradeThreshold = 4.0,
): CourseFailingMetrics {
    const enrolledUserIds = new Set(enrollments.map((e) => e.userId));
    const gradesByUser = new Map<string, GradeLike[]>();
    for (const g of grades) {
        if (!enrolledUserIds.has(g.studentId)) continue;
        const arr = gradesByUser.get(g.studentId) ?? [];
        arr.push(g);
        gradesByUser.set(g.studentId, arr);
    }

    const studentAverages: number[] = [];
    let approved = 0;
    let failed = 0;
    for (const userId of enrolledUserIds) {
        const userGrades = gradesByUser.get(userId) ?? [];
        const avg = averageGrade(userGrades);
        if (avg === null) continue;
        studentAverages.push(avg);
        if (avg >= gradeThreshold) approved += 1;
        else failed += 1;
    }

    const courseAvg =
        studentAverages.length > 0
            ? studentAverages.reduce((a, b) => a + b, 0) / studentAverages.length
            : null;
    const approvalRate = studentAverages.length > 0 ? approved / studentAverages.length : null;

    return {
        courseId,
        totalStudents: enrolledUserIds.size,
        averageGrade: courseAvg,
        approvedCount: approved,
        failedCount: failed,
        approvalRate,
        atRiskCount: atRisk.length,
    };
}
