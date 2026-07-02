import { cache } from 'react';
import { prisma } from '@/shared/lib/prisma';
import { calcGrade } from '@/shared/lib/grade';
import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import type { LmsNotification } from '@prisma/client';

type NotificationSelect = Pick<
    LmsNotification,
    'id' | 'type' | 'message' | 'link' | 'read' | 'createdAt' | 'updatedAt'
>;

export interface NotificationsFeed {
    notifications: NotificationSelect[];
    unreadCount: number;
}

export async function getNotificationsFeed(userId: string): Promise<NotificationsFeed> {
    const [notifications, unreadCount] = await Promise.all([
        prisma.lmsNotification.findMany({
            where: { userId, type: { not: 'BADGE_ACK' } },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
                id: true,
                type: true,
                message: true,
                link: true,
                read: true,
                createdAt: true,
                updatedAt: true,
            },
        }),
        prisma.lmsNotification.count({
            where: { userId, read: false, type: { not: 'BADGE_ACK' } },
        }),
    ]);

    return { notifications, unreadCount };
}

export interface DashboardStudentContext {
    studentId: string;
    institutionId: string;
    groupId: string;
    plan: 'FREE' | 'DOCENTE' | 'COLEGIO' | 'INSTITUCIONAL';
    hasLms: boolean;
}

export interface DashboardIdentity {
    name: string;
    lastname: string;
    institutionName: string;
    groupName: string | null;
}

export const getDashboardContext = cache(async (): Promise<DashboardStudentContext | null> => {
    const session = await getStudentAuthSession();
    if (!session) return null;

    const student = await prisma.user.findUnique({
        where: { id: session.studentId },
        select: {
            academicInstitutionId: true,
            groupId: true,
            academicInstitution: { select: { plan: true } },
        },
    });
    if (!student?.academicInstitutionId || !student.groupId) return null;
    if (!student.academicInstitution) return null;

    return {
        studentId: session.studentId,
        institutionId: student.academicInstitutionId,
        groupId: student.groupId,
        plan: student.academicInstitution.plan,
        hasLms: student.academicInstitution.plan !== 'FREE',
    };
});

export const getDashboardIdentity = cache(
    async (studentId: string): Promise<DashboardIdentity | null> => {
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            select: {
                name: true,
                lastname: true,
                academicInstitution: { select: { name: true } },
                group: { select: { name: true } },
            },
        });
        if (!student) return null;
        return {
            name: student.name,
            lastname: student.lastname,
            institutionName: student.academicInstitution?.name ?? 'Aulika',
            groupName: student.group?.name ?? null,
        };
    },
);

export const getGradeAverage = cache(
    async (studentId: string): Promise<{ average: number | null; totalExams: number }> => {
        const results = await prisma.result.findMany({
            where: { studentId },
            select: {
                score: true,
                maxScore: true,
                exam: { select: { maxGrade: true, passingGrade: true, passingPercentage: true } },
            },
        });
        if (results.length === 0) return { average: null, totalExams: 0 };

        let sum = 0;
        let count = 0;
        for (const r of results) {
            const grade = calcGrade(
                r.score,
                r.maxScore,
                r.exam.maxGrade,
                r.exam.passingGrade,
                r.exam.passingPercentage,
            );
            sum += grade;
            count += 1;
        }
        const average = count === 0 ? null : Math.round((sum / count) * 100) / 100;
        return { average, totalExams: results.length };
    },
);

export const getLmsProgressAverage = cache(
    async (studentId: string): Promise<{ average: number | null; activeCount: number }> => {
        const enrollments = await prisma.lmsEnrollment.findMany({
            where: { userId: studentId, status: 'ACTIVO' },
            select: { progressPct: true },
        });
        if (enrollments.length === 0) return { average: null, activeCount: 0 };
        const sum = enrollments.reduce((acc, e) => acc + e.progressPct, 0);
        return {
            average: Math.round(sum / enrollments.length),
            activeCount: enrollments.length,
        };
    },
);

export const getStreakInfo = cache(
    async (studentId: string): Promise<{ current: number; longest: number }> => {
        const streak = await prisma.lmsStreak.findUnique({
            where: { userId: studentId },
            select: { currentStreak: true, longestStreak: true },
        });
        return { current: streak?.currentStreak ?? 0, longest: streak?.longestStreak ?? 0 };
    },
);

export const getTotalXp = cache(async (studentId: string): Promise<number> => {
    const result = await prisma.lmsPointEvent.aggregate({
        where: { userId: studentId },
        _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
});

export interface UpcomingExam {
    id: string;
    title: string;
    scheduledAt: Date;
    closesAt: Date | null;
    urgency: 'critical' | 'warning' | 'normal';
}

export interface UpcomingAssignment {
    id: string;
    lessonId: string;
    courseId: string;
    title: string;
    courseTitle: string;
    dueAt: Date;
    urgency: 'critical' | 'warning' | 'normal';
}

export interface UpcomingFeed {
    exams: UpcomingExam[];
    assignments: UpcomingAssignment[];
    hasItems: boolean;
}

function classifyUrgency(target: Date, now: number): 'critical' | 'warning' | 'normal' {
    const diffMs = target.getTime() - now;
    if (diffMs < 24 * 60 * 60 * 1000) return 'critical';
    if (diffMs < 72 * 60 * 60 * 1000) return 'warning';
    return 'normal';
}

export const getUpcomingFeed = cache(
    async (ctx: DashboardStudentContext): Promise<UpcomingFeed> => {
        const now = Date.now();
        const upcomingExams = await prisma.exam.findMany({
            where: {
                academicInstitutionId: ctx.institutionId,
                groups: { some: { id: ctx.groupId } },
                questions: { some: {} },
                OR: [{ active: true }, { results: { some: { studentId: ctx.studentId } } }],
                results: { none: { studentId: ctx.studentId } },
            },
            select: {
                id: true,
                title: true,
                scheduledAt: true,
                closesAt: true,
            },
        });

        const exams: UpcomingExam[] = upcomingExams
            .filter((e) => {
                const opensAtMs = e.scheduledAt?.getTime() ?? null;
                const closesAtMs = e.closesAt?.getTime() ?? null;
                if (closesAtMs !== null && closesAtMs < now) return false;
                return opensAtMs === null || opensAtMs >= now;
            })
            .map((e) => ({
                id: e.id,
                title: e.title,
                scheduledAt: e.scheduledAt ?? new Date(),
                closesAt: e.closesAt,
                urgency: classifyUrgency(e.scheduledAt ?? e.closesAt ?? new Date(), now),
            }))
            .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
            .slice(0, 5);

        let assignments: UpcomingAssignment[] = [];
        if (ctx.hasLms) {
            const submissions = await prisma.lmsSubmission.findMany({
                where: { studentId: ctx.studentId },
                select: { assignmentId: true },
            });
            const submittedIds = new Set(submissions.map((s) => s.assignmentId));

            const activeEnrollments = await prisma.lmsEnrollment.findMany({
                where: { userId: ctx.studentId, status: 'ACTIVO' },
                select: { courseId: true },
            });
            const courseIds = activeEnrollments.map((e) => e.courseId);

            if (courseIds.length > 0) {
                const dueAssignments = await prisma.lmsAssignment.findMany({
                    where: {
                        dueAt: { not: null, gte: new Date() },
                        lesson: {
                            module: { courseId: { in: courseIds } },
                        },
                    },
                    select: {
                        id: true,
                        lessonId: true,
                        lesson: {
                            select: {
                                module: {
                                    select: { courseId: true, course: { select: { title: true } } },
                                },
                                title: true,
                            },
                        },
                        dueAt: true,
                    },
                    orderBy: { dueAt: 'asc' },
                    take: 5,
                });

                assignments = dueAssignments
                    .filter((a) => !submittedIds.has(a.id) && a.dueAt !== null)
                    .map((a) => {
                        const dueAt = a.dueAt as Date;
                        return {
                            id: a.id,
                            lessonId: a.lessonId,
                            courseId: a.lesson.module.courseId,
                            title: a.lesson.title,
                            courseTitle: a.lesson.module.course.title,
                            dueAt,
                            urgency: classifyUrgency(dueAt, now),
                        };
                    });
            }
        }

        return { exams, assignments, hasItems: exams.length > 0 || assignments.length > 0 };
    },
);

export interface CourseProgressCard {
    id: string;
    title: string;
    progressPct: number;
    averageGrade: number | null;
}

export const getMyCoursesCards = cache(async (studentId: string): Promise<CourseProgressCard[]> => {
    const enrollments = await prisma.lmsEnrollment.findMany({
        where: { userId: studentId, status: 'ACTIVO' },
        select: {
            progressPct: true,
            courseId: true,
            course: {
                select: { id: true, title: true, gradebookItems: { select: { id: true } } },
            },
        },
        orderBy: { enrolledAt: 'desc' },
        take: 3,
    });

    if (enrollments.length === 0) return [];

    const cards: CourseProgressCard[] = [];
    for (const enrollment of enrollments) {
        const itemIds = enrollment.course.gradebookItems.map((i) => i.id);
        const grades = itemIds.length
            ? await prisma.lmsGrade.findMany({
                  where: { studentId, gradebookItemId: { in: itemIds } },
                  select: { score: true, gradebookItem: { select: { weight: true } } },
              })
            : [];
        let weightedSum = 0;
        let totalWeight = 0;
        for (const g of grades) {
            if (g.score === null || g.score === undefined) continue;
            const w = Number(g.gradebookItem.weight);
            if (!Number.isFinite(w) || w <= 0) continue;
            const clipped = Math.min(7, Math.max(1, g.score));
            weightedSum += clipped * w;
            totalWeight += w;
        }
        const average =
            totalWeight === 0 ? null : Math.round((weightedSum / totalWeight) * 100) / 100;
        cards.push({
            id: enrollment.course.id,
            title: enrollment.course.title,
            progressPct: enrollment.progressPct,
            averageGrade: average,
        });
    }
    return cards;
});

export interface RecentGrade {
    resultId: string;
    examTitle: string;
    subject: string | null;
    completedAt: Date;
    score: number;
    maxScore: number;
    grade: number;
    passed: boolean;
}

export const getRecentGrades = cache(async (studentId: string): Promise<RecentGrade[]> => {
    const results = await prisma.result.findMany({
        where: { studentId },
        orderBy: { completedAt: 'desc' },
        take: 5,
        select: {
            id: true,
            score: true,
            maxScore: true,
            completedAt: true,
            exam: {
                select: {
                    title: true,
                    subject: true,
                    maxGrade: true,
                    passingGrade: true,
                    passingPercentage: true,
                },
            },
        },
    });

    return results.map((r) => {
        const grade = calcGrade(
            r.score,
            r.maxScore,
            r.exam.maxGrade,
            r.exam.passingGrade,
            r.exam.passingPercentage,
        );
        return {
            resultId: r.id,
            examTitle: r.exam.title,
            subject: r.exam.subject,
            completedAt: r.completedAt,
            score: r.score,
            maxScore: r.maxScore,
            grade,
            passed: grade >= r.exam.passingGrade,
        };
    });
});

export interface RecentActivity {
    id: string;
    amount: number;
    reason: string;
    sourceType: string;
    createdAt: Date;
}

export const getRecentActivity = cache(async (studentId: string): Promise<RecentActivity[]> => {
    const events = await prisma.lmsPointEvent.findMany({
        where: { userId: studentId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, amount: true, reason: true, sourceType: true, createdAt: true },
    });
    return events.map((e) => ({
        id: e.id,
        amount: e.amount,
        reason: e.reason,
        sourceType: e.sourceType,
        createdAt: e.createdAt,
    }));
});

export interface ExamHistoryRow {
    resultId: string;
    examTitle: string;
    subject: string | null;
    completedAt: Date;
    grade: number;
    passed: boolean;
}

export const getExamHistory = cache(async (studentId: string): Promise<ExamHistoryRow[]> => {
    const results = await prisma.result.findMany({
        where: { studentId },
        orderBy: { completedAt: 'desc' },
        select: {
            id: true,
            score: true,
            maxScore: true,
            completedAt: true,
            exam: {
                select: {
                    title: true,
                    subject: true,
                    maxGrade: true,
                    passingGrade: true,
                    passingPercentage: true,
                },
            },
        },
    });
    return results.map((r) => {
        const grade = calcGrade(
            r.score,
            r.maxScore,
            r.exam.maxGrade,
            r.exam.passingGrade,
            r.exam.passingPercentage,
        );
        return {
            resultId: r.id,
            examTitle: r.exam.title,
            subject: r.exam.subject,
            completedAt: r.completedAt,
            grade,
            passed: grade >= r.exam.passingGrade,
        };
    });
});

export interface LmsCourseHistory {
    courseId: string;
    title: string;
    items: Array<{ id: string; title: string; score: number | null; weight: number }>;
    average: number | null;
    passed: boolean | null;
    completedItems: number;
    totalItems: number;
}

export const getLmsCourseHistory = cache(async (studentId: string): Promise<LmsCourseHistory[]> => {
    const enrollments = await prisma.lmsEnrollment.findMany({
        where: { userId: studentId },
        select: {
            courseId: true,
            course: {
                select: {
                    id: true,
                    title: true,
                    gradebookItems: {
                        select: {
                            id: true,
                            title: true,
                            weight: true,
                            grades: {
                                where: { studentId },
                                select: { score: true },
                                take: 1,
                            },
                        },
                    },
                },
            },
        },
    });

    const history: LmsCourseHistory[] = [];
    for (const enrollment of enrollments) {
        const items = enrollment.course.gradebookItems.map((it) => ({
            id: it.id,
            title: it.title,
            weight: it.weight,
            score: it.grades[0]?.score ?? null,
        }));
        let weightedSum = 0;
        let totalWeight = 0;
        for (const it of items) {
            if (it.score === null) continue;
            const w = Number(it.weight);
            if (!Number.isFinite(w) || w <= 0) continue;
            weightedSum += Math.min(7, Math.max(1, it.score)) * w;
            totalWeight += w;
        }
        const average =
            totalWeight === 0 ? null : Math.round((weightedSum / totalWeight) * 100) / 100;
        const passed = average === null ? null : average >= 4.0;
        const completedItems = items.filter((i) => i.score !== null).length;
        history.push({
            courseId: enrollment.course.id,
            title: enrollment.course.title,
            items,
            average,
            passed,
            completedItems,
            totalItems: items.length,
        });
    }
    return history;
});

export interface CalendarEvent {
    id: string;
    kind: 'exam' | 'assignment' | 'live_session';
    title: string;
    date: Date;
    color: 'red' | 'yellow' | 'blue';
}

export const getMonthlyCalendarEvents = cache(
    async (ctx: DashboardStudentContext, year: number, month: number): Promise<CalendarEvent[]> => {
        const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
        const events: CalendarEvent[] = [];

        const examRows = await prisma.exam.findMany({
            where: {
                academicInstitutionId: ctx.institutionId,
                groups: { some: { id: ctx.groupId } },
                OR: [
                    { scheduledAt: { gte: start, lt: end } },
                    { closesAt: { gte: start, lt: end } },
                ],
                results: { none: { studentId: ctx.studentId } },
            },
            select: { id: true, title: true, scheduledAt: true, closesAt: true },
        });
        for (const e of examRows) {
            if (e.scheduledAt && e.scheduledAt >= start && e.scheduledAt < end) {
                events.push({
                    id: `exam-${e.id}`,
                    kind: 'exam',
                    title: e.title,
                    date: e.scheduledAt,
                    color: 'red',
                });
            }
            if (e.closesAt && e.closesAt >= start && e.closesAt < end) {
                events.push({
                    id: `exam-close-${e.id}`,
                    kind: 'exam',
                    title: `${e.title} (cierre)`,
                    date: e.closesAt,
                    color: 'red',
                });
            }
        }

        if (ctx.hasLms) {
            const submissionRows = await prisma.lmsSubmission.findMany({
                where: { studentId: ctx.studentId },
                select: { assignmentId: true },
            });
            const submittedSet = new Set(submissionRows.map((s) => s.assignmentId));

            const activeEnrollments = await prisma.lmsEnrollment.findMany({
                where: { userId: ctx.studentId, status: 'ACTIVO' },
                select: { courseId: true },
            });
            const courseIds = activeEnrollments.map((e) => e.courseId);

            if (courseIds.length > 0) {
                const assignments = await prisma.lmsAssignment.findMany({
                    where: {
                        dueAt: { gte: start, lt: end },
                        lesson: { module: { courseId: { in: courseIds } } },
                    },
                    select: {
                        id: true,
                        dueAt: true,
                        lesson: {
                            select: {
                                title: true,
                                module: {
                                    select: { course: { select: { title: true } } },
                                },
                            },
                        },
                    },
                });
                for (const a of assignments) {
                    if (submittedSet.has(a.id) || !a.dueAt) continue;
                    events.push({
                        id: `assign-${a.id}`,
                        kind: 'assignment',
                        title: `${a.lesson.title} (${a.lesson.module.course.title})`,
                        date: a.dueAt,
                        color: 'yellow',
                    });
                }
            }
        }

        return events.sort((a, b) => a.date.getTime() - b.date.getTime());
    },
);

// ─── Charts ──────────────────────────────────────────────────────────────────

export interface GradeTrendPoint {
    id: string;
    examTitle: string;
    grade: number;
    maxGrade: number;
    completedAt: Date;
    passed: boolean;
}

export const getRecentGradesForChart = cache(
    async (studentId: string, limit = 8): Promise<GradeTrendPoint[]> => {
        const results = await prisma.result.findMany({
            where: { studentId },
            orderBy: { completedAt: 'desc' },
            take: limit,
            select: {
                id: true,
                score: true,
                maxScore: true,
                completedAt: true,
                exam: {
                    select: {
                        title: true,
                        maxGrade: true,
                        passingGrade: true,
                        passingPercentage: true,
                    },
                },
            },
        });
        return results.map((r) => {
            const grade = calcGrade(
                r.score,
                r.maxScore,
                r.exam.maxGrade,
                r.exam.passingGrade,
                r.exam.passingPercentage,
            );
            return {
                id: r.id,
                examTitle: r.exam.title,
                grade,
                maxGrade: r.exam.maxGrade,
                completedAt: r.completedAt,
                passed: grade >= r.exam.passingGrade,
            };
        });
    },
);

export interface CourseProgressBar {
    id: string;
    courseId: string;
    title: string;
    progressPct: number;
    averageGrade: number | null;
}

export const getCourseProgressBars = cache(
    async (studentId: string, limit = 5): Promise<CourseProgressBar[]> => {
        const enrollments = await prisma.lmsEnrollment.findMany({
            where: { userId: studentId, status: 'ACTIVO' },
            select: {
                id: true,
                progressPct: true,
                course: { select: { id: true, title: true, gradebookItems: { select: { id: true } } } },
            },
            orderBy: { progressPct: 'desc' },
            take: limit,
        });

        const out: CourseProgressBar[] = [];
        for (const e of enrollments) {
            const itemIds = e.course.gradebookItems.map((g) => g.id);
            const grades = itemIds.length
                ? await prisma.lmsGrade.findMany({
                      where: { studentId, gradebookItemId: { in: itemIds } },
                      select: { score: true, gradebookItem: { select: { weight: true } } },
                  })
                : [];
            let weightedSum = 0;
            let totalWeight = 0;
            for (const g of grades) {
                if (g.score === null || g.score === undefined) continue;
                const w = Number(g.gradebookItem.weight);
                if (!Number.isFinite(w) || w <= 0) continue;
                const clipped = Math.min(7, Math.max(1, g.score));
                weightedSum += clipped * w;
                totalWeight += w;
            }
            out.push({
                id: e.id,
                courseId: e.course.id,
                title: e.course.title,
                progressPct: e.progressPct,
                averageGrade:
                    totalWeight === 0 ? null : Math.round((weightedSum / totalWeight) * 100) / 100,
            });
        }
        return out;
    },
);

export interface HeatmapCell {
    count: number;
    total: number;
}

export interface HeatmapWeek {
    weekStart: Date;
    days: HeatmapCell[];
}

export const getWeeklyActivityHeatmap = cache(
    async (studentId: string, weeks = 8): Promise<HeatmapWeek[]> => {
        const now = new Date();
        const todayUtcMidnight = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
        );
        const currentDayOfWeek = todayUtcMidnight.getUTCDay();
        const startUtc = new Date(todayUtcMidnight);
        startUtc.setUTCDate(startUtc.getUTCDate() - 7 * (weeks - 1) - currentDayOfWeek);

        const events = await prisma.lmsPointEvent.findMany({
            where: {
                userId: studentId,
                createdAt: { gte: startUtc },
            },
            select: { createdAt: true, amount: true },
        });

        const result: HeatmapWeek[] = [];
        for (let w = 0; w < weeks; w++) {
            const weekStart = new Date(startUtc);
            weekStart.setUTCDate(weekStart.getUTCDate() + w * 7);
            const days: HeatmapCell[] = [];
            for (let d = 0; d < 7; d++) {
                const dayStart = new Date(weekStart);
                dayStart.setUTCDate(dayStart.getUTCDate() + d);
                const dayEnd = new Date(dayStart);
                dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
                const dayEvents = events.filter(
                    (e) => e.createdAt >= dayStart && e.createdAt < dayEnd,
                );
                days.push({
                    count: dayEvents.length,
                    total: dayEvents.reduce((s, e) => s + e.amount, 0),
                });
            }
            result.push({ weekStart, days });
        }
        return result;
    },
);

export interface DashboardSummaryCounts {
    upcomingExams: number;
    upcomingAssignments: number;
    criticalExams: number;
    todayItems: number;
}

export const getDashboardSummaryCounts = cache(
    async (ctx: DashboardStudentContext): Promise<DashboardSummaryCounts> => {
        const now = Date.now();
        const todayEnd = new Date(now);
        todayEnd.setUTCHours(23, 59, 59, 999);
        const feed = await getUpcomingFeed(ctx);
        const exams = feed.exams;
        const assignments = feed.assignments;
        const todayItems =
            exams.filter((e) => e.scheduledAt.getTime() <= todayEnd.getTime()).length +
            assignments.filter((a) => a.dueAt.getTime() <= todayEnd.getTime()).length;
        return {
            upcomingExams: exams.length,
            upcomingAssignments: assignments.length,
            criticalExams: exams.filter((e) => e.urgency === 'critical').length,
            todayItems,
        };
    },
);
