import type { Metadata } from 'next';
import { ArrowRight, Layers, Search } from 'lucide-react';
import { prisma } from '@/shared/lib/prisma';
import { PublicCourseCard } from '@/features/lms/components/PublicCourseCard';
import {
    AULIKA_ONLINE_BUNDLE_COURSE_ID,
    AULIKA_ONLINE_INSTITUTION_SLUG,
} from '@/features/lms/lib/aulika-online-bundle';
import { JsonLd } from '@/shared/components/seo/JsonLd';
import { courseSchema } from '@/shared/components/seo/schemas';
import Link from 'next/link';

const BASE_URL = 'https://www.aulika.cl';

function formatCLP(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
    }).format(amount);
}

async function loadStorefront() {
    const inst = await prisma.academicInstitution.findUnique({
        where: { slug: AULIKA_ONLINE_INSTITUTION_SLUG },
        select: { id: true, name: true, active: true },
    });
    if (!inst?.active) return null;

    const [packCompleto, courses] = await Promise.all([
        prisma.lmsCourse.findFirst({
            where: {
                id: AULIKA_ONLINE_BUNDLE_COURSE_ID,
                academicInstitutionId: inst.id,
                published: true,
            },
            select: { id: true, title: true, description: true, price: true },
        }),
        prisma.lmsCourse.findMany({
            where: {
                academicInstitutionId: inst.id,
                isPublic: true,
                published: true,
                id: { not: AULIKA_ONLINE_BUNDLE_COURSE_ID },
            },
            orderBy: { title: 'asc' },
            select: {
                id: true,
                title: true,
                description: true,
                coverImageUrl: true,
                price: true,
                _count: { select: { modules: true } },
            },
        }),
    ]);

    return { inst, packCompleto, courses };
}

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Preuniversitario Online PAES — Cursos por Asignatura | Aulika',
        description:
            'Prepara la PAES con Aulika Online: cursos individuales por asignatura o el Pack Completo con todas las áreas. Acceso inmediato, certificado y aula virtual.',
        keywords: [
            'preuniversitario online PAES',
            'cursos PAES Chile',
            'ensayos PAES online',
            'preparación PAES',
            'curso competencia matemática',
            'curso competencia lectora',
        ],
        alternates: { canonical: `${BASE_URL}/cursos` },
        openGraph: {
            title: 'Preuniversitario Online PAES — Aulika',
            description:
                'Cursos por asignatura o el Pack Completo PAES con todas las áreas. Acceso inmediato y certificado de aprobación.',
            url: `${BASE_URL}/cursos`,
            type: 'website',
        },
    };
}

export default async function PreuPdvStorefrontPage() {
    const data = await loadStorefront();

    if (!data) {
        return (
            <main
                className="min-h-screen px-5 py-12 sm:px-8 sm:py-16"
                style={{ backgroundColor: '#FAFAF7' }}
            >
                <div className="mx-auto max-w-[1200px]">
                    <header className="mb-12">
                        <p className="text-mute mb-2 font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
                            Aula Virtual · Aulika Online
                        </p>
                        <h1 className="text-ink font-display text-[36px] leading-[1.05] font-bold tracking-[-0.02em] sm:text-[48px]">
                            Cursos disponibles
                        </h1>
                    </header>
                    <div className="border-border flex flex-col items-center gap-3 rounded-[18px] border bg-white p-12 text-center">
                        <Search className="text-mute/30 size-10" strokeWidth={1.5} />
                        <p className="text-ink font-display text-lg font-bold">
                            El catálogo se está preparando
                        </p>
                        <p className="text-mute text-[14px]">
                            Volvé pronto — estamos publicando los cursos del preuniversitario online.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    const { inst, packCompleto, courses } = data;
    const catalogHref = `/${AULIKA_ONLINE_INSTITUTION_SLUG}/cursos`;

    const coursesLd = courses.map((c, idx) => ({
        ...courseSchema({
            name: c.title,
            description: c.description,
            providerName: inst.name,
            url: `${BASE_URL}${catalogHref}`,
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
                {/* Sub-header */}
                <header className="mb-12">
                    <p className="text-mute mb-2 font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
                        Aula Virtual · Aulika Online
                    </p>
                    <h1 className="text-ink font-display text-[36px] leading-[1.05] font-bold tracking-[-0.02em] sm:text-[48px]">
                        Cursos disponibles
                    </h1>
                </header>

                {/* Pack Completo banner */}
                {packCompleto && (
                    <section className="mb-12">
                        <div
                            className="bg-ink relative overflow-hidden rounded-[32px] px-8 py-12 lg:px-14 lg:py-16"
                            style={{
                                backgroundImage:
                                    'radial-gradient(circle at 85% 15%, rgba(214,255,31,0.18) 0%, transparent 55%), radial-gradient(circle at 5% 85%, rgba(31,46,255,0.35) 0%, transparent 55%)',
                            }}
                        >
                            <div className="bg-primary/20 absolute top-0 right-0 size-96 translate-x-1/2 -translate-y-1/2 blur-[120px]" />

                            <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                                <div>
                                    <div className="mb-4 flex items-center gap-2">
                                        <Layers size={14} className="text-lime" />
                                        <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-lime uppercase">
                                            Pack Completo
                                        </span>
                                    </div>
                                    <h2 className="font-display text-[28px] leading-[1.05] font-bold tracking-[-0.02em] text-white sm:text-[40px]">
                                        {packCompleto.title}
                                    </h2>
                                    {packCompleto.description && (
                                        <p className="mt-3 max-w-[520px] text-[14.5px] leading-relaxed text-white/70">
                                            {packCompleto.description}
                                        </p>
                                    )}
                                    <p className="font-display mt-6 text-[28px] font-bold text-white">
                                        {formatCLP(packCompleto.price ?? 0)}
                                        <span className="ml-2 text-[12.5px] font-normal text-white/50">
                                            vigencia anual
                                        </span>
                                    </p>
                                </div>

                                <div className="flex justify-center lg:justify-end">
                                    <Link
                                        href={
                                            `/${AULIKA_ONLINE_INSTITUTION_SLUG}/checkout/${packCompleto.id}` as `/${string}`
                                        }
                                        className="bg-lime text-ink hover:bg-lime/90 inline-flex h-14 items-center justify-center rounded-[14px] px-8 text-[15px] font-bold shadow-lg transition-all hover:-translate-y-0.5"
                                    >
                                        Comprar Pack Completo
                                        <ArrowRight className="ml-2 size-5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Grid de cursos */}
                <section>
                    <h2 className="text-ink font-display mb-6 text-[22px] font-bold">
                        Asignaturas individuales
                    </h2>
                    {courses.length === 0 ? (
                        <div className="border-border flex flex-col items-center gap-3 rounded-[18px] border bg-white p-12 text-center">
                            <Search className="text-mute/30 size-10" strokeWidth={1.5} />
                            <p className="text-ink font-display text-lg font-bold">
                                Aún no hay asignaturas publicadas
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {courses.map((c) => (
                                <PublicCourseCard
                                    key={c.id}
                                    checkoutHref={`/${AULIKA_ONLINE_INSTITUTION_SLUG}/checkout/${c.id}`}
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
                </section>

                {/* JSON-LD: ItemList con cada asignatura como Course */}
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
