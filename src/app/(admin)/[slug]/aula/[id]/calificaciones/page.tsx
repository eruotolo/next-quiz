import { requireLmsAccess } from '@/features/auth/lib/auth-guard';
import { LmsGradebookClient } from '@/features/lms/components/LmsGradebookClient';
import { calculateCourseFinalGrade } from '@/features/lms/lib/gradebook';
import { prisma } from '@/shared/lib/prisma';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ slug: string; id: string }>;
}

export default async function AulaCalificacionesPage({ params }: PageProps) {
    const { slug, id: courseId } = await params;
    const { institutionId } = await requireLmsAccess(slug);

    const course = await prisma.lmsCourse.findFirst({
        where: { id: courseId, academicInstitutionId: institutionId },
        select: { id: true, title: true },
    });
    if (!course) notFound();

    const [items, enrollments] = await Promise.all([
        prisma.lmsGradebookItem.findMany({
            where: { courseId },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                title: true,
                type: true,
                weight: true,
                assignmentId: true,
                examId: true,
            },
        }),
        prisma.lmsEnrollment.findMany({
            where: { courseId, status: { in: ['ACTIVO', 'COMPLETADO'] } },
            select: {
                user: { select: { id: true, name: true, lastname: true, rut: true } },
            },
            orderBy: { enrolledAt: 'asc' },
        }),
    ]);

    const grades =
        items.length > 0
            ? await prisma.lmsGrade.findMany({
                  where: { gradebookItemId: { in: items.map((i) => i.id) } },
                  select: { gradebookItemId: true, studentId: true, score: true, feedback: true },
              })
            : [];

    const gradeMap = new Map<string, Map<string, { score: number; feedback: string | null }>>();
    for (const g of grades) {
        if (!gradeMap.has(g.studentId)) gradeMap.set(g.studentId, new Map());
        gradeMap.get(g.studentId)?.set(g.gradebookItemId, { score: g.score, feedback: g.feedback });
    }

    const rows = enrollments.map((e) => {
        const studentGrades = gradeMap.get(e.user.id) ?? new Map();
        const itemScores = items.map((it) => ({
            gradebookItemId: it.id,
            score: studentGrades.get(it.id)?.score ?? null,
            feedback: studentGrades.get(it.id)?.feedback ?? null,
        }));
        const final = calculateCourseFinalGrade(
            e.user.id,
            items.map((it) => ({
                id: it.id,
                title: it.title,
                weight: it.weight,
                score: studentGrades.get(it.id)?.score ?? null,
            })),
        );
        return {
            studentId: e.user.id,
            studentName: `${e.user.name} ${e.user.lastname}`.trim(),
            studentRut: e.user.rut ?? null,
            scores: itemScores,
            average: final.average,
            passed: final.passed,
        };
    });

    return (
        <main className="flex-1 overflow-auto p-8">
            <div className="mb-6">
                <h1 className="text-ink font-display text-3xl font-bold">{course.title}</h1>
                <p className="text-mute mt-1 text-sm">Libro de calificaciones del curso</p>
            </div>

            <LmsGradebookClient slug={slug} courseId={courseId} items={items} rows={rows} />
        </main>
    );
}
