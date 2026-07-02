'use server';

import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { prisma } from '@/shared/lib/prisma';
import { type ActionResult, ok, fail, toActionError } from '@/shared/types/action';

export interface LmsNotificationItem {
    id: string;
    type: string;
    message: string;
    link: string | null;
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export async function markNotificationRead(notificationId: string): Promise<ActionResult<null>> {
    try {
        const session = await getStudentAuthSession();
        if (!session) return fail('No autenticado');

        await prisma.lmsNotification.updateMany({
            where: { id: notificationId, userId: session.studentId },
            data: { read: true },
        });

        return ok(null);
    } catch (err) {
        return fail(toActionError(err));
    }
}

export async function markAllNotificationsRead(): Promise<ActionResult<null>> {
    try {
        const session = await getStudentAuthSession();
        if (!session) return fail('No autenticado');

        await prisma.lmsNotification.updateMany({
            where: { userId: session.studentId, read: false },
            data: { read: true },
        });

        return ok(null);
    } catch (err) {
        return fail(toActionError(err));
    }
}

export async function deleteNotification(notificationId: string): Promise<ActionResult<null>> {
    try {
        const session = await getStudentAuthSession();
        if (!session) return fail('No autenticado');

        await prisma.lmsNotification.deleteMany({
            where: { id: notificationId, userId: session.studentId },
        });

        return ok(null);
    } catch (err) {
        return fail(toActionError(err));
    }
}
