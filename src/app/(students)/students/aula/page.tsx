import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { prisma } from '@/shared/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/shared/components/ui/card';
import { Award, BookOpen, CheckCircle2, Download, Lock } from 'lucide-react';
import type { EnrollmentStatus } from '@prisma/client';

export default async function StudentAulaPage() {
    const session = await getStudentAuthSession();
    if (!session) redirect('/students/examen/login');

    const student = await prisma.user.findUnique({
        where: { id: session.studentId },
        select: {
            id: true,
            groupId: true,
            academicInstitutionId: true,
        },
    });
    if (!student?.academicInstitutionId) {
        return (
            <Card className="border-border p-12 text-center">
                <p className="text-mute text-sm">No estás asignado a una institución.</p>
            </Card>
        );
    }

    const enrollments = await prisma.lmsEnrollment.findMany({
        where: { userId: student.id },
        select: {
            id: true,
            progressPct: true,
            status: true,
            course: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    coverImageUrl: true,
                    _count: { select: { modules: true } },
                },
            },
        },
    });

    const certificates = await prisma.lmsCertificate.findMany({
        where: {
            userId: student.id,
            revokedAt: null,
            courseId: { in: enrollments.map((e) => e.course.id) },
        },
        select: { courseId: true, verificationCode: true, pdfUrl: true },
    });
    const certificateByCourseId = new Map(certificates.map((c) => [c.courseId, c]));

    const allCourses = await prisma.lmsCourse.findMany({
        where: {
            academicInstitutionId: student.academicInstitutionId,
            published: true,
        },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            description: true,
            coverImageUrl: true,
            _count: { select: { modules: true } },
        },
    });

    const enrolledIds = new Set(enrollments.map((e) => e.course.id));
    const available = allCourses.filter((c) => !enrolledIds.has(c.id));

    const activeEnrollments = enrollments.filter((e) => e.status === 'ACTIVO');
    const completedEnrollments = enrollments.filter((e) => e.status === 'COMPLETADO');

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-ink font-display text-3xl font-bold">Mis cursos</h1>
                <p className="text-mute mt-1 text-sm">
                    Cursos en los que estás inscripto. Tu progreso se guarda automáticamente.
                </p>
            </div>

            {activeEnrollments.length > 0 && (
                <section>
                    <h2 className="text-ink-dim mb-3 font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                        En curso
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {activeEnrollments.map((e) => (
                            <CourseCard
                                key={e.id}
                                href={`/students/aula/cursos/${e.course.id}`}
                                title={e.course.title}
                                description={e.course.description}
                                coverImageUrl={e.course.coverImageUrl}
                                modules={e.course._count.modules}
                                progressPct={e.progressPct}
                                status={e.status}
                                certificate={certificateByCourseId.get(e.course.id) ?? null}
                                enrolled
                            />
                        ))}
                    </div>
                </section>
            )}

            {available.length > 0 && (
                <section>
                    <h2 className="text-ink-dim mb-3 font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                        Disponibles
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {available.map((c) => (
                            <CourseCard
                                key={c.id}
                                href={`/students/aula/cursos/${c.id}`}
                                title={c.title}
                                description={c.description}
                                coverImageUrl={c.coverImageUrl}
                                modules={c._count.modules}
                                enrolled={false}
                            />
                        ))}
                    </div>
                </section>
            )}

            {completedEnrollments.length > 0 && (
                <section>
                    <h2 className="text-ink-dim mb-3 font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                        Culminados
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {completedEnrollments.map((e) => (
                            <CourseCard
                                key={e.id}
                                href={`/students/aula/cursos/${e.course.id}`}
                                title={e.course.title}
                                description={e.course.description}
                                coverImageUrl={e.course.coverImageUrl}
                                modules={e.course._count.modules}
                                progressPct={e.progressPct}
                                status={e.status}
                                certificate={certificateByCourseId.get(e.course.id) ?? null}
                                enrolled
                            />
                        ))}
                    </div>
                </section>
            )}

            {enrollments.length === 0 && available.length === 0 && (
                <Card className="border-border flex flex-col items-center gap-2 p-12 text-center">
                    <BookOpen size={36} className="text-mute/20" />
                    <p className="text-ink font-display text-lg font-bold">
                        Aún no hay cursos disponibles
                    </p>
                    <p className="text-mute text-sm">
                        Tu profesor publicará los cursos del aula virtual aquí.
                    </p>
                </Card>
            )}
        </div>
    );
}

function CourseCard(props: {
    href: string;
    title: string;
    description: string | null;
    coverImageUrl: string | null;
    modules: number;
    progressPct?: number;
    status?: EnrollmentStatus;
    certificate?: { verificationCode: string; pdfUrl: string | null } | null;
    enrolled: boolean;
}) {
    const showCertificateActions = props.enrolled && props.progressPct === 100 && props.certificate;

    return (
        <Card className="border-border h-full overflow-hidden bg-white shadow-sm transition-shadow hover:shadow-md">
            <Link href={props.href}>
                {props.coverImageUrl && (
                    <div className="border-border relative aspect-[16/9] w-full overflow-hidden border-b">
                        <Image
                            src={props.coverImageUrl}
                            alt={props.title}
                            fill
                            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                            className="object-cover"
                        />
                    </div>
                )}
                <div className="flex flex-col gap-2 p-4">
                    <h3 className="text-ink font-display text-base font-bold">{props.title}</h3>
                    {props.description && (
                        <p className="text-mute line-clamp-2 text-xs">{props.description}</p>
                    )}
                    <div className="text-mute flex items-center gap-3 pt-1 text-[11px]">
                        <span className="flex items-center gap-1">
                            <BookOpen size={12} /> {props.modules} módulos
                        </span>
                        {props.enrolled && props.progressPct !== undefined && (
                            <span className="text-ink font-bold">{props.progressPct}%</span>
                        )}
                        {props.enrolled && props.status === 'COMPLETADO' && (
                            <CheckCircle2 size={12} className="text-success" />
                        )}
                        {!props.enrolled && <Lock size={12} />}
                    </div>
                    {props.enrolled && props.progressPct !== undefined && (
                        <div className="bg-paper-warm mt-1 h-1.5 w-full overflow-hidden rounded-full">
                            <div
                                className="bg-primary h-full transition-all"
                                style={{ width: `${props.progressPct}%` }}
                            />
                        </div>
                    )}
                </div>
            </Link>
            {showCertificateActions && props.certificate && (
                <div className="border-border flex flex-wrap gap-2 border-t p-4 pt-3">
                    <a
                        href={
                            props.certificate.pdfUrl ??
                            `/certificado/${props.certificate.verificationCode}/pdf`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="border-border text-ink flex items-center gap-1.5 rounded-[8px] border bg-white px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-gray-50"
                    >
                        <Download size={12} />
                        Descargar diploma
                    </a>
                    <a
                        href={`/certificado/${props.certificate.verificationCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-border text-ink flex items-center gap-1.5 rounded-[8px] border bg-white px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-gray-50"
                    >
                        <Award size={12} />
                        Ver certificado
                    </a>
                </div>
            )}
        </Card>
    );
}
