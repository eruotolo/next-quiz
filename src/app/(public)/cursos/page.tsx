import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Layers, Search } from 'lucide-react';
import { prisma } from '@/shared/lib/prisma';
import { PublicCourseCard } from '@/features/lms/components/PublicCourseCard';
import {
    AULIKA_ONLINE_BUNDLE_COURSE_ID,
    AULIKA_ONLINE_INSTITUTION_SLUG,
} from '@/features/lms/lib/aulika-online-bundle';
import { JsonLd } from '@/shared/components/seo/JsonLd';
import { courseSchema } from '@/shared/components/seo/schemas';
import { Button } from '@/shared/components/ui/button';
import { Tag } from '@/shared/components/ui/badge';

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

    return (
        <main className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 sm:py-16">
            {/* Hero */}
            <section className="mb-12 max-w-[760px]">
                <Tag tone="lime" size="sm" className="mb-4 font-bold">
                    PREUNIVERSITARIO ONLINE
                </Tag>
                <h1 className="text-ink font-display text-[36px] leading-[1.05] font-bold tracking-[-0.02em] sm:text-[52px]">
                    Prepara la PAES con clases por asignatura.
                </h1>
                <p className="text-ink-dim mt-4 text-[16px] leading-relaxed sm:text-[18px]">
                    Comprá la asignatura que necesitás reforzar o llevate el Pack Completo con las
                    7 áreas del DEMRE. Acceso inmediato al aula virtual, ensayos y certificado de
                    aprobación.
                </p>
            </section>

            {!data ? (
                <div className="border-border flex flex-col items-center gap-3 rounded-[18px] border bg-white p-12 text-center">
                    <Search className="text-mute/30 size-10" strokeWidth={1.5} />
                    <p className="text-ink font-display text-lg font-bold">
                        El catálogo se está preparando
                    </p>
                    <p className="text-mute text-[14px]">
                        Volvé pronto — estamos publicando los cursos del preuniversitario online.
                    </p>
                </div>
            ) : (
                <>
                    {/* Pack Completo banner */}
                    {data.packCompleto && (
                        <section className="mb-12">
                            <div
                                className="bg-ink relative overflow-hidden rounded-[28px] px-8 py-12 lg:px-14 lg:py-16"
                                style={{
                                    backgroundImage:
                                        'radial-gradient(circle at 85% 15%, rgba(214,255,31,0.18) 0%, transparent 55%), radial-gradient(circle at 5% 85%, rgba(31,46,255,0.35) 0%, transparent 55%)',
                                }}
                            >
                                <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="max-w-[600px]">
                                        <Tag tone="lime" size="sm" className="mb-4 font-bold">
                                            <Layers size={12} className="mr-1" />
                                            TODAS LAS ÁREAS
                                        </Tag>
                                        <h2 className="font-display text-[28px] leading-[1.05] font-bold tracking-[-0.02em] text-white sm:text-[36px]">
                                            {data.packCompleto.title}
                                        </h2>
                                        {data.packCompleto.description && (
                                            <p className="mt-3 text-[14.5px] leading-relaxed text-white/70">
                                                {data.packCompleto.description}
                                            </p>
                                        )}
                                        <p className="font-display mt-5 text-[34px] font-bold text-white">
                                            {formatCLP(data.packCompleto.price ?? 0)}
                                            <span className="ml-1 text-[13px] font-normal text-white/50">
                                                vigencia anual
                                            </span>
                                        </p>
                                    </div>
                                    <Button
                                        asChild
                                        variant="lime"
                                        size="lg"
                                        className="h-14 shrink-0 px-8 text-[16px] font-bold"
                                    >
                                        <Link
                                            href={
                                                `/${AULIKA_ONLINE_INSTITUTION_SLUG}/checkout/${data.packCompleto.id}` as `/${string}`
                                            }
                                        >
                                            Comprar Pack Completo
                                            <ArrowRight className="ml-2 size-5" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Grid de asignaturas */}
                    <section>
                        <h2 className="text-ink font-display mb-6 text-[22px] font-bold">
                            Asignaturas individuales
                        </h2>
                        {data.courses.length === 0 ? (
                            <div className="border-border flex flex-col items-center gap-3 rounded-[18px] border bg-white p-12 text-center">
                                <Search className="text-mute/30 size-10" strokeWidth={1.5} />
                                <p className="text-ink font-display text-lg font-bold">
                                    Aún no hay asignaturas publicadas
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {data.courses.map((c) => (
                                    <PublicCourseCard
                                        key={c.id}
                                        href={`/${AULIKA_ONLINE_INSTITUTION_SLUG}/cursos/${c.id}`}
                                        title={c.title}
                                        description={c.description}
                                        coverImageUrl={c.coverImageUrl}
                                        modulesCount={c._count.modules}
                                        priceClp={c.price}
                                        institutionName={data.inst.name}
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
                            itemListElement: data.courses.map((c, idx) => ({
                                ...courseSchema({
                                    name: c.title,
                                    description: c.description,
                                    providerName: data.inst.name,
                                    url: `${BASE_URL}/${AULIKA_ONLINE_INSTITUTION_SLUG}/cursos/${c.id}`,
                                    priceClp: c.price,
                                    isFree: c.price === null || c.price === 0,
                                }),
                                position: idx + 1,
                            })),
                        }}
                    />
                </>
            )}
        </main>
    );
}
