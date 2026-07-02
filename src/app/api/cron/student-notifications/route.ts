import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { NOTIFICATION_TYPE } from '@/features/lms/lib/notification-events';
import {
    notifyAssignmentDueSoon,
    notifyLmsPlanExpiring,
} from '@/features/lms/lib/notification-fanout';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LMS_WINDOW_DAYS_START = 6;
const LMS_WINDOW_DAYS_END = 8;
const ASSIGNMENT_LOOKAHEAD_HOURS_START = 12;
const ASSIGNMENT_LOOKAHEAD_HOURS_END = 30;

/**
 * Cron diario (9:00 UTC) que notifica a los estudiantes sobre dos eventos:
 *
 *  1. `LMS_PLAN_EXPIRING`: instituciones con `lmsPlanExpiresAt` entre hoy+6 y
 *     hoy+8 días. Dedupe por `dedupeKey = LMS_PLAN_EXPIRING:<institutionId>`.
 *
 *  2. `ASSIGNMENT_DUE_SOON`: tareas con `dueAt` entre hoy+12h y hoy+30h,
 *     donde el estudiante no haya entregado. Dedupe por
 *     `dedupeKey = ASSIGNMENT_DUE_SOON:<assignmentId>:<userId>`.
 *
 * Idempotencia: la columna `LmsNotification.dedupeKey` (indexada) permite
 * consultar la existencia previa en O(1) y evita duplicados entre runs.
 *
 * Protegido con `CRON_SECRET` (Vercel Cron → `Authorization: Bearer <secret>`).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    const secret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    if (!secret || authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summary = { lmsPlanExpiring: 0, assignmentDueSoon: 0, skipped: 0 };

    try {
        await runLmsPlanExpiringJob(summary);
        await runAssignmentDueSoonJob(summary);
        return NextResponse.json({ ok: true, summary });
    } catch (err) {
        console.error('[cron/student-notifications] error:', err);
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
}

async function runLmsPlanExpiringJob(summary: { lmsPlanExpiring: number; skipped: number }) {
    const now = new Date();
    const windowStart = new Date(now.getTime() + LMS_WINDOW_DAYS_START * 24 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + LMS_WINDOW_DAYS_END * 24 * 60 * 60 * 1000);

    const institutions = await prisma.academicInstitution.findMany({
        where: {
            lmsEnabled: true,
            lmsPlanExpiresAt: { gte: windowStart, lte: windowEnd },
        },
        select: { id: true, lmsPlanExpiresAt: true },
    });

    for (const inst of institutions) {
        if (!inst.lmsPlanExpiresAt) continue;
        const dedupeKey = `${NOTIFICATION_TYPE.LMS_PLAN_EXPIRING}:${inst.id}`;
        const existing = await prisma.lmsNotification.findFirst({
            where: { dedupeKey },
            select: { id: true },
        });
        if (existing) {
            summary.skipped++;
            continue;
        }

        await notifyLmsPlanExpiring({
            institutionId: inst.id,
            expiresAt: inst.lmsPlanExpiresAt,
        });
        summary.lmsPlanExpiring++;
    }
}

async function runAssignmentDueSoonJob(summary: {
    assignmentDueSoon: number;
    skipped: number;
}) {
    const now = new Date();
    const windowStart = new Date(
        now.getTime() + ASSIGNMENT_LOOKAHEAD_HOURS_START * 60 * 60 * 1000,
    );
    const windowEnd = new Date(
        now.getTime() + ASSIGNMENT_LOOKAHEAD_HOURS_END * 60 * 60 * 1000,
    );

    const submitted = await prisma.lmsSubmission.findMany({
        select: { studentId: true, assignmentId: true },
    });
    const submittedKey = new Set(submitted.map((s) => `${s.studentId}:${s.assignmentId}`));

    const dueAssignments = await prisma.lmsAssignment.findMany({
        where: {
            dueAt: { gte: windowStart, lte: windowEnd },
        },
        select: {
            id: true,
            dueAt: true,
            lesson: {
                select: {
                    title: true,
                    module: {
                        select: {
                            course: {
                                select: {
                                    id: true,
                                    title: true,
                                    enrollments: {
                                        where: { status: 'ACTIVO' },
                                        select: { userId: true },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    for (const a of dueAssignments) {
        if (!a.dueAt) continue;
        for (const enrollment of a.lesson.module.course.enrollments) {
            if (submittedKey.has(`${enrollment.userId}:${a.id}`)) continue;

            const dedupeKey = `${NOTIFICATION_TYPE.ASSIGNMENT_DUE_SOON}:${a.id}:${enrollment.userId}`;
            const existing = await prisma.lmsNotification.findFirst({
                where: { dedupeKey },
                select: { id: true },
            });
            if (existing) {
                summary.skipped++;
                continue;
            }

            await notifyAssignmentDueSoon({
                assignmentId: a.id,
                assignmentTitle: a.lesson.title,
                courseTitle: a.lesson.module.course.title,
                studentId: enrollment.userId,
                dueAt: a.dueAt,
            });
            summary.assignmentDueSoon++;
        }
    }
}
