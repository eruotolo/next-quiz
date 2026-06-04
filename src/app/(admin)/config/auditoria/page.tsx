import { auth } from '@/features/auth/auth';
import { getAuditLogs, getDistinctActionsUsed } from '@/features/audit/actions/queries';
import { auditQuerySchema } from '@/features/audit/schemas/audit.schemas';
import { AuditClient } from '@/features/audit/components/AuditClient';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { redirect } from 'next/navigation';

interface PageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AuditoriaPage({
    searchParams,
}: PageProps): Promise<React.JSX.Element> {
    const session = await auth();
    if (!session || session.user.userRoleName !== USER_ROLE.SUPER_ADMIN) redirect('/login');

    const raw = await searchParams;
    const params = auditQuerySchema.parse({
        page: raw.page,
        perPage: raw.perPage,
        q: raw.q,
        action: raw.action,
        institutionId: raw.institutionId,
        status: raw.status,
        from: raw.from,
        to: raw.to,
    });

    const [result, distinctActions, institutions] = await Promise.all([
        getAuditLogs(params),
        getDistinctActionsUsed(),
        prisma.academicInstitution.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        }),
    ]);

    return (
        <AuditClient
            result={result}
            distinctActions={distinctActions}
            institutions={institutions}
            currentFilters={params}
        />
    );
}
