import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { prisma } from '@/shared/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { LmsForumClient } from '@/features/lms/components/LmsForumClient';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function StudentAulaForoPage({ params }: PageProps) {
    const { id: courseId } = await params;
    const session = await getStudentAuthSession();
    if (!session) redirect('/examen/login');

    const student = await prisma.user.findUnique({
        where: { id: session.studentId },
        select: { id: true, academicInstitutionId: true },
    });
    if (!student?.academicInstitutionId) redirect('/examen/login');

    const course = await prisma.lmsCourse.findFirst({
        where: { id: courseId, academicInstitutionId: student.academicInstitutionId },
        select: {
            id: true,
            title: true,
            forums: {
                where: { archived: false },
                orderBy: { order: 'asc' },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    threads: {
                        orderBy: [{ pinned: 'desc' }, { lastPostAt: 'desc' }, { createdAt: 'desc' }],
                        select: {
                            id: true,
                            title: true,
                            pinned: true,
                            locked: true,
                            lastPostAt: true,
                            createdAt: true,
                            authorId: true,
                            author: { select: { name: true, lastname: true } },
                            _count: { select: { posts: true } },
                        },
                    },
                },
            },
        },
    });
    if (!course) notFound();

    return (
        <div>
            {/* Breadcrumb */}
            <nav className="text-mute mb-6 flex items-center gap-1.5 text-sm">
                <Link href="/aula" className="hover:text-ink">
                    Mis cursos
                </Link>
                <span>/</span>
                <Link href={`/aula/cursos/${courseId}`} className="hover:text-ink">
                    {course.title}
                </Link>
                <span>/</span>
                <span className="text-ink flex items-center gap-1">
                    <MessageSquare size={13} /> Foro
                </span>
            </nav>

            <LmsForumClient forums={course.forums} courseId={courseId} />
        </div>
    );
}
