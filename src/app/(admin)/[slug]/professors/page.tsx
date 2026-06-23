import { prisma } from '@/shared/lib/prisma';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { ProfessorsClient } from '@/features/professors/components/ProfessorsClient';

export default async function ProfessorsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
    const { slug } = await params;
    const { institutionId } = await requireInstitutionPageAccess(slug);

    const [professors, groups] = await Promise.all([
        prisma.user.findMany({
            where: {
                academicInstitutionId: institutionId,
                userRole: { name: { in: ['Profesor', 'Administrador'] } },
            },
            include: { userRole: true, professorGroups: true },
            orderBy: { lastname: 'asc' },
        }),
        prisma.group.findMany({
            where: { academicInstitutionId: institutionId },
            orderBy: { name: 'asc' },
        }),
    ]);

    return (
        <ProfessorsClient
            professors={professors}
            groups={groups}
            slug={slug}
        />
    );
}
