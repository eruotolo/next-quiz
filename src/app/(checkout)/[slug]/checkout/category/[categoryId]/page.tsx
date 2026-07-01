import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { prisma } from '@/shared/lib/prisma';
import { AULIKA_ONLINE_INSTITUTION_SLUG } from '@/features/lms/lib/aulika-online-bundle';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { CheckoutSummaryCard } from '@/features/lms/components/CheckoutSummaryCard';
import { CategoryCheckoutForm } from './CategoryCheckoutForm';

interface PageProps {
    params: Promise<{ slug: string; categoryId: string }>;
}

async function loadCategory(slug: string, categoryId: string) {
    if (slug !== AULIKA_ONLINE_INSTITUTION_SLUG) return null;
    const inst = await prisma.academicInstitution.findUnique({
        where: { slug },
        select: { id: true, name: true, active: true },
    });
    if (!inst || !inst.active) return null;

    const category = await prisma.lmsCategory.findFirst({
        where: {
            id: categoryId,
            academicInstitutionId: inst.id,
            isBundle: true,
            isPublic: true,
            bundlePrice: { not: null },
        },
        select: {
            id: true,
            name: true,
            description: true,
            bundlePrice: true,
            _count: { select: { courses: true } },
        },
    });
    if (!category || category.bundlePrice === null) return null;

    const bundleCourses = await prisma.lmsCourseCategory.findMany({
        where: { categoryId: category.id },
        select: { course: { select: { title: true } } },
    });
    const courseTitles = bundleCourses.map((bc) => bc.course.title);

    return { inst, category, courseTitles };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug, categoryId } = await params;
    const data = await loadCategory(slug, categoryId);
    if (!data) return { title: 'Checkout' };
    return {
        title: `Comprar Pack ${data.category.name} · ${data.inst.name}`,
        description: `Pack completo de ${data.category.name}.`,
        robots: { index: false, follow: false },
    };
}

export default async function CategoryCheckoutPage({ params }: PageProps) {
    const { slug, categoryId } = await params;
    const data = await loadCategory(slug, categoryId);
    if (!data) notFound();
    const { inst, category, courseTitles } = data;

    return (
        <AuthShell
            side={
                <CheckoutSummaryCard
                    eyebrow="Pack Completo"
                    institutionName={inst.name}
                    title={category.name}
                    description={category.description}
                    courseTitles={courseTitles}
                    metaLine={`${category._count.courses} cursos incluidos`}
                    priceClp={category.bundlePrice ?? 0}
                />
            }
        >
            <Link
                href={`/${slug}/cursos` as `/${string}`}
                className="text-mute hover:text-ink mb-6 inline-flex items-center gap-1 text-[13px] font-medium transition-colors"
            >
                <ChevronLeft size={14} />
                Volver al catálogo
            </Link>

            <h1 className="text-ink font-display text-[24px] font-bold tracking-tight">
                Tus datos para el Pack Completo
            </h1>
            <p className="text-ink-dim mt-1 text-[14px]">
                Te enviaremos un email con el enlace para activar tu cuenta y acceder a todos los
                cursos del pack.
            </p>
            <div className="mt-6">
                <CategoryCheckoutForm slug={slug} categoryId={category.id} />
            </div>
        </AuthShell>
    );
}
