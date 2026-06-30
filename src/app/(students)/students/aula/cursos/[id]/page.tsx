import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { prisma } from '@/shared/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { LmsStudentView } from '@/features/lms/components/LmsStudentView';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function StudentAulaCoursePage({ params }: PageProps) {
    const { id } = await params;
    const session = await getStudentAuthSession();
    if (!session) redirect('/students/examen/login');

    const student = await prisma.user.findUnique({
        where: { id: session.studentId },
        select: { id: true, academicInstitutionId: true },
    });
    if (!student?.academicInstitutionId) redirect('/students/examen/login');

    const course = await prisma.lmsCourse.findFirst({
        where: { id, academicInstitutionId: student.academicInstitutionId },
        select: {
            id: true,
            title: true,
            description: true,
            coverImageUrl: true,
            academicInstitution: { select: { slug: true } },
            modules: {
                orderBy: { order: 'asc' },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    order: true,
                    courseId: true,
                    createdAt: true,
                    updatedAt: true,
                    lessons: {
                        orderBy: { order: 'asc' },
                        where: { type: { in: ['VIDEO', 'DOCUMENTO', 'TEXTO', 'ENLACE', 'EXAMEN'] } },
                        select: {
                            id: true,
                            title: true,
                            type: true,
                            order: true,
                            contentJson: true,
                            summaryJson: true,
                            videoAssetId: true,
                            videoUploadId: true,
                            fileUrl: true,
                            externalLink: true,
                            durationSec: true,
                            examId: true,
                            moduleId: true,
                            createdAt: true,
                            updatedAt: true,
                            progress: {
                                where: { userId: student.id },
                                select: { completed: true },
                            },
                        },
                    },
                },
            },
        },
    });
    if (!course?.academicInstitution) notFound();

    const [enrollment, certificate] = await Promise.all([
        prisma.lmsEnrollment.findUnique({
            where: { userId_courseId: { userId: student.id, courseId: id } },
            select: { progressPct: true, status: true },
        }),
        prisma.lmsCertificate.findUnique({
            where: { userId_courseId: { userId: student.id, courseId: id } },
            select: { verificationCode: true, finalGrade: true, issuedAt: true, pdfUrl: true, revokedAt: true },
        }),
    ]);

    const modules = course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        order: m.order,
        courseId: m.courseId,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            type: l.type,
            order: l.order,
            contentJson: l.contentJson,
            videoAssetId: l.videoAssetId,
            videoUploadId: l.videoUploadId,
            fileUrl: l.fileUrl,
            externalLink: l.externalLink,
            durationSec: l.durationSec,
            examId: l.examId,
            moduleId: l.moduleId,
            summaryJson: l.summaryJson,
            createdAt: l.createdAt,
            updatedAt: l.updatedAt,
            completed: l.progress[0]?.completed ?? false,
        })),
    }));

    const activeCertificate = certificate && !certificate.revokedAt ? {
        verificationCode: certificate.verificationCode,
        finalGrade: certificate.finalGrade?.toNumber() ?? null,
        issuedAt: certificate.issuedAt,
        pdfUrl: certificate.pdfUrl,
    } : null;

    return (
        <LmsStudentView
            institutionSlug={course.academicInstitution.slug}
            courseId={course.id}
            courseTitle={course.title}
            courseDescription={course.description}
            coverImageUrl={course.coverImageUrl}
            modules={modules}
            progressPct={enrollment?.progressPct ?? 0}
            enrollmentStatus={enrollment?.status ?? null}
            isEnrolled={!!enrollment}
            certificate={activeCertificate}
        />
    );
}
