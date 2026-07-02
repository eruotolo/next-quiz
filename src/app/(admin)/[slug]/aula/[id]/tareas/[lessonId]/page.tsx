import { requireLmsAccess } from '@/features/auth/lib/auth-guard';
import { LmsSubmissionsClient } from '@/features/lms/components/LmsSubmissionsClient';
import { prisma } from '@/shared/lib/prisma';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ slug: string; id: string; lessonId: string }>;
}

export default async function AulaTaskSubmissionsPage({ params }: PageProps) {
    const { slug, id: courseId, lessonId } = await params;
    const { institutionId } = await requireLmsAccess(slug);

    const lesson = await prisma.lmsLesson.findFirst({
        where: {
            id: lessonId,
            type: 'TAREA',
            module: { course: { id: courseId, academicInstitutionId: institutionId } },
        },
        select: {
            id: true,
            title: true,
            assignment: {
                select: {
                    id: true,
                    instructions: true,
                    dueAt: true,
                    maxScore: true,
                    submissions: {
                        orderBy: { submittedAt: { sort: 'asc', nulls: 'last' } },
                        select: {
                            id: true,
                            studentId: true,
                            fileUrl: true,
                            textContent: true,
                            status: true,
                            score: true,
                            feedback: true,
                            submittedAt: true,
                            gradedAt: true,
                            student: {
                                select: { id: true, name: true, lastname: true, rut: true },
                            },
                        },
                    },
                },
            },
        },
    });
    if (!lesson) notFound();

    const assignment = lesson.assignment;

    return (
        <main className="flex-1 overflow-auto p-8">
            <div className="mb-6">
                <p className="text-mute font-mono text-[10px] tracking-widest uppercase">Tarea</p>
                <h1 className="text-ink font-display text-3xl font-bold">{lesson.title}</h1>
                {assignment?.instructions && (
                    <p className="text-mute mt-1 text-sm leading-relaxed">
                        {assignment.instructions}
                    </p>
                )}
            </div>

            <LmsSubmissionsClient
                slug={slug}
                assignmentId={assignment?.id ?? null}
                maxScore={assignment?.maxScore ?? 100}
                submissions={
                    assignment?.submissions.map((s) => ({
                        id: s.id,
                        studentId: s.studentId,
                        studentName: `${s.student.name} ${s.student.lastname}`.trim(),
                        studentRut: s.student.rut ?? null,
                        fileUrl: s.fileUrl,
                        textContent: s.textContent,
                        status: s.status,
                        score: s.score,
                        feedback: s.feedback,
                        submittedAt: s.submittedAt,
                        gradedAt: s.gradedAt,
                    })) ?? []
                }
            />
        </main>
    );
}
