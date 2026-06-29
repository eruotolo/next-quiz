'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, CheckCircle2, PlayCircle, FileText, Link2, ClipboardList, Radio, Lock, Award } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import type { LmsLesson, LmsModule, LessonType, EnrollmentStatus } from '@prisma/client';
import { useTransition } from 'react';
import { enrollInCourse } from '@/features/lms/actions/progress';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Lesson extends LmsLesson {
    completed: boolean;
}

interface Module extends LmsModule {
    lessons: Lesson[];
}

interface Certificate {
    verificationCode: string;
    finalGrade: number | null;
    issuedAt: Date;
    pdfUrl: string | null;
}

interface Props {
    institutionSlug: string;
    courseId: string;
    courseTitle: string;
    courseDescription: string | null;
    coverImageUrl: string | null;
    modules: Module[];
    progressPct: number;
    enrollmentStatus: EnrollmentStatus | null;
    isEnrolled: boolean;
    certificate?: Certificate | null;
}

const LESSON_ICON: Record<LessonType, React.ComponentType<{ size?: number }>> = {
    VIDEO: PlayCircle,
    DOCUMENTO: FileText,
    TEXTO: BookOpen,
    ENLACE: Link2,
    EXAMEN: ClipboardList,
    TAREA: ClipboardList,
    EN_VIVO: Radio,
};

export function LmsStudentView({
    institutionSlug,
    courseId,
    courseTitle,
    courseDescription,
    coverImageUrl,
    modules,
    progressPct,
    enrollmentStatus,
    isEnrolled,
    certificate = null,
}: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const completedLessons = modules.reduce(
        (acc, m) => acc + m.lessons.filter((l) => l.completed).length,
        0,
    );

    const handleEnroll = () => {
        startTransition(async () => {
            const result = await enrollInCourse(institutionSlug, courseId);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Inscripción exitosa');
            router.refresh();
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <Card className="border-border overflow-hidden bg-white shadow-sm">
                {coverImageUrl && (
                    <div className="border-border relative aspect-[3/1] w-full overflow-hidden border-b">
                        <Image
                            src={coverImageUrl}
                            alt={courseTitle}
                            fill
                            sizes="(min-width: 1024px) 60vw, 100vw"
                            className="object-cover"
                        />
                    </div>
                )}
                <div className="flex flex-col gap-3 p-6">
                    <h1 className="text-ink font-display text-3xl font-bold">{courseTitle}</h1>
                    {courseDescription && (
                        <p className="text-mute text-sm leading-relaxed">{courseDescription}</p>
                    )}
                    <div className="text-mute flex items-center gap-4 pt-2 text-xs">
                        <span>
                            {totalLessons} {totalLessons === 1 ? 'lección' : 'lecciones'}
                        </span>
                        <span>·</span>
                        <span>{modules.length} módulos</span>
                        {isEnrolled && (
                            <>
                                <span>·</span>
                                <span className="text-ink font-bold">
                                    {progressPct}% completado
                                </span>
                            </>
                        )}
                    </div>
                    {isEnrolled ? (
                        <div className="pt-2">
                            <div className="bg-paper-warm h-2 w-full overflow-hidden rounded-full">
                                <div
                                    className="bg-primary h-full transition-all"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                            {enrollmentStatus === 'COMPLETADO' && (
                                <p className="text-success mt-2 text-xs font-bold">
                                    ¡Curso completado! ({completedLessons}/{totalLessons})
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="pt-2">
                            <Button
                                variant="primary"
                                size="md"
                                onClick={handleEnroll}
                                disabled={isPending}
                            >
                                Inscribirme
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {certificate && (
                <Card className="border-amber-200 bg-amber-50 p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                            <Award size={20} className="text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-amber-900 font-display text-base font-bold">
                                ¡Certificado obtenido!
                            </p>
                            <p className="text-amber-800 mt-0.5 text-sm">
                                {certificate.finalGrade !== null
                                    ? `Nota final: ${certificate.finalGrade.toFixed(1)}`
                                    : 'Curso aprobado'}
                                {' · '}
                                Emitido el{' '}
                                {new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' }).format(
                                    new Date(certificate.issuedAt),
                                )}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <a
                                    href={`/certificado/${certificate.verificationCode}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-amber-900 border-amber-300 hover:bg-amber-100 rounded-[8px] border bg-white px-3 py-1.5 text-xs font-medium transition-colors"
                                >
                                    Ver certificado
                                </a>
                                {certificate.pdfUrl && (
                                    <a
                                        href={certificate.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-amber-900 border-amber-300 hover:bg-amber-100 rounded-[8px] border bg-white px-3 py-1.5 text-xs font-medium transition-colors"
                                    >
                                        Descargar PDF
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            <div className="flex flex-col gap-4">
                {modules.length === 0 ? (
                    <Card className="border-border p-12 text-center">
                        <p className="text-mute text-sm">
                            Este curso aún no tiene contenido publicado.
                        </p>
                    </Card>
                ) : (
                    modules.map((m) => (
                        <Card key={m.id} className="border-border p-5 shadow-sm">
                            <div className="mb-3 flex items-baseline justify-between">
                                <h2 className="text-ink font-display text-lg font-bold">{m.title}</h2>
                                <span className="text-mute font-mono text-[10px] tracking-wider uppercase">
                                    Módulo
                                </span>
                            </div>
                            {m.description && (
                                <p className="text-mute mb-3 text-sm">{m.description}</p>
                            )}
                            {m.lessons.length === 0 ? (
                                <p className="text-mute py-2 text-xs italic">Sin lecciones publicadas.</p>
                            ) : (
                                <ul className="flex flex-col gap-1">
                                    {m.lessons.map((l) => {
                                        const Icon = LESSON_ICON[l.type];
                                        const locked = !isEnrolled;
                                        return (
                                            <li key={l.id}>
                                                <Link
                                                    href={
                                                        locked
                                                            ? '#'
                                                            : `/aula/cursos/${courseId}/leccion/${l.id}`
                                                    }
                                                    aria-disabled={locked}
                                                    className={cn(
                                                        'border-border flex items-center gap-3 rounded-[10px] border bg-white px-4 py-3 transition-colors',
                                                        locked
                                                            ? 'cursor-not-allowed opacity-60'
                                                            : 'hover:bg-paper-warm',
                                                    )}
                                                >
                                                    <Icon size={18} />
                                                    <span className="text-ink flex-1 text-sm font-medium">
                                                        {l.title}
                                                    </span>
                                                    {l.completed ? (
                                                        <CheckCircle2
                                                            size={18}
                                                            className="text-success"
                                                        />
                                                    ) : locked ? (
                                                        <Lock size={14} className="text-mute" />
                                                    ) : null}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
