import { auth } from '@/features/auth/auth';
import { getAuditLogs, getDistinctActionsUsed } from '@/features/audit/actions/queries';
import { auditQuerySchema } from '@/features/audit/schemas/audit.schemas';
import { AuditClient } from '@/features/audit/components/AuditClient';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { ScrollText } from 'lucide-react';
import { redirect } from 'next/navigation';

interface PageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AuditoriaPage({ searchParams }: PageProps) {
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

    const [result, distinctActions, institutions, count] = await Promise.all([
        getAuditLogs(params),
        getDistinctActionsUsed(),
        prisma.academicInstitution.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        }),
        prisma.auditLog.count(),
    ]);

    return (
        <>
            <AdminTopBar
                title="Auditoría"
                breadcrumb={['Sistema', 'Auditoría']}
                icon={<ScrollText size={18} />}
                subtitle={`${count.toLocaleString('es-CL')} eventos registrados en total`}
            />
            <AuditClient
                result={result}
                distinctActions={distinctActions}
                institutions={institutions}
                currentFilters={params}
            />
        </>
    );
}
