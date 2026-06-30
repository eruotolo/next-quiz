import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/features/auth/auth';
import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { prisma } from '@/shared/lib/prisma';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { computeJoinWindow } from '@/features/lms/lib/live-session-state';

interface PageProps {
    params: Promise<{ courseId: string }>;
}

const STATUS_LABEL: Record<string, string> = {
    SCHEDULED: 'Programada',
    LIVE: 'En vivo',
    ENDED: 'Finalizada',
    CANCELED: 'Cancelada',
};

const STATUS_VARIANT: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
    SCHEDULED: 'outline',
    LIVE: 'default',
    ENDED: 'secondary',
    CANCELED: 'destructive',
};

export default async function StudentLiveCoursePage({ params }: PageProps) {
    const { courseId } = await params;

    let userId: string | null = null;
    const [nextAuth, jose] = await Promise.all([auth(), getStudentAuthSession()]);
    if (nextAuth?.user?.id) userId = nextAuth.user.id;
    if (!userId && jose?.studentId) userId = jose.studentId;
    if (!userId) redirect('/login');

    const course = await prisma.lmsCourse.findUnique({
        where: { id: courseId },
        select: { id: true, title: true },
    });
    if (!course) notFound();

    const enrollment = await prisma.lmsEnrollment.findFirst({
        where: { userId, courseId },
        select: { status: true },
    });
    if (!enrollment || enrollment.status !== 'ACTIVO') {
        redirect('/aula');
    }

    const sessions = await prisma.lmsLiveSession.findMany({
        where: { courseId, status: { not: 'CANCELED' } },
        orderBy: [{ scheduledAt: 'desc' }],
        take: 20,
        select: {
            id: true,
            title: true,
            description: true,
            scheduledAt: true,
            durationMin: true,
            status: true,
        },
    });

    const now = new Date();
    return (
        <div className="flex flex-col gap-4">
            <header>
                <h1 className="text-2xl font-semibold">Aulas en vivo</h1>
                <p className="text-sm text-muted-foreground">
                    Curso: <strong>{course.title}</strong>
                </p>
            </header>
            {sessions.length === 0 ? (
                <Card className="p-8 text-center text-sm text-muted-foreground">
                    Aún no hay clases en vivo programadas.
                </Card>
            ) : (
                <ul className="flex flex-col gap-3">
                    {sessions.map((s) => {
                        const win = computeJoinWindow({
                            scheduledAt: s.scheduledAt,
                            durationMin: s.durationMin,
                            now,
                        });
                        const isLive =
                            s.status === 'LIVE' || (win.isLive && s.status === 'SCHEDULED');
                        const label = isLive && s.status === 'SCHEDULED' ? 'LIVE' : s.status;
                        const joinable = win.isJoinable || s.status === 'LIVE';
                        return (
                            <li key={s.id}>
                                <Card className="flex items-start justify-between gap-3 p-4">
                                    <div>
                                        <h3 className="text-base font-medium">{s.title}</h3>
                                        {s.description ? (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {s.description}
                                            </p>
                                        ) : null}
                                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>
                                                {new Date(s.scheduledAt).toLocaleString()}
                                            </span>
                                            <span>· {s.durationMin} min</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge variant={STATUS_VARIANT[label] ?? 'outline'}>
                                            {STATUS_LABEL[label] ?? label}
                                        </Badge>
                                        {joinable ? (
                                            <Link
                                                href={`/aula/clases/${s.id}` as `/${string}`}
                                                className="text-sm font-medium text-primary hover:underline"
                                            >
                                                Unirme
                                            </Link>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                {win.secondsUntilStart > 0
                                                    ? `Abre en ${Math.max(
                                                          1,
                                                          Math.floor(win.secondsUntilStart / 60),
                                                      )} min`
                                                    : 'Cerrada'}
                                            </span>
                                        )}
                                    </div>
                                </Card>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
