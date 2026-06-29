import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE, type UserRoleName } from '@/shared/lib/roles';
import { auth } from '@/features/auth/auth';
import { redirect } from 'next/navigation';

export interface LmsViewerContext {
    userId: string;
    institutionId: string;
    userRole: UserRoleName;
}

export async function requireLmsViewer(institutionId: string): Promise<LmsViewerContext> {
    const session = await auth();
    if (!session?.user) redirect('/login');
    const userRole = session.user.userRoleName as UserRoleName;
    const userId = session.user.id;
    const sessionInstitutionId = session.user.academicInstitutionId;
    if (userRole === USER_ROLE.SUPER_ADMIN) {
        return { userId, institutionId, userRole };
    }
    if (sessionInstitutionId !== institutionId) {
        redirect('/login');
    }
    return { userId, institutionId: sessionInstitutionId, userRole };
}

export async function isLmsEnrolled(userId: string, courseId: string): Promise<boolean> {
    const e = await prisma.lmsEnrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: { id: true },
    });
    return !!e;
}
