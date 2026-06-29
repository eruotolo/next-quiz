import { auth } from '@/features/auth/auth';
import { Sidebar } from '@/features/dashboard/components/Sidebar';
import { TourButton } from '@/features/tour/components/TourButton';
import { demoExamFilter } from '@/features/demo/lib/demo';
import { PlanUsageBanner } from '@/features/subscriptions/components/PlanUsageBanner';
import { getQuotaUsage } from '@/features/subscriptions/lib/quota';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { getInstitutionSeo } from '@/shared/lib/seo';
import { groupProfessorFilter } from '@/shared/lib/scoping';
import type { Metadata } from 'next';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

const getInstitutionId = cache(async (slug: string): Promise<string | undefined> => {
    const result = await prisma.academicInstitution.findUnique({
        where: { slug },
        select: { id: true },
    });
    return result?.id ?? undefined;
});

interface Props {
    children: ReactNode;
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const seo = await getInstitutionSeo(slug);
    return {
        title: seo.title,
        description: seo.description,
        keywords: seo.keywords,
        openGraph: {
            title: seo.title,
            description: seo.description,
            images: seo.ogImage ? [{ url: seo.ogImage }] : [],
        },
    };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: layout que arma sesión, scope por rol, contadores y banner de plan en una sola pasada
export default async function InstitutionLayout({ children, params }: Props) {
    const { slug } = await params;
    const session = await auth();
    if (!session) redirect('/login');

    const isSuperAdmin = session.user.userRoleName === USER_ROLE.SUPER_ADMIN;
    const isProfesor = session.user.userRoleName === USER_ROLE.PROFESOR;
    const isAdmin = session.user.userRoleName === USER_ROLE.ADMIN;

    const institutionId = session.user.academicInstitutionId ?? (await getInstitutionId(slug));

    // Los contadores del sidebar deben coincidir con lo que muestran las
    // páginas: scope por institución (columna directa) + scope de profesor.
    const profGroupFilter = isProfesor ? groupProfessorFilter(session.user.id) : {};

    const [students, groups, exams, institutionList, quotaUsage, institutionData] = institutionId
        ? await Promise.all([
              prisma.user.count({
                  where: {
                      academicInstitutionId: institutionId,
                      userRole: { name: USER_ROLE.STUDENT },
                      ...(isProfesor && { group: profGroupFilter }),
                  },
              }),
              prisma.group.count({
                  where: { academicInstitutionId: institutionId, ...profGroupFilter },
              }),
              prisma.exam.count({
                  where: {
                      academicInstitutionId: institutionId,
                      ...(isProfesor && { groups: { some: profGroupFilter } }),
                      ...demoExamFilter(session.user),
                  },
              }),
              isSuperAdmin
                  ? prisma.academicInstitution.findMany({
                        select: { name: true, slug: true },
                        orderBy: { name: 'asc' },
                    })
                  : Promise.resolve([]),
              isSuperAdmin ? Promise.resolve([]) : getQuotaUsage(institutionId),
              prisma.academicInstitution.findUnique({
                  where: { id: institutionId },
                  select: { plan: true, type: true },
              }),
          ])
        : [undefined, undefined, undefined, [], [], null];

    // Banner promocional del sidebar: solo para Administrador en planes Free o Docente.
    const institutionPlan = isAdmin ? (institutionData?.plan ?? null) : null;
    const showPlanPromo = institutionPlan === 'FREE' || institutionPlan === 'DOCENTE';

    // Programas que coordina el usuario (Jefe de Carrera) — solo para Profesores.
    // Habilita el indicador de coordinación en el Sidebar (Fase 5). El JWT no lo
    // lleva porque cambia, así que se resuelve por request como en auth-guard.
    const coordinatedProgramIds = isProfesor
        ? (
              await prisma.programCoordinator.findMany({
                  where: { userId: session.user.id },
                  select: { programId: true },
              })
          ).map((c) => c.programId)
        : [];

    return (
        <div className="bg-paper flex min-h-screen">
            <Sidebar
                slug={slug}
                userName={session.user?.name}
                userRole={session.user?.userRoleName}
                coordinatedProgramIds={coordinatedProgramIds}
                institutionType={institutionData?.type ?? undefined}
                counts={{
                    students: students ?? undefined,
                    groups: groups ?? undefined,
                    exams: exams ?? undefined,
                }}
                institutionList={institutionList as { name: string; slug: string }[]}
                showPlanPromo={showPlanPromo}
            />
            <main className="flex flex-1 flex-col overflow-y-auto lg:ml-60">
                {isAdmin && quotaUsage && quotaUsage.length > 0 && (
                    <PlanUsageBanner usage={quotaUsage} slug={slug} />
                )}
                {children}
            </main>
            <TourButton slug={slug} />
        </div>
    );
}
