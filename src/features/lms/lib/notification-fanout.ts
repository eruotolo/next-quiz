import { prisma } from '@/shared/lib/prisma';
import {
    NOTIFICATION_TYPE,
    formatAssignmentDueSoonMessage,
    formatCourseNewItemMessage,
    formatLmsPlanExpiringMessage,
} from '@/features/lms/lib/notification-events';

interface FanoutCourseNewItemInput {
    lessonId: string;
    lessonTitle: string;
    courseId: string;
    courseTitle: string;
    teacherUserId: string;
}

/**
 * Notifica a todos los estudiantes con inscripción activa en el curso
 * que el docente agregó una nueva lección. Fire-and-forget: el caller
 * debe invocarla como `void notifyCourseNewItem(...).catch(console.error)`.
 */
export async function notifyCourseNewItem(input: FanoutCourseNewItemInput): Promise<void> {
    try {
        const teacher = await prisma.user.findUnique({
            where: { id: input.teacherUserId },
            select: { name: true, lastname: true },
        });
        const teacherName = teacher
            ? `${teacher.name} ${teacher.lastname ?? ''}`.trim()
            : null;

        const enrollments = await prisma.lmsEnrollment.findMany({
            where: { courseId: input.courseId, status: 'ACTIVO' },
            select: { userId: true },
        });
        if (enrollments.length === 0) return;

        const message = formatCourseNewItemMessage({
            teacherName,
            lessonTitle: input.lessonTitle,
            courseTitle: input.courseTitle,
        });

        await prisma.lmsNotification.createMany({
            data: enrollments.map((e) => ({
                userId: e.userId,
                type: NOTIFICATION_TYPE.COURSE_NEW_ITEM,
                message,
                link: null,
                dedupeKey: null,
            })),
        });
    } catch (err) {
        console.error('[notifyCourseNewItem] error:', err);
    }
}

interface FanoutLmsPlanExpiringInput {
    institutionId: string;
    expiresAt: Date;
}

/**
 * Notifica a cada estudiante con inscripción activa en la institución
 * que su plan del Aula Virtual está por vencer. Fire-and-forget.
 * `dedupeKey` se setea a `<LMS_PLAN_EXPIRING>:<institutionId>` para
 * permitir deduplicación entre runs del cron.
 */
export async function notifyLmsPlanExpiring(
    input: FanoutLmsPlanExpiringInput,
): Promise<void> {
    try {
        const enrollments = await prisma.lmsEnrollment.findMany({
            where: {
                status: 'ACTIVO',
                course: { academicInstitutionId: input.institutionId },
            },
            select: { userId: true },
        });
        if (enrollments.length === 0) return;

        const message = formatLmsPlanExpiringMessage({ expiresAt: input.expiresAt });
        const dedupeKey = `${NOTIFICATION_TYPE.LMS_PLAN_EXPIRING}:${input.institutionId}`;

        await prisma.lmsNotification.createMany({
            data: enrollments.map((e) => ({
                userId: e.userId,
                type: NOTIFICATION_TYPE.LMS_PLAN_EXPIRING,
                message,
                link: null,
                dedupeKey,
            })),
        });
    } catch (err) {
        console.error('[notifyLmsPlanExpiring] error:', err);
    }
}

interface FanoutAssignmentDueSoonInput {
    assignmentId: string;
    assignmentTitle: string;
    courseTitle: string;
    studentId: string;
    dueAt: Date;
}

/**
 * Notifica a un estudiante que una tarea del LMS está por vencer.
 * `dedupeKey = ASSIGNMENT_DUE_SOON:<assignmentId>:<studentId>` evita
 * duplicados entre runs del cron.
 */
export async function notifyAssignmentDueSoon(
    input: FanoutAssignmentDueSoonInput,
): Promise<void> {
    try {
        const message = formatAssignmentDueSoonMessage({
            assignmentTitle: input.assignmentTitle,
            courseTitle: input.courseTitle,
            dueAt: input.dueAt,
        });
        const dedupeKey = `${NOTIFICATION_TYPE.ASSIGNMENT_DUE_SOON}:${input.assignmentId}:${input.studentId}`;

        await prisma.lmsNotification.create({
            data: {
                userId: input.studentId,
                type: NOTIFICATION_TYPE.ASSIGNMENT_DUE_SOON,
                message,
                link: null,
                dedupeKey,
            },
        });
    } catch (err) {
        console.error('[notifyAssignmentDueSoon] error:', err);
    }
}
