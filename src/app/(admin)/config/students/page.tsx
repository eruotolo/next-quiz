import { getStudentsGlobal } from '@/features/students/actions/global';
import { GlobalStudentsClient } from '@/features/students/components/GlobalStudentsClient';
import { prisma } from '@/shared/lib/prisma';
import type React from 'react';

interface PageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StudentsGlobalPage({ searchParams }: PageProps): Promise<React.JSX.Element> {
    const sp = await searchParams;
    const q = typeof sp.q === 'string' ? sp.q : '';
    const page = Math.max(1, Number(sp.page) || 1);
    const institutionId = typeof sp.institutionId === 'string' ? sp.institutionId : '';

    const [result, institutions] = await Promise.all([
        getStudentsGlobal({ page, perPage: 10, q, institutionId: institutionId || undefined }),
        prisma.academicInstitution.findMany({
            where: { active: true },
            orderBy: { name: 'asc' },
            select: { id: true, name: true },
        }),
    ]);

    return (
        <GlobalStudentsClient
            result={result}
            institutions={institutions}
            q={q}
            institutionId={institutionId}
        />
    );
}
