import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/features/auth/auth';
import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { prisma } from '@/shared/lib/prisma';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { computeJoinWindow } from '@/features/lms/lib/live-session-state';

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

export default async function StudentLiveSessionsListPage() {
    let userId: string | null = null;
    const [nextAuth, jose] = await Promise.all([auth(), getStudentAuthSession()]);
    if (nextAuth?.user?.id) userId = nextAuth.user.id;
    if (!userId && jose?.studentId) userId = jose.studentId;
    if (!userId) redirect('/login');

    const enrollments = await prisma.lmsEnrollment.findMany({
        where: { userId, status: 'ACTIVO' },
        select: { courseId: true },
    });

    const sessions =
        enrollments.length === 0
            ? []
            : await prisma.lmsLiveSession.findMany({
                  where: {
                      courseId: { in: enrollments.map((e) => e.courseId) },
                      status: { not: 'CANCELED' },
                  },
                  orderBy: [{ scheduledAt: 'desc' }],
                  take: 30,
                  select: {
                      id: true,
                      title: true,
                      description: true,
                      scheduledAt: true,
                      durationMin: true,
                      status: true,
                      course: { select: { id: true, title: true } },
                  },
              });

    const now = new Date();

    return (
        <div className="flex flex-col gap-4">
            <header>
                <h1 className="text-2xl font-semibold">Aulas en vivo</h1>
                <p className="text-muted-foreground text-sm">
                    Todas las clases programadas de tus cursos activos.
                </p>
            </header>

            {sessions.length === 0 ? (
                <Card className="text-muted-foreground p-8 text-center text-sm">
                    Aún no tienes clases en vivo programadas en tus cursos.
                </Card>
            ) : (
                <ul className="flex flex-col gap-3">
                    {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: legacy aula page; refactor tracked separately */}
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
                                        <p className="text-muted-foreground text-xs tracking-wide uppercase">
                                            {s.course.title}
                                        </p>
                                        <h3 className="mt-1 text-base font-medium">{s.title}</h3>
                                        {s.description ? (
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                {s.description}
                                            </p>
                                        ) : null}
                                        <div className="text-muted-foreground mt-2 flex items-center gap-3 text-xs">
                                            <span>{new Date(s.scheduledAt).toLocaleString()}</span>
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
                                                className="text-primary text-sm font-medium hover:underline"
                                            >
                                                Unirme
                                            </Link>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">
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
