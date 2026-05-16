import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { redirect } from 'next/navigation';
import { ProfessorsClient } from '@/features/professors/components/ProfessorsClient';

export default async function ProfessorsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
    const [{ slug }, session] = await Promise.all([params, auth()]);
    if (!session) redirect('/login');

    let institutionId: string;
    if (session.user.userRoleName === USER_ROLE.SUPER_ADMIN) {
        const inst = await prisma.academicInstitution.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (!inst) redirect('/config');
        institutionId = inst.id;
    } else {
        if (!session.user.academicInstitutionId) redirect('/login');
        institutionId = session.user.academicInstitutionId;
    }

    const [professors, groups] = await Promise.all([
        prisma.user.findMany({
            where: {
                academicInstitutionId: institutionId,
                userRole: { name: { in: ['Profesor', 'Administrador'] } },
            },
            include: { userRole: true, professorGroups: true },
            orderBy: { lastname: 'asc' },
        }),
        prisma.group.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return <ProfessorsClient professors={professors} groups={groups} slug={slug} />;
}
