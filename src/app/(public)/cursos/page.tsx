import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, BookOpen, GraduationCap, Layers, Search } from 'lucide-react';
import { prisma } from '@/shared/lib/prisma';
import { PublicCourseCard } from '@/features/lms/components/PublicCourseCard';
import { CategoryFilter } from '@/features/lms/components/CategoryFilter';
import { JsonLd } from '@/shared/components/seo/JsonLd';
import { courseSchema } from '@/shared/components/seo/schemas';
import { Button } from '@/shared/components/ui/button';
import { Tag } from '@/shared/components/ui/badge';
import { getB2cVendorInstitution } from '@/features/lms/lib/aulika-online-bundle';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.aulika.cl';

interface PageProps {
    searchParams: Promise<{ category?: string }>;
}

function formatCLP(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
    }).format(amount);
}

async function loadPublicCatalog() {
    const inst = await getB2cVendorInstitution();
    if (!inst?.active) return null;

    const [courses, categories] = await Promise.all([
        prisma.lmsCourse.findMany({
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
                categories: {
                    select: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.lmsCategory.findMany({
            where: {
                academicInstitutionId: inst.id,
                isPublic: true,
            },
            orderBy: [{ order: 'asc' }, { name: 'asc' }],
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                isBundle: true,
                bundlePrice: true,
                _count: { select: { courses: true } },
            },
        }),
    ]);

    const featuredBundle = categories.find((c) => c.isBundle && c.bundlePrice !== null);
    let bundleCourseTitles: string[] = [];
    if (featuredBundle) {
        const bundleCourses = await prisma.lmsCourseCategory.findMany({
            where: { categoryId: featuredBundle.id },
            select: { course: { select: { title: true } } },
        });
        bundleCourseTitles = bundleCourses.map((bc) => bc.course.title);
    }

    return { inst, courses, categories, bundleCourseTitles };
}

export async function generateMetadata(): Promise<Metadata> {
    const data = await loadPublicCatalog();
    if (!data) {
        return {
            title: 'Cursos · Aulika',
            description: 'Catálogo de cursos del Aula Virtual de Aulika.',
        };
    }
    const { inst } = data;
    return {
        title: `Cursos · ${inst.name}`,
        description: `Catálogo de cursos del Aula Virtual de ${inst.name}. Compra e inscríbete en línea.`,
        alternates: { canonical: `${BASE_URL}/cursos` },
        openGraph: {
            title: `Cursos · ${inst.name}`,
            description: `Catálogo de cursos del Aula Virtual de ${inst.name}.`,
            url: `${BASE_URL}/cursos`,
            type: 'website',
        },
    };
}

export default async function PublicCoursesPage({ searchParams }: PageProps) {
    const sp = await searchParams;
    const data = await loadPublicCatalog();
    if (!data) {
        notFound();
    }
    const { inst, courses, categories, bundleCourseTitles } = data;

    const featuredBundle = categories.find((c) => c.isBundle && c.bundlePrice !== null);

    const activeCategorySlug = sp.category ?? null;
    const filteredCourses = activeCategorySlug
        ? courses.filter((c) => c.categories.some((cc) => cc.category.slug === activeCategorySlug))
        : courses;

    const coursesLd = courses.map((c, idx) => ({
        ...courseSchema({
            name: c.title,
            description: c.description,
            providerName: inst.name,
            url: `${BASE_URL}/cursos`,
            priceClp: c.price,
            isFree: c.price === null || c.price === 0,
        }),
        position: idx + 1,
    }));

    return (
        <main
            className="min-h-screen px-5 py-12 sm:px-8 sm:py-16"
            style={{ backgroundColor: '#FAFAF7' }}
        >
            <div className="mx-auto max-w-[1200px]">
                <header className="mb-12">
                    <p className="text-mute mb-2 font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
                        Aula Virtual · {inst.name}
                    </p>
                    <h1 className="text-ink font-display text-[36px] leading-[1.05] font-bold tracking-[-0.02em] sm:text-[48px]">
                        Cursos disponibles
                    </h1>
                </header>

                {featuredBundle && featuredBundle.bundlePrice !== null && (
                    <section className="mb-12">
                        <div
                            className="bg-ink relative overflow-hidden rounded-[28px] px-8 py-12 lg:px-14 lg:py-16"
                            style={{
                                backgroundImage:
                                    'radial-gradient(circle at 85% 15%, rgba(214,255,31,0.18) 0%, transparent 55%), radial-gradient(circle at 5% 85%, rgba(31,46,255,0.35) 0%, transparent 55%)',
                            }}
                        >
                            <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                                <div>
                                    <Tag tone="lime" size="sm" className="mb-4 font-bold">
                                        <GraduationCap size={12} className="mr-1" />
                                        PACK COMPLETO
                                    </Tag>
                                    <h2 className="font-display text-[28px] leading-[1.05] font-bold tracking-[-0.02em] text-white sm:text-[36px]">
                                        {featuredBundle.name}
                                    </h2>
                                    <p className="mt-3 max-w-[520px] text-[14.5px] leading-relaxed text-white/70">
                                        {featuredBundle.description ??
                                            `Acceso anual a los ${featuredBundle._count.courses} cursos del pack. Ahorra vs. compra individual.`}
                                    </p>
                                    <div className="mt-6">
                                        <Button
                                            asChild
                                            variant="lime"
                                            size="lg"
                                            className="h-14 px-8 text-[16px] font-bold"
                                        >
                                            <Link
                                                href={
                                                    `/checkout/category/${featuredBundle.id}` as `/${string}`
                                                }
                                            >
                                                Comprar pack completo
                                                <ArrowRight className="ml-2 size-5" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                                <div className="relative rounded-[20px] bg-white p-6 shadow-xl">
                                    <div className="flex items-center gap-2">
                                        <Layers size={16} className="text-primary" />
                                        <span className="text-ink text-[13px] font-bold">
                                            Asignaturas incluidas
                                        </span>
                                    </div>
                                    <ul className="mt-4 flex flex-col gap-2.5">
                                        {bundleCourseTitles.map((title) => (
                                            <li
                                                key={title}
                                                className="text-ink-dim flex items-center gap-2.5 text-[13.5px]"
                                            >
                                                <BookOpen
                                                    size={13}
                                                    className="text-mute shrink-0 opacity-70"
                                                />
                                                {title}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="border-border mt-5 flex items-center justify-between border-t pt-4">
                                        <span className="text-mute text-[11.5px] font-medium">
                                            Pack Completo · todas las áreas
                                        </span>
                                        <span className="text-ink font-display text-[15px] font-bold">
                                            {formatCLP(featuredBundle.bundlePrice)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                <section>
                    {categories.length > 0 && (
                        <div className="mb-6">
                            <CategoryFilter
                                categories={categories.map((c) => ({
                                    id: c.id,
                                    name: c.name,
                                    slug: c.slug,
                                }))}
                                activeSlug={activeCategorySlug}
                            />
                        </div>
                    )}

                    {filteredCourses.length === 0 ? (
                        <div className="border-border flex flex-col items-center gap-3 rounded-[18px] border bg-white p-12 text-center">
                            <Search className="text-mute/30 size-10" strokeWidth={1.5} />
                            <p className="text-ink font-display text-lg font-bold">
                                No hay cursos en esta categoría
                            </p>
                            <p className="text-mute text-[14px]">
                                Probá con otra categoría o volvé al catálogo completo.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredCourses.map((c) => (
                                <PublicCourseCard
                                    key={c.id}
                                    checkoutHref={`/checkout/${c.id}`}
                                    title={c.title}
                                    description={c.description}
                                    coverImageUrl={c.coverImageUrl}
                                    modulesCount={c._count.modules}
                                    priceClp={c.price}
                                    institutionName={inst.name}
                                    categoryNames={c.categories.map((cc) => cc.category.name)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <JsonLd
                    data={{
                        '@context': 'https://schema.org',
                        '@type': 'ItemList',
                        itemListElement: coursesLd,
                    }}
                />
            </div>
        </main>
    );
}
