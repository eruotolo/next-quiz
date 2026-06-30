import { redirect, notFound } from 'next/navigation';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { computeJoinWindow } from '@/features/lms/lib/live-session-state';
import { createDailyMeetingToken } from '@/shared/lib/daily';
import { LiveSessionRoomClient } from '@/features/lms/components/live/LiveSessionRoomClient';

interface PageProps {
    params: Promise<{ slug: string; courseId: string; sessionId: string }>;
}

export default async function HostLiveSessionPage({ params }: PageProps) {
    const { slug, courseId, sessionId } = await params;
    const access = await requireInstitutionPageAccess(slug);
    const { userId, userRole } = access;

    const session = await prisma.lmsLiveSession.findUnique({
        where: { id: sessionId },
        select: {
            id: true,
            title: true,
            status: true,
            scheduledAt: true,
            durationMin: true,
            courseId: true,
            course: {
                select: { academicInstitutionId: true, createdById: true },
            },
            dailyRoomName: true,
            dailyRoomUrl: true,
            dailyRoomExpiresAt: true,
            recordingStatus: true,
        },
    });
    if (!session) notFound();
    if (session.courseId !== courseId) notFound();

    const isSuperAdmin = userRole === USER_ROLE.SUPER_ADMIN;
    const isOwnerTeacher = session.course.createdById === userId;
    const isHostOfThisCourse =
        userRole === USER_ROLE.ADMIN ||
        (userRole === USER_ROLE.PROFESOR && isOwnerTeacher);

    if (!isSuperAdmin && !isHostOfThisCourse) {
        redirect(`/${slug}/aula/${courseId}/clases`);
    }
    if (!isSuperAdmin && session.course.academicInstitutionId !== access.institutionId) {
        redirect(`/${slug}/aula/${courseId}/clases`);
    }

    const win = computeJoinWindow({
        scheduledAt: session.scheduledAt,
        durationMin: session.durationMin,
        now: new Date(),
    });
    const derivedLive =
        session.status === 'LIVE' || (win.isLive && session.status === 'SCHEDULED');
    if (!derivedLive && session.status !== 'LIVE') {
        redirect(`/${slug}/aula/${courseId}/clases`);
    }

    const tokenResult = await createDailyMeetingToken({
        roomName: session.dailyRoomName,
        userName: `${access.userEmail} (host)`,
        isOwner: true,
        expiresAt: session.dailyRoomExpiresAt,
    });

    return (
        <div className="flex flex-col gap-4 p-4">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold">{session.title}</h1>
                    <p className="text-xs text-muted-foreground">Sala del profesor</p>
                </div>
            </header>
            <LiveSessionRoomClient
                slug={slug}
                courseId={courseId}
                sessionId={sessionId}
                joinUrl={session.dailyRoomUrl}
                token={tokenResult.ok ? tokenResult.token : null}
                isHost
                isLive
                initialRecording={session.recordingStatus === 'PENDING'}
            />
        </div>
    );
}
