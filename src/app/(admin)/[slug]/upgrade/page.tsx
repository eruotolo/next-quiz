import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { auth } from '@/features/auth/auth';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { UpgradePlans } from '@/features/subscriptions/components/UpgradePlans';
import { prisma } from '@/shared/lib/prisma';
import { Sparkles } from 'lucide-react';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Mejorá tu plan · Aulika',
};

export default async function UpgradePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { isProfesor, institutionId } = await requireInstitutionPageAccess(slug);

    // La gestión del plan es del Administrador; el Profesor vuelve al panel.
    if (isProfesor) redirect(`/${slug}`);

    const [session, inst] = await Promise.all([
        auth(),
        institutionId
            ? prisma.academicInstitution.findUnique({
                  where: { id: institutionId },
                  select: { plan: true, name: true },
              })
            : Promise.resolve(null),
    ]);

    return (
        <>
            <AdminTopBar
                title="Mejorá tu plan"
                breadcrumb={[inst?.name ?? slug, 'Planes']}
                icon={<Sparkles size={24} />}
                subtitle="Elegí el plan que mejor se adapta a tu institución. El cambio se aplica al confirmar el pago."
            />
            <UpgradePlans
                slug={slug}
                currentPlan={inst?.plan ?? 'FREE'}
                quoteDefaults={{
                    name: session?.user?.name ?? '',
                    email: session?.user?.email ?? '',
                    institution: inst?.name ?? '',
                }}
            />
        </>
    );
}
