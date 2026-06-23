import { getAdminUsers } from '@/features/admin-users/actions/queries';
import { AdminUsersClient } from '@/features/admin-users/components/AdminUsersClient';
import { prisma } from '@/shared/lib/prisma';

interface PageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminsPage({ searchParams }: PageProps) {
    const sp = await searchParams;
    const q = typeof sp.q === 'string' ? sp.q : '';
    const page = Math.max(1, Number(sp.page) || 1);
    const institutionId = typeof sp.institutionId === 'string' ? sp.institutionId : '';

    const [result, institutions] = await Promise.all([
        getAdminUsers({ page, perPage: 10, q, institutionId: institutionId || undefined }),
        prisma.academicInstitution.findMany({
            where: { active: true },
            orderBy: { name: 'asc' },
            select: { id: true, name: true },
        }),
    ]);

    return (
        <AdminUsersClient
            result={result}
            institutions={institutions}
            q={q}
            institutionId={institutionId}
        />
    );
}
