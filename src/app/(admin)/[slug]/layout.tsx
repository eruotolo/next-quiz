import { auth } from '@/features/auth/auth';
import { Sidebar } from '@/features/dashboard/components/Sidebar';
import { PlanUsageBanner } from '@/features/subscriptions/components/PlanUsageBanner';
import { getQuotaUsage } from '@/features/subscriptions/lib/quota';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { getInstitutionSeo } from '@/shared/lib/seo';
import type { Metadata } from 'next';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

const getInstitutionId = cache(async (slug: string): Promise<string | undefined> => {
    const result = await prisma.academicInstitution.findUnique({ where: { slug }, select: { id: true } });
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

export default async function InstitutionLayout({ children, params }: Props): Promise<React.JSX.Element> {
    const { slug } = await params;
    const session = await auth();
    if (!session) redirect('/login');

    const isSuperAdmin = session.user.userRoleName === USER_ROLE.SUPER_ADMIN;

    const institutionId =
        session.user.academicInstitutionId ??
        await getInstitutionId(slug);

    const [students, groups, exams, institutionList, quotaUsage] = institutionId
        ? await Promise.all([
              prisma.user.count({
                  where: { academicInstitutionId: institutionId, userRole: { name: USER_ROLE.STUDENT } },
              }),
              prisma.group.count({
                  where: { users: { some: { academicInstitutionId: institutionId, userRole: { name: USER_ROLE.STUDENT } } } },
              }),
              prisma.exam.count({
                  where: { groups: { some: { users: { some: { academicInstitutionId: institutionId } } } } },
              }),
              isSuperAdmin
                  ? prisma.academicInstitution.findMany({ select: { name: true, slug: true }, orderBy: { name: 'asc' } })
                  : Promise.resolve([]),
              isSuperAdmin ? Promise.resolve([]) : getQuotaUsage(institutionId),
          ])
        : [undefined, undefined, undefined, [], []];

    return (
        <div className="flex min-h-screen bg-paper">
            <Sidebar
                slug={slug}
                userName={session.user?.name}
                userEmail={session.user?.email}
                userRole={session.user?.userRoleName}
                counts={{ students: students ?? undefined, groups: groups ?? undefined, exams: exams ?? undefined }}
                institutionList={institutionList as { name: string; slug: string }[]}
            />
            <main className="ml-60 flex-1 overflow-y-auto">
                {quotaUsage && quotaUsage.length > 0 && (
                    <PlanUsageBanner usage={quotaUsage} />
                )}
                {children}
            </main>
        </div>
    );
}
