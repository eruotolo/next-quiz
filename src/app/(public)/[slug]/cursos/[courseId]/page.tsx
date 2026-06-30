import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, ChevronLeft, GraduationCap, ListTree } from 'lucide-react';
import { prisma } from '@/shared/lib/prisma';
import { JsonLd } from '@/shared/components/seo/JsonLd';
import { courseSchema } from '@/shared/components/seo/schemas';
import { Button } from '@/shared/components/ui/button';

interface PageProps {
    params: Promise<{ slug: string; courseId: string }>;
}

function formatCLP(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
    }).format(amount);
}

async function loadPublicCourse(slug: string, courseId: string) {
    const inst = await prisma.academicInstitution.findUnique({
        where: { slug },
        select: { id: true, name: true, active: true },
    });
    if (!inst || !inst.active) return null;

    const course = await prisma.lmsCourse.findFirst({
        where: {
            id: courseId,
            academicInstitutionId: inst.id,
            isPublic: true,
            published: true,
        },
        select: {
            id: true,
            title: true,
            description: true,
            coverImageUrl: true,
            price: true,
            certificateEnabled: true,
            _count: { select: { modules: true, enrollments: true } },
            modules: {
                orderBy: { order: 'asc' },
                select: { id: true, title: true, description: true, _count: { select: { lessons: true } } },
            },
        },
    });
    if (!course) return null;
    return { inst, course };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug, courseId } = await params;
    const data = await loadPublicCourse(slug, courseId);
    if (!data) return { title: 'Curso' };
    const { inst, course } = data;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.aulika.cl';
    return {
        title: `${course.title} · ${inst.name}`,
        description: course.description ?? `Curso del Aula Virtual de ${inst.name}.`,
        alternates: { canonical: `${baseUrl}/${slug}/cursos/${courseId}` },
        openGraph: {
            title: `${course.title} · ${inst.name}`,
            description: course.description ?? undefined,
            url: `${baseUrl}/${slug}/cursos/${courseId}`,
            images: course.coverImageUrl ? [{ url: course.coverImageUrl }] : [],
            type: 'website',
        },
    };
}

export default async function PublicCourseDetailPage({ params }: PageProps) {
    const { slug, courseId } = await params;
    const data = await loadPublicCourse(slug, courseId);
    if (!data) notFound();
    const { inst, course } = data;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.aulika.cl';
    const isFree = course.price === null || course.price === 0;
    const totalLessons = course.modules.reduce((sum, m) => sum + m._count.lessons, 0);

    return (
        <main className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 sm:py-12">
            <Link
                href={`/${slug}/cursos` as `/${string}`}
                className="text-mute hover:text-ink mb-6 inline-flex items-center gap-1 text-[13px] font-medium transition-colors"
            >
                <ChevronLeft size={14} />
                Volver al catálogo
            </Link>

            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                {/* Columna principal */}
                <article>
                    {course.coverImageUrl && (
                        <div className="border-border relative aspect-[16/9] w-full overflow-hidden rounded-[18px] border">
                            <Image
                                src={course.coverImageUrl}
                                alt={course.title}
                                fill
                                sizes="(min-width: 1024px) 60vw, 100vw"
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}
                    <header className="mt-6">
                        <p className="text-mute mb-2 font-mono text-[11px] font-bold tracking-[0.1em] uppercase">
                            {inst.name}
                        </p>
                        <h1 className="text-ink font-display text-[32px] leading-[1.05] font-bold tracking-[-0.02em] sm:text-[40px]">
                            {course.title}
                        </h1>
                        {course.description && (
                            <p className="text-ink-dim mt-4 text-[16px] leading-relaxed">
                                {course.description}
                            </p>
                        )}
                    </header>

                    {/* Contenido del curso (preview) */}
                    <section className="mt-10">
                        <h2 className="text-ink mb-4 flex items-center gap-2 font-display text-[20px] font-bold">
                            <ListTree size={18} className="text-primary" />
                            Contenido del curso
                        </h2>
                        {course.modules.length === 0 ? (
                            <p className="text-mute text-[14px]">
                                El programa se publica al inicio del curso.
                            </p>
                        ) : (
                            <ol className="border-border bg-white shadow-sm">
                                {course.modules.map((m, i) => (
                                    <li
                                        key={m.id}
                                        className="border-border flex items-start gap-4 border-b p-4 last:border-b-0"
                                    >
                                        <span className="bg-primary-wash text-primary font-mono text-[12px] font-bold rounded-full size-7 shrink-0 flex items-center justify-center">
                                            {i + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-ink font-semibold text-[14px]">
                                                {m.title}
                                            </h3>
                                            {m.description && (
                                                <p className="text-ink-dim mt-1 line-clamp-2 text-[12.5px]">
                                                    {m.description}
                                                </p>
                                            )}
                                            <p className="text-mute mt-1 text-[11.5px]">
                                                {m._count.lessons} {m._count.lessons === 1 ? 'lección' : 'lecciones'}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </section>
                </article>

                {/* Sidebar: precio + CTA */}
                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <div className="border-border bg-white shadow-sm rounded-[18px] border p-6">
                        <p className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                            Precio
                        </p>
                        <p className="text-ink font-display mt-1 text-[36px] font-bold tracking-tight">
                            {isFree ? 'Gratis' : formatCLP(course.price ?? 0)}
                        </p>
                        <ul className="text-ink-dim mt-4 space-y-2 text-[13px]">
                            <li className="flex items-center gap-2">
                                <BookOpen size={14} className="text-mute" />
                                {course.modules.length}{' '}
                                {course.modules.length === 1 ? 'módulo' : 'módulos'}
                            </li>
                            <li className="flex items-center gap-2">
                                <GraduationCap size={14} className="text-mute" />
                                {totalLessons}{' '}
                                {totalLessons === 1 ? 'lección' : 'lecciones'}
                            </li>
                            {course.certificateEnabled && (
                                <li className="flex items-center gap-2">
                                    <GraduationCap size={14} className="text-mute" />
                                    Incluye certificado
                                </li>
                            )}
                        </ul>
                        <Button
                            asChild
                            variant="primary"
                            size="lg"
                            className="mt-6 w-full"
                        >
                            <Link href={`/${slug}/checkout/${course.id}` as `/${string}`}>
                                {isFree ? 'Inscribirme gratis' : 'Comprar curso'}
                            </Link>
                        </Button>
                        <p className="text-mute mt-3 text-center text-[11.5px]">
                            Pagás con MercadoPago · Acceso inmediato
                        </p>
                    </div>
                </aside>
            </div>

            <JsonLd
                data={courseSchema({
                    name: course.title,
                    description: course.description,
                    providerName: inst.name,
                    url: `${baseUrl}/${slug}/cursos/${course.id}`,
                    priceClp: course.price,
                    isFree,
                })}
            />
        </main>
    );
}
