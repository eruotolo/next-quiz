import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { redirect } from 'next/navigation';
import { StudentsClient } from '@/features/students/components/StudentsClient';

export default async function StudentsPage({ params }: { params: Promise<{ slug: string }> }) {
    const [{ slug }, session] = await Promise.all([params, auth()]);
    if (!session) redirect('/login');

    let institutionId: string;
    if (session.user.userRoleName === USER_ROLE.SUPER_ADMIN) {
        const inst = await prisma.academicInstitution.findUnique({ where: { slug }, select: { id: true } });
        if (!inst) redirect('/config');
        institutionId = inst.id;
    } else {
        if (!session.user.academicInstitutionId) redirect('/login');
        institutionId = session.user.academicInstitutionId;
    }

    const [students, groups] = await Promise.all([
        prisma.user.findMany({
            where: {
                userRole: { name: USER_ROLE.STUDENT },
                academicInstitutionId: institutionId,
            },
            include: { group: true },
            orderBy: [{ group: { name: 'asc' } }, { lastname: 'asc' }],
        }),
        prisma.group.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return <StudentsClient students={students} groups={groups} />;
}
