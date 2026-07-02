export const NOTIFICATION_TYPE = {
    LMS_PLAN_EXPIRING: 'LMS_PLAN_EXPIRING',
    COURSE_NEW_ITEM: 'COURSE_NEW_ITEM',
    ASSIGNMENT_DUE_SOON: 'ASSIGNMENT_DUE_SOON',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

const DATE_FMT = new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

const SHORT_DATE_FMT = new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'short',
});

export function formatLmsPlanExpiringMessage(args: { expiresAt: Date }): string {
    return `Tu plan del Aula Virtual vence el ${DATE_FMT.format(args.expiresAt)}.`;
}

export function formatCourseNewItemMessage(args: {
    teacherName: string | null;
    lessonTitle: string;
    courseTitle: string;
}): string {
    const teacher = (args.teacherName ?? '').trim() || 'Un docente';
    return `${teacher} agregó "${args.lessonTitle}" a ${args.courseTitle}.`;
}

export function formatAssignmentDueSoonMessage(args: {
    assignmentTitle: string;
    courseTitle: string;
    dueAt: Date;
}): string {
    return `La tarea "${args.assignmentTitle}" de ${args.courseTitle} vence el ${SHORT_DATE_FMT.format(args.dueAt)}.`;
}
