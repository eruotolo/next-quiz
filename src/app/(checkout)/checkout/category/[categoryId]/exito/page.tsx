import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/shared/lib/prisma';
import { OrderStatusPoller } from '../../../[courseId]/exito/OrderStatusPoller';

interface PageProps {
    params: Promise<{ categoryId: string }>;
    searchParams: Promise<{ order?: string; status?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Pago confirmado',
        description: 'Confirmando tu pago en MercadoPago.',
        robots: { index: false, follow: false },
    };
}

export default async function CategoryCheckoutSuccessPage({ searchParams }: PageProps) {
    const { order, status } = await searchParams;
    if (!order) notFound();

    const ord = await prisma.lmsOrder.findUnique({
        where: { id: order },
        select: {
            id: true,
            status: true,
            studentEmail: true,
            kind: true,
            categoryId: true,
            category: { select: { name: true } },
        },
    });
    if (!ord) notFound();

    const productTitle =
        ord.kind === 'CATEGORY_BUNDLE'
            ? ord.category
                ? `Pack Completo: ${ord.category.name}`
                : 'Pack'
            : 'Curso';

    if (status === 'rejected' || ord.status === 'RECHAZADO') {
        return (
            <main className="mx-auto max-w-[640px] px-5 py-16 sm:px-8">
                <div className="border-border bg-white shadow-sm rounded-[18px] border p-8 text-center">
                    <h1 className="text-ink font-display text-[24px] font-bold tracking-tight">
                        Pago rechazado
                    </h1>
                    <p className="text-ink-dim mt-2 text-[14px]">
                        El pago no se procesó. Si querés, probá de nuevo desde el catálogo.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-[640px] px-5 py-12 sm:px-8 sm:py-16">
            <div className="border-border bg-white shadow-sm rounded-[18px] border p-8">
                <OrderStatusPoller
                    orderId={ord.id}
                    studentEmail={ord.studentEmail}
                    courseTitle={productTitle}
                />
            </div>
        </main>
    );
}
