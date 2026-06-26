import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import { CourseDetailClient } from '@/features/courses/components/CourseDetailClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface Props {
    params: Promise<{ slug: string; courseId: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
    const { slug, courseId } = await params;
    const { institutionId, userId, isProfesor, coordinatedProgramIds } =
        await requireInstitutionPageAccess(slug);

    const course = await prisma.courseSection.findUnique({
        where: { id: courseId },
        include: {
            program: { select: { name: true } },
            period: { select: { name: true, academicInstitutionId: true } },
            professors: { select: { id: true, name: true, lastname: true } },
            group: {
                include: {
                    users: {
                        select: { id: true, name: true, lastname: true, rut: true, email: true },
                        orderBy: { lastname: 'asc' },
                    },
                },
            },
            exams: {
                select: {
                    id: true,
                    title: true,
                    active: true,
                    scheduledAt: true,
                    closesAt: true,
                    _count: { select: { questions: true } },
                },
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    if (!course || course.period.academicInstitutionId !== institutionId) {
        notFound();
    }

    // D8 — scoping de Profesor/Jefe de Carrera: solo accede si dicta la materia o
    // si coordina su programa. Admin/SuperAdmin no tienen restricción adicional.
    if (isProfesor) {
        const isTeacher = course.professors.some((p) => p.id === userId);
        const isCoordinator =
            !!course.programId && coordinatedProgramIds.includes(course.programId);
        if (!isTeacher && !isCoordinator) notFound();
    }

    const students = (course.group?.users ?? []).map((u) => ({
        ...u,
        rut: u.rut ?? null,
    }));

    const exams = course.exams.map((e) => ({
        id: e.id,
        title: e.title,
        active: e.active,
        scheduledAt: e.scheduledAt ? e.scheduledAt.toISOString() : null,
        closesAt: e.closesAt ? e.closesAt.toISOString() : null,
        _count: e._count,
    }));

    return (
        <main className="flex-1 overflow-auto p-8">
            {/* Breadcrumb back link */}
            <Link
                href={`/${slug}/courses`}
                className="text-mute hover:text-ink mb-6 inline-flex items-center gap-1 text-sm transition-colors"
            >
                <ChevronLeft size={14} /> Materias
            </Link>

            {/* Course header */}
            <div className="mb-8">
                <h1 className="font-display text-ink text-3xl font-bold">{course.name}</h1>
                {course.code && <p className="text-mute mt-1 font-mono text-sm">{course.code}</p>}
                <div className="text-mute mt-2 flex flex-wrap gap-4 text-sm">
                    {course.program && (
                        <span>
                            <strong className="text-ink-dim">Programa:</strong>{' '}
                            {course.program.name}
                        </span>
                    )}
                    <span>
                        <strong className="text-ink-dim">Período:</strong> {course.period.name}
                    </span>
                    {course.professors.length > 0 && (
                        <span>
                            <strong className="text-ink-dim">Profesores:</strong>{' '}
                            {course.professors.map((p) => `${p.name} ${p.lastname}`).join(', ')}
                        </span>
                    )}
                </div>
            </div>

            <CourseDetailClient
                slug={slug}
                courseSectionId={course.id}
                students={students}
                exams={exams}
            />
        </main>
    );
}
