import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { prisma } from '@/shared/lib/prisma';
import { CheckoutForm } from './CheckoutForm';

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

async function loadCourse(slug: string, courseId: string) {
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
        <main className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 sm:py-12">
            <Link
                href={`/${slug}/cursos/${course.id}` as `/${string}`}
                className="text-mute hover:text-ink mb-6 inline-flex items-center gap-1 text-[13px] font-medium transition-colors"
            >
                <ChevronLeft size={14} />
                Volver al curso
            </Link>

            <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
                {/* Form */}
                <section className="border-border bg-white shadow-sm rounded-[18px] border p-6 sm:p-8">
                    <h1 className="text-ink font-display text-[24px] font-bold tracking-tight">
                        Tus datos para inscribirte
                    </h1>
                    <p className="text-ink-dim mt-1 text-[14px]">
                        Te enviaremos un email con el enlace para activar tu cuenta y
                        acceder al aula.
                    </p>
                    <div className="mt-6">
                        <CheckoutForm slug={slug} courseId={course.id} />
                    </div>
                </section>

                {/* Resumen */}
                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <div className="border-border bg-white shadow-sm rounded-[18px] border p-6">
                        <p className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                            Resumen
                        </p>
                        {course.coverImageUrl && (
                            <div className="border-border relative mt-3 aspect-[16/9] w-full overflow-hidden rounded-[12px] border">
                                <Image
                                    src={course.coverImageUrl}
                                    alt={course.title}
                                    fill
                                    sizes="(min-width: 1024px) 30vw, 100vw"
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <p className="text-mute mt-3 font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                            {inst.name}
                        </p>
                        <h2 className="text-ink mt-1 font-display text-[16px] font-bold leading-tight">
                            {course.title}
                        </h2>
                        <div className="border-border mt-4 border-t pt-4">
                            <div className="flex items-baseline justify-between">
                                <span className="text-ink-dim text-[14px]">Total</span>
                                <span className="text-ink font-display text-[24px] font-bold tracking-tight">
                                    {formatCLP(course.price ?? 0)}
                                </span>
                            </div>
                            <p className="text-mute mt-1 text-[11.5px]">
                                Pago único · Sin renovaciones
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </main>
    );
}
