import { redirect, notFound } from 'next/navigation';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { computeJoinWindow } from '@/features/lms/lib/live-session-state';
import { LiveSessionListClient } from '@/features/lms/components/live/LiveSessionListClient';

interface PageProps {
    params: Promise<{ slug: string; courseId: string }>;
}

export default async function LiveSessionsIndexPage({ params }: PageProps) {
    const { slug, courseId } = await params;
    const access = await requireInstitutionPageAccess(slug);
    const { userId, userRole } = access;

    const course = await prisma.lmsCourse.findUnique({
        where: { id: courseId },
        select: { id: true, title: true, academicInstitutionId: true, createdById: true },
    });
    if (!course) notFound();

    const isSuperAdmin = userRole === USER_ROLE.SUPER_ADMIN;
    const isProfesor = userRole === USER_ROLE.PROFESOR;
    const isOwnerTeacher = course.createdById === userId;

    if (!isSuperAdmin) {
        if (course.academicInstitutionId !== access.institutionId) {
            redirect(`/${slug}/aula/${courseId}`);
        }
    }

    const sessions = await prisma.lmsLiveSession.findMany({
        where: { courseId },
        orderBy: [{ scheduledAt: 'desc' }],
        include: { _count: { select: { attendances: true } } },
    });

    const canStart =
        isSuperAdmin || userRole === USER_ROLE.ADMIN || (isProfesor && isOwnerTeacher);
    const canCreate = canStart;

    const now = new Date();
    const rows = sessions.map((s) => {
        const win = computeJoinWindow({
            scheduledAt: s.scheduledAt,
            durationMin: s.durationMin,
            now,
        });
        const live = s.status === 'LIVE' || (win.isLive && s.status !== 'ENDED' && s.status !== 'CANCELED');
        return {
            id: s.id,
            title: s.title,
            description: s.description,
            scheduledAt: s.scheduledAt.toISOString(),
            durationMin: s.durationMin,
            status: live && s.status === 'SCHEDULED' ? 'LIVE' as const : s.status,
            recordingStatus: s.recordingStatus,
            recordingUrl: s.recordingUrl,
            attendeeCount: s._count.attendances,
        };
    });

    return (
        <div className="flex flex-col gap-6 p-6">
            <header className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold">Aulas sincrónicas</h1>
                <p className="text-sm text-muted-foreground">
                    Sesiones en vivo del curso <strong>{course.title}</strong>.
                </p>
            </header>
            <LiveSessionListClient
                slug={slug}
                courseId={courseId}
                sessions={rows}
                canStart={canStart}
                canCreate={canCreate}
            />
        </div>
    );
}
