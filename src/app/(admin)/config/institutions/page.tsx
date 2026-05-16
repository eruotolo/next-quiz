import { getInstitutions } from '@/features/institutions/actions/queries';
import { InstitutionsClient } from '@/features/institutions/components/InstitutionsClient';
import type React from 'react';

interface PageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function InstitutionsPage({ searchParams }: PageProps): Promise<React.JSX.Element> {
    const sp = await searchParams;
    const q = typeof sp.q === 'string' ? sp.q : '';
    const page = Math.max(1, Number(sp.page) || 1);

    const result = await getInstitutions({ page, perPage: 10, q });

    return <InstitutionsClient result={result} q={q} />;
}
