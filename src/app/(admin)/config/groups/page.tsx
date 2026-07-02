import { ConfigGroupsClient } from '@/features/config/components/ConfigGroupsClient';
import { prisma } from '@/shared/lib/prisma';

export default async function ConfigGroupsPage() {
    const rawGroups = await prisma.group.findMany({
        where: { academicInstitutionId: { not: null } },
        include: {
            academicInstitution: { select: { name: true, slug: true } },
            program: { select: { name: true } },
            period: { select: { name: true } },
            _count: { select: { users: true, exams: true } },
        },
        orderBy: [{ academicInstitution: { name: 'asc' } }, { name: 'asc' }],
    });

    const groups = rawGroups.filter(
        (g): g is typeof g & { academicInstitution: { name: string; slug: string } } =>
            g.academicInstitution !== null,
    );

    return <ConfigGroupsClient groups={groups} />;
}
