import { redirect, notFound } from 'next/navigation';
import { auth } from '@/features/auth/auth';
import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { computeJoinWindow } from '@/features/lms/lib/live-session-state';
import { StudentRoomClient } from '@/features/lms/components/live/StudentRoomClient';

interface PageProps {
    params: Promise<{ sessionId: string }>;
}

export default async function StudentLiveSessionPage({ params }: PageProps) {
    const { sessionId } = await params;

    let userId: string | null = null;
    const [nextAuth, jose] = await Promise.all([auth(), getStudentAuthSession()]);
    if (nextAuth?.user?.id) {
        const role = nextAuth.user.userRoleName;
        if (role === USER_ROLE.STUDENT || role === USER_ROLE.ADMIN || role === USER_ROLE.PROFESOR) {
            userId = nextAuth.user.id;
        }
    }
    if (!userId && jose?.studentId) userId = jose.studentId;

    if (!userId) redirect('/login');

    const live = await prisma.lmsLiveSession.findUnique({
        where: { id: sessionId },
        select: {
            id: true,
            title: true,
            status: true,
            scheduledAt: true,
            durationMin: true,
            courseId: true,
            course: { select: { academicInstitutionId: true } },
        },
    });
    if (!live) notFound();

    const role = nextAuth?.user?.userRoleName ?? USER_ROLE.STUDENT;
    let canEnter = role === USER_ROLE.SUPER_ADMIN;
    if (!canEnter) {
        const instId = live.course.academicInstitutionId;
        if ((role === USER_ROLE.ADMIN || role === USER_ROLE.PROFESOR) && instId) {
            canEnter = nextAuth?.user?.academicInstitutionId === instId;
        } else if (role === USER_ROLE.STUDENT) {
            const enrollment = await prisma.lmsEnrollment.findFirst({
                where: { userId, courseId: live.courseId },
                select: { id: true, status: true },
            });
            if (enrollment && enrollment.status === 'ACTIVO') canEnter = true;
        }
    }

    const win = computeJoinWindow({
        scheduledAt: live.scheduledAt,
        durationMin: live.durationMin,
        now: new Date(),
    });
    const isLive = live.status === 'LIVE' || (win.isLive && live.status === 'SCHEDULED');

    return (
        <div className="flex flex-col gap-4 p-4">
            <header>
                <h1 className="text-xl font-semibold">{live.title}</h1>
                <p className="text-xs text-muted-foreground">Aula sincrónica</p>
            </header>
            <StudentRoomClient
                sessionId={live.id}
                sessionTitle={live.title}
                isLive={isLive}
                canEnter={canEnter}
                canChat={canEnter && role !== USER_ROLE.PROFESOR && role !== USER_ROLE.ADMIN}
                scheduledAtIso={live.scheduledAt.toISOString()}
            />
        </div>
    );
}
