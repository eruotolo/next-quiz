import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/shared/lib/prisma';
import { getCourseLeaderboard } from '@/features/lms/actions/gamification';
import { LmsLeaderboard } from '@/features/lms/components/LmsLeaderboard';
import Link from 'next/link';
import { ArrowLeft, Trophy } from 'lucide-react';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function CourseLogrosPage({ params }: Props) {
    const { id: courseId } = await params;

    const session = await getStudentAuthSession();
    if (!session) redirect('/students/examen/login');

    const course = await prisma.lmsCourse.findUnique({
        where: { id: courseId },
        select: { id: true, title: true, academicInstitutionId: true },
    });
    if (!course) notFound();

    const enrollment = await prisma.lmsEnrollment.findUnique({
        where: { userId_courseId: { userId: session.studentId, courseId } },
        select: { id: true },
    });
    if (!enrollment) redirect('/students/aula');

    const result = await getCourseLeaderboard(courseId);

    return (
        <div className="flex flex-col gap-6">
            {/* Back */}
            <Link
                href={`/aula/cursos/${courseId}`}
                className="text-mute hover:text-ink flex items-center gap-1.5 text-sm transition-colors"
            >
                <ArrowLeft size={14} /> Volver al curso
            </Link>

            <div className="flex items-center gap-3">
                <Trophy size={28} className="text-amber-500" />
                <div>
                    <h1 className="text-ink font-display text-2xl font-bold">
                        Ranking — {course.title}
                    </h1>
                    <p className="text-mute text-sm">
                        Clasificación de estudiantes por puntos acumulados
                    </p>
                </div>
            </div>

            {result.error || !result.data ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <Trophy size={40} className="text-mute/30 mb-4" />
                    <p className="text-ink font-medium">No se pudo cargar el ranking.</p>
                    {result.error && <p className="text-mute mt-1 text-sm">{result.error}</p>}
                </div>
            ) : (
                <LmsLeaderboard courseId={courseId} data={result.data} />
            )}
        </div>
    );
}
