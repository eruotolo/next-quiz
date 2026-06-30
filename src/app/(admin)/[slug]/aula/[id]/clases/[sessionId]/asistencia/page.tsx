import { redirect, notFound } from 'next/navigation';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import {
    computeAttendanceDurationSec,
    summarizeAttendance,
} from '@/features/lms/lib/live-attendance';
import { Card } from '@/shared/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/components/ui/table';

interface PageProps {
    params: Promise<{ slug: string; id: string; sessionId: string }>;
}

export default async function AttendancePage({ params }: PageProps) {
    const { slug, id, sessionId } = await params;
    const access = await requireInstitutionPageAccess(slug);
    const { userId, userRole } = access;

    const live = await prisma.lmsLiveSession.findUnique({
        where: { id: sessionId },
        select: {
            id: true,
            title: true,
            scheduledAt: true,
            durationMin: true,
            status: true,
            courseId: true,
            course: {
                select: { academicInstitutionId: true, createdById: true, title: true },
            },
        },
    });
    if (!live) notFound();
    if (live.courseId !== id) notFound();

    const isSuperAdmin = userRole === USER_ROLE.SUPER_ADMIN;
    const isOwnerTeacher = live.course.createdById === userId;
    if (
        !isSuperAdmin &&
        !(userRole === USER_ROLE.ADMIN) &&
        !(userRole === USER_ROLE.PROFESOR && isOwnerTeacher)
    ) {
        redirect(`/${slug}/aula/${id}/clases`);
    }
    if (!isSuperAdmin && live.course.academicInstitutionId !== access.institutionId) {
        redirect(`/${slug}/aula/${id}/clases`);
    }

    const attendances = await prisma.lmsLiveAttendance.findMany({
        where: { sessionId },
        orderBy: { joinedAt: 'asc' },
        select: {
            id: true,
            userId: true,
            joinedAt: true,
            leftAt: true,
            durationSec: true,
            role: true,
            displayName: true,
        },
    });

    const userIds = Array.from(new Set(attendances.map((a) => a.userId)));
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, lastname: true, email: true, rut: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedRows = attendances.map((a) => {
        const user = userMap.get(a.userId);
        const computed = a.leftAt
            ? computeAttendanceDurationSec({
                  previousJoinedAt: a.joinedAt,
                  leftAt: a.leftAt,
              })
            : (a.durationSec ?? 0);
        return {
            ...a,
            computedDurationSec: computed,
            userName: user
                ? `${user.name ?? ''} ${user.lastname ?? ''}`.trim() || user.email
                : a.displayName,
            userRut: user?.rut ?? null,
        };
    });

    const summary = summarizeAttendance(enrichedRows, live.durationMin);

    return (
        <div className="flex flex-col gap-6 p-6">
            <header>
                <h1 className="text-2xl font-semibold">Asistencia: {live.title}</h1>
                <p className="text-muted-foreground text-sm">
                    {live.course.title} · {new Date(live.scheduledAt).toLocaleString()} ·{' '}
                    {live.durationMin} min
                </p>
            </header>

            <div className="grid grid-cols-3 gap-3">
                <Card className="p-4">
                    <p className="text-muted-foreground text-xs uppercase">Participantes únicos</p>
                    <p className="mt-1 text-2xl font-semibold">{summary.length}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-muted-foreground text-xs uppercase">Aún conectados</p>
                    <p className="mt-1 text-2xl font-semibold">
                        {summary.filter((s) => s.isPresent).length}
                    </p>
                </Card>
                <Card className="p-4">
                    <p className="text-muted-foreground text-xs uppercase">Asistencia promedio</p>
                    <p className="mt-1 text-2xl font-semibold">
                        {summary.length === 0
                            ? '—'
                            : `${(
                                  summary.reduce((acc, s) => acc + s.attendancePct, 0) /
                                  summary.length
                              ).toFixed(0)}%`}
                    </p>
                </Card>
            </div>

            <Card className="p-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>RUT</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Ingresos</TableHead>
                            <TableHead>Tiempo total</TableHead>
                            <TableHead>Asistencia</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {summary.map((row) => {
                            const original = enrichedRows.find((r) => r.userId === row.userId);
                            const user = userMap.get(row.userId);
                            return (
                                <TableRow key={row.userId}>
                                    <TableCell>
                                        {original?.userName ?? user?.email ?? row.userId}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {original?.userRut ?? '—'}
                                    </TableCell>
                                    <TableCell className="text-xs uppercase">
                                        {original?.role ?? 'STUDENT'}
                                    </TableCell>
                                    <TableCell>{row.joinCount}</TableCell>
                                    <TableCell>
                                        {Math.floor(row.totalDurationSec / 60)}m{' '}
                                        {row.totalDurationSec % 60}s
                                    </TableCell>
                                    <TableCell>{row.attendancePct}%</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
