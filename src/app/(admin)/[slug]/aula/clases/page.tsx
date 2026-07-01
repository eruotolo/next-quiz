import { requireLmsAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { computeJoinWindow } from '@/features/lms/lib/live-session-state';
import { Card } from '@/shared/components/ui/card';
import { Radio, Clock, Users, Video } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import type { LiveSessionStatus } from '@prisma/client';

interface PageProps {
    params: Promise<{ slug: string }>;
}

const STATUS_LABEL: Record<LiveSessionStatus, string> = {
    SCHEDULED: 'Programada',
    LIVE: 'En vivo',
    ENDED: 'Finalizada',
    CANCELED: 'Cancelada',
};

const STATUS_CLASS: Record<LiveSessionStatus, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700',
    LIVE: 'bg-green-100 text-green-700',
    ENDED: 'bg-paper text-mute',
    CANCELED: 'bg-destructive/10 text-destructive',
};

function formatDate(d: Date): string {
    return new Intl.DateTimeFormat('es-CL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}

export default async function AllLiveSessionsPage({ params }: PageProps) {
    const { slug } = await params;
    const { institutionId, institutionName, userId, userRole } =
        await requireLmsAccess(slug);

    const isSuperAdmin = userRole === USER_ROLE.SUPER_ADMIN;
    const isProfesor = userRole === USER_ROLE.PROFESOR;

    // Fetch all courses of this institution (with their sessions)
    const courses = await prisma.lmsCourse.findMany({
        where: {
            academicInstitutionId: institutionId ?? undefined,
            ...(isProfesor && !isSuperAdmin ? { createdById: userId } : {}),
        },
        select: {
            id: true,
            title: true,
            liveSessions: {
                orderBy: { scheduledAt: 'asc' },
                select: {
                    id: true,
                    title: true,
                    scheduledAt: true,
                    durationMin: true,
                    status: true,
                    recordingStatus: true,
                    _count: { select: { attendances: true } },
                },
            },
        },
        orderBy: { title: 'asc' },
    });

    const now = new Date();

    // Flatten sessions with course context
    const allSessions = courses
        .flatMap((course) =>
            course.liveSessions.map((s) => {
                const win = computeJoinWindow({
                    scheduledAt: s.scheduledAt,
                    durationMin: s.durationMin,
                    now,
                });
                const displayStatus: LiveSessionStatus =
                    win.isLive && s.status === 'SCHEDULED' ? 'LIVE' : s.status;
                return {
                    ...s,
                    courseId: course.id,
                    courseTitle: course.title,
                    displayStatus,
                    isJoinable: win.isJoinable,
                    secondsUntilStart: win.secondsUntilStart,
                };
            }),
        )
        .sort((a, b) => {
            // LIVE first, then SCHEDULED by date, then the rest
            const order: Record<LiveSessionStatus, number> = {
                LIVE: 0,
                SCHEDULED: 1,
                ENDED: 2,
                CANCELED: 3,
            };
            if (order[a.displayStatus] !== order[b.displayStatus]) {
                return order[a.displayStatus] - order[b.displayStatus];
            }
            return a.scheduledAt.getTime() - b.scheduledAt.getTime();
        });

    const totalSessions = allSessions.length;
    const liveSessions = allSessions.filter((s) => s.displayStatus === 'LIVE').length;

    return (
        <main className="flex-1 overflow-auto p-8">
            {allSessions.length === 0 ? (
                <Card className="flex flex-col items-center justify-center border-dashed py-24">
                    <Radio size={40} className="text-mute/30 mb-4" />
                    <p className="text-ink text-lg font-medium">Sin clases en vivo</p>
                    <p className="text-mute mt-1 text-sm">
                        Creá sesiones desde el editor de un curso en Aula Virtual.
                    </p>
                    <Link
                        href={`/${slug}/aula`}
                        className="border-border hover:bg-paper mt-4 rounded-[8px] border bg-white px-4 py-2 text-sm font-medium transition-colors"
                    >
                        Ir a Aula Virtual
                    </Link>
                </Card>
            ) : (
                <Card className="border-border divide-border divide-y overflow-hidden shadow-sm">
                    {allSessions.map((session) => (
                        <Link
                            key={session.id}
                            href={`/${slug}/aula/${session.courseId}/clases/${session.id}`}
                            className="hover:bg-paper flex items-start gap-4 px-5 py-4 transition-colors"
                        >
                            <div
                                className={cn(
                                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                                    session.displayStatus === 'LIVE'
                                        ? 'bg-green-100 text-green-600'
                                        : session.displayStatus === 'SCHEDULED'
                                          ? 'bg-blue-100 text-blue-600'
                                          : 'bg-paper text-mute',
                                )}
                            >
                                <Radio size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-ink font-semibold">{session.title}</p>
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-0.5 text-[10px] font-medium',
                                            STATUS_CLASS[session.displayStatus],
                                        )}
                                    >
                                        {STATUS_LABEL[session.displayStatus]}
                                    </span>
                                </div>
                                <p className="text-mute mt-0.5 text-xs">{session.courseTitle}</p>
                                <div className="text-mute mt-1 flex items-center gap-3 text-xs">
                                    <span className="flex items-center gap-1">
                                        <Clock size={11} />
                                        {formatDate(session.scheduledAt)} · {session.durationMin}{' '}
                                        min
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users size={11} />
                                        {session._count.attendances}
                                    </span>
                                    {session.recordingStatus === 'READY' && (
                                        <span className="text-primary flex items-center gap-1">
                                            <Video size={11} />
                                            Grabación disponible
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </Card>
            )}
        </main>
    );
}
