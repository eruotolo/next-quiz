import { getInstitutions } from '@/features/institutions/actions/queries';
import { InstitutionsClient } from '@/features/institutions/components/InstitutionsClient';
import { prisma } from '@/shared/lib/prisma';

interface PageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function InstitutionsPage({
    searchParams,
}: PageProps) {
    const sp = await searchParams;
    const q = typeof sp.q === 'string' ? sp.q : '';
    const page = Math.max(1, Number(sp.page) || 1);

    const [result, customPlans] = await Promise.all([
        getInstitutions({ page, perPage: 10, q }),
        prisma.customPlan.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ]);

    return <InstitutionsClient result={result} q={q} customPlans={customPlans} />;
}
