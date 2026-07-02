import { requireLmsAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import { notFound } from 'next/navigation';
import { Trophy, Medal } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';

interface Props {
    params: Promise<{ slug: string; id: string }>;
}

export default async function RankingAdminPage({ params }: Props) {
    const { slug, id: courseId } = await params;
    const { institutionId, institutionName } = await requireLmsAccess(slug);

    const course = await prisma.lmsCourse.findFirst({
        where: { id: courseId, academicInstitutionId: institutionId },
        select: { title: true },
    });
    if (!course) notFound();

    // All active enrollments for this course
    const enrollments = await prisma.lmsEnrollment.findMany({
        where: { courseId, status: 'ACTIVO' },
        select: { userId: true },
    });
    const studentIds = enrollments.map((e) => e.userId);

    // Aggregate points per student (global points, not per-course)
    const aggregates = await prisma.lmsPointEvent.groupBy({
        by: ['userId'],
        where: { userId: { in: studentIds } },
        _sum: { amount: true },
    });
    const pointsByStudent = new Map<string, number>(
        aggregates.map((a) => [a.userId, a._sum.amount ?? 0]),
    );

    const users = await prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, name: true, lastname: true },
    });

    const optOuts = await prisma.lmsLeaderboardOptOut.findMany({
        where: { courseId },
        select: { userId: true },
    });
    const optedOutSet = new Set(optOuts.map((o) => o.userId));

    const entries = users
        .map((u) => ({
            userId: u.id,
            name: u.name,
            lastname: u.lastname,
            totalPoints: pointsByStudent.get(u.id) ?? 0,
            optedOut: optedOutSet.has(u.id),
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((e, idx) => ({ ...e, rank: idx + 1 }));

    return (
        <main className="flex-1 overflow-auto p-8">
            {entries.length === 0 ? (
                <Card className="flex flex-col items-center justify-center border-dashed py-24">
                    <Trophy size={40} className="text-mute/30 mb-4" />
                    <p className="text-ink text-lg font-medium">Sin estudiantes inscriptos</p>
                    <p className="text-mute mt-1 text-sm">
                        El ranking aparecerá cuando haya alumnos activos.
                    </p>
                </Card>
            ) : (
                <Card className="border-border divide-border divide-y overflow-hidden shadow-sm">
                    {entries.map((entry) => (
                        <div
                            key={entry.userId}
                            className={cn(
                                'flex items-center gap-4 px-5 py-3',
                                entry.rank === 1 && 'bg-amber-50',
                            )}
                        >
                            <div className="w-8 shrink-0 text-center">
                                {entry.rank === 1 ? (
                                    <Trophy size={18} className="mx-auto text-amber-500" />
                                ) : entry.rank === 2 ? (
                                    <Medal size={18} className="text-mute mx-auto" />
                                ) : entry.rank === 3 ? (
                                    <Medal size={18} className="mx-auto text-amber-700" />
                                ) : (
                                    <span className="text-mute font-mono text-sm">
                                        #{entry.rank}
                                    </span>
                                )}
                            </div>
                            <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold">
                                {entry.name[0]?.toUpperCase()}
                                {entry.lastname[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-ink text-sm font-semibold">
                                    {entry.name} {entry.lastname}
                                </p>
                            </div>
                            {entry.optedOut && (
                                <Badge variant="outline" className="text-[10px]">
                                    Anónimo
                                </Badge>
                            )}
                            <div className="shrink-0 text-right">
                                <p className="text-ink text-sm font-bold">{entry.totalPoints}</p>
                                <p className="text-mute text-[10px]">pts</p>
                            </div>
                        </div>
                    ))}
                </Card>
            )}
        </main>
    );
}
