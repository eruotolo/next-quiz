import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GraduationCap, Search } from 'lucide-react';
import { prisma } from '@/shared/lib/prisma';
import { PublicCourseCard } from '@/features/lms/components/PublicCourseCard';
import { JsonLd } from '@/shared/components/seo/JsonLd';
import { courseSchema } from '@/shared/components/seo/schemas';

interface PageProps {
    params: Promise<{ slug: string }>;
}

async function loadPublicCourses(slug: string) {
    const inst = await prisma.academicInstitution.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            active: true,
            seoTitle: true,
            seoDescription: true,
            seoKeywords: true,
        },
    });
    if (!inst || !inst.active) return null;

    const courses = await prisma.lmsCourse.findMany({
        where: {
            academicInstitutionId: inst.id,
            isPublic: true,
            published: true,
        },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            description: true,
            coverImageUrl: true,
            price: true,
            _count: { select: { modules: true } },
        },
    });

    return { inst, courses };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const data = await loadPublicCourses(slug);
    if (!data) return { title: 'Cursos' };
    const { inst } = data;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.aulika.cl';
    return {
        title: `Cursos · ${inst.name}`,
        description:
            inst.seoDescription ??
            `Catálogo de cursos del Aula Virtual de ${inst.name}. Compra e inscríbete en línea.`,
        keywords: inst.seoKeywords.length > 0 ? inst.seoKeywords : undefined,
        alternates: { canonical: `${baseUrl}/${slug}/cursos` },
        openGraph: {
            title: `Cursos · ${inst.name}`,
            description:
                inst.seoDescription ??
                `Catálogo de cursos del Aula Virtual de ${inst.name}.`,
            url: `${baseUrl}/${slug}/cursos`,
            type: 'website',
        },
    };
}

export default async function PublicCoursesPage({ params }: PageProps) {
    const { slug } = await params;
    const data = await loadPublicCourses(slug);
    if (!data) notFound();
    const { inst, courses } = data;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.aulika.cl';

    return (
        <main className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 sm:py-16">
            {/* Hero */}
            <section className="mb-12">
                <p className="text-mute mb-3 font-mono text-[11px] font-bold tracking-[0.1em] uppercase">
                    Aula Virtual · {inst.name}
                </p>
                <h1 className="text-ink font-display text-[36px] leading-[1.05] font-bold tracking-[-0.02em] sm:text-[48px]">
                    Cursos disponibles
                </h1>
                <p className="text-ink-dim mt-3 max-w-[640px] text-[16px] leading-relaxed">
                    Comprá un curso y accedé al aula con tu RUT. Los cursos pagos
                    incluyen certificado de aprobación.
                </p>
            </section>

            {courses.length === 0 ? (
                <div className="border-border flex flex-col items-center gap-3 rounded-[18px] border bg-white p-12 text-center">
                    <Search className="text-mute/30 size-10" strokeWidth={1.5} />
                    <p className="text-ink font-display text-lg font-bold">
                        Aún no hay cursos publicados
                    </p>
                    <p className="text-mute text-[14px]">
                        Vuelve pronto — {inst.name} está preparando nuevos cursos.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map((c) => (
                        <PublicCourseCard
                            key={c.id}
                            href={`/${slug}/cursos/${c.id}`}
                            title={c.title}
                            description={c.description}
                            coverImageUrl={c.coverImageUrl}
                            modulesCount={c._count.modules}
                            priceClp={c.price}
                            institutionName={inst.name}
                        />
                    ))}
                </div>
            )}

            {/* JSON-LD: un ItemList con cada Course como ListItem (Course) */}
            <JsonLd
                data={{
                    '@context': 'https://schema.org',
                    '@type': 'ItemList',
                    itemListElement: courses.map((c, idx) => ({
                        ...courseSchema({
                            name: c.title,
                            description: c.description,
                            providerName: inst.name,
                            url: `${baseUrl}/${slug}/cursos/${c.id}`,
                            priceClp: c.price,
                            isFree: c.price === null || c.price === 0,
                        }),
                        position: idx + 1,
                    })),
                }}
            />
        </main>
    );
}
