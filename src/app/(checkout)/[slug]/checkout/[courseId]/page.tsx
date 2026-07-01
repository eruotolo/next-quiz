import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { prisma } from '@/shared/lib/prisma';
import { AULIKA_ONLINE_INSTITUTION_SLUG } from '@/features/lms/lib/aulika-online-bundle';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { CheckoutSummaryCard } from '@/features/lms/components/CheckoutSummaryCard';
import { CheckoutForm } from './CheckoutForm';

interface PageProps {
    params: Promise<{ slug: string; courseId: string }>;
}

async function loadCourse(slug: string, courseId: string) {
    // Solo Aulika vende cursos B2C.
    if (slug !== AULIKA_ONLINE_INSTITUTION_SLUG) return null;

    const inst = await prisma.academicInstitution.findUnique({
        where: { slug },
        select: { id: true, name: true, active: true },
    });
    if (!inst?.active) return null;

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
        },
    });
    if (!course || course.price === null || course.price <= 0) return null;
    return { inst, course };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug, courseId } = await params;
    const data = await loadCourse(slug, courseId);
    if (!data) return { title: 'Checkout' };
    const { inst, course } = data;
    return {
        title: `Comprar ${course.title} · ${inst.name}`,
        description: `Comprá este curso del Aula Virtual de ${inst.name}.`,
        robots: { index: false, follow: false },
    };
}

export default async function CheckoutPage({ params }: PageProps) {
    const { slug, courseId } = await params;
    const data = await loadCourse(slug, courseId);
    if (!data) notFound();
    const { inst, course } = data;

    return (
        <AuthShell
            side={
                <CheckoutSummaryCard
                    eyebrow="Curso individual"
                    institutionName={inst.name}
                    title={course.title}
                    description={course.description}
                    imageUrl={course.coverImageUrl}
                    priceClp={course.price ?? 0}
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
                Tus datos para inscribirte
            </h1>
            <p className="text-ink-dim mt-1 text-[14px]">
                Te enviaremos un email con el enlace para activar tu cuenta y acceder al aula.
            </p>
            <div className="mt-6">
                <CheckoutForm slug={slug} courseId={course.id} />
            </div>
        </AuthShell>
    );
}
