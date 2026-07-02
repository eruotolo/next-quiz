import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { prisma } from '@/shared/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { LmsLessonViewer } from '@/features/lms/components/LmsLessonViewer';

interface PageProps {
    params: Promise<{ id: string; lessonId: string }>;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: legacy aula page; refactor tracked separately
export default async function StudentAulaLessonPage({ params }: PageProps) {
    const { id: courseId, lessonId } = await params;
    const session = await getStudentAuthSession();
    if (!session) redirect('/students/examen/login');

    const student = await prisma.user.findUnique({
        where: { id: session.studentId },
        select: { id: true, academicInstitutionId: true },
    });
    if (!student?.academicInstitutionId) redirect('/students/examen/login');

    const enrollment = await prisma.lmsEnrollment.findUnique({
        where: { userId_courseId: { userId: student.id, courseId } },
        select: { id: true },
    });
    if (!enrollment) redirect(`/students/aula/cursos/${courseId}`);

    const lesson = await prisma.lmsLesson.findFirst({
        where: {
            id: lessonId,
            module: {
                courseId,
                course: { academicInstitutionId: student.academicInstitutionId },
            },
        },
        select: {
            id: true,
            title: true,
            type: true,
            contentJson: true,
            summaryJson: true,
            fileUrl: true,
            externalLink: true,
            examId: true,
            module: {
                select: {
                    id: true,
                    lessons: {
                        orderBy: { order: 'asc' },
                        select: { id: true },
                    },
                },
            },
            progress: {
                where: { userId: student.id },
                select: { completed: true },
            },
        },
    });
    if (!lesson) notFound();

    const course = await prisma.lmsCourse.findFirst({
        where: { id: courseId },
        select: { academicInstitution: { select: { slug: true } } },
    });
    const institutionSlug = course?.academicInstitution?.slug ?? null;

    const lessonIds = lesson.module.lessons.map((l) => l.id);
    const currentIndex = lessonIds.indexOf(lessonId);
    const prevLessonId = currentIndex > 0 ? (lessonIds[currentIndex - 1] ?? null) : null;
    const nextLessonId =
        currentIndex >= 0 && currentIndex < lessonIds.length - 1
            ? (lessonIds[currentIndex + 1] ?? null)
            : null;

    let assignment: {
        id: string;
        instructions: string | null;
        dueAt: Date | null;
        maxScore: number;
    } | null = null;
    let mySubmission: {
        id: string;
        textContent: string | null;
        fileUrl: string | null;
        status: string;
        score: number | null;
        feedback: string | null;
        submittedAt: Date | null;
    } | null = null;

    let examCompleted = false;
    if (lesson.type === 'EXAMEN' && lesson.examId) {
        const result = await prisma.result.findUnique({
            where: { studentId_examId: { studentId: student.id, examId: lesson.examId } },
            select: { id: true },
        });
        examCompleted = !!result;
    }

    if (lesson.type === 'TAREA') {
        const asg = await prisma.lmsAssignment.findUnique({
            where: { lessonId },
            select: { id: true, instructions: true, dueAt: true, maxScore: true },
        });
        assignment = asg ?? null;

        if (asg) {
            const sub = await prisma.lmsSubmission.findUnique({
                where: { assignmentId_studentId: { assignmentId: asg.id, studentId: student.id } },
                select: {
                    id: true,
                    textContent: true,
                    fileUrl: true,
                    status: true,
                    score: true,
                    feedback: true,
                    submittedAt: true,
                },
            });
            mySubmission = sub ?? null;
        }
    }

    return (
        <LmsLessonViewer
            institutionSlug={institutionSlug}
            courseId={courseId}
            lesson={{
                id: lesson.id,
                title: lesson.title,
                type: lesson.type,
                contentJson: lesson.contentJson,
                summaryJson: lesson.summaryJson,
                fileUrl: lesson.fileUrl,
                externalLink: lesson.externalLink,
                examId: lesson.examId,
            }}
            completed={lesson.progress[0]?.completed ?? false}
            examCompleted={examCompleted}
            nextLessonId={nextLessonId}
            prevLessonId={prevLessonId}
            assignment={assignment}
            mySubmission={mySubmission}
        />
    );
}
