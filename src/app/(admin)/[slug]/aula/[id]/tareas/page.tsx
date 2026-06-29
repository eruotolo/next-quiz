import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { ClipboardList, Clock, Users } from 'lucide-react';

interface PageProps {
    params: Promise<{ slug: string; id: string }>;
}

export default async function AulaTareasPage({ params }: PageProps) {
    const { slug, id: courseId } = await params;
    const { institutionId } = await requireInstitutionPageAccess(slug);

    const course = await prisma.lmsCourse.findFirst({
        where: { id: courseId, academicInstitutionId: institutionId },
        select: { id: true, title: true },
    });
    if (!course) notFound();

    const taskLessons = await prisma.lmsLesson.findMany({
        where: { type: 'TAREA', module: { courseId } },
        orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
        select: {
            id: true,
            title: true,
            module: { select: { title: true } },
            assignment: {
                select: {
                    id: true,
                    dueAt: true,
                    maxScore: true,
                    submissions: {
                        select: { status: true },
                    },
                },
            },
        },
    });

    return (
        <main className="flex-1 overflow-auto p-8">
            <div className="mb-6">
                <h1 className="text-ink font-display text-3xl font-bold">{course.title}</h1>
                <p className="text-mute mt-1 text-sm">Tareas y entregas de estudiantes</p>
            </div>

            {taskLessons.length === 0 ? (
                <Card className="flex flex-col items-center justify-center border-dashed py-24">
                    <ClipboardList size={40} className="text-mute/30 mb-4" />
                    <p className="text-ink text-lg font-medium">Sin tareas</p>
                    <p className="text-mute mt-1 text-sm">
                        Agrega lecciones de tipo &quot;Tarea&quot; en el editor de contenido.
                    </p>
                </Card>
            ) : (
                <div className="flex flex-col gap-3">
                    {taskLessons.map((lesson) => {
                        const asg = lesson.assignment;
                        const subs = asg?.submissions ?? [];
                        const total = subs.length;
                        const graded = subs.filter((s) => s.status === 'CALIFICADO').length;
                        const pending = subs.filter(
                            (s) => s.status === 'ENTREGADO' || s.status === 'ATRASADO',
                        ).length;

                        return (
                            <Link
                                key={lesson.id}
                                href={`/${slug}/aula/${courseId}/tareas/${lesson.id}`}
                                className="block"
                            >
                                <Card className="border-border hover:border-primary/40 hover:bg-paper bg-white p-5 shadow-sm transition-all">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-mute font-mono text-[10px] uppercase tracking-widest">
                                                {lesson.module.title}
                                            </p>
                                            <p className="text-ink mt-0.5 font-semibold">
                                                {lesson.title}
                                            </p>
                                            {asg?.dueAt && (
                                                <div className="mt-1.5 flex items-center gap-1.5">
                                                    <Clock size={12} className="text-mute" />
                                                    <span className="text-mute text-xs">
                                                        Vence{' '}
                                                        {new Date(
                                                            asg.dueAt,
                                                        ).toLocaleDateString('es-CL')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex shrink-0 items-center gap-3">
                                            {!asg ? (
                                                <Badge variant="outline">Sin configurar</Badge>
                                            ) : (
                                                <>
                                                    {pending > 0 && (
                                                        <Badge variant="secondary">
                                                            {pending} por calificar
                                                        </Badge>
                                                    )}
                                                    <div className="text-mute flex items-center gap-1 text-xs">
                                                        <Users size={12} />
                                                        <span>
                                                            {graded}/{total} calificados
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
