import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { redirect } from 'next/navigation';
import { StudentsClient } from '@/features/students/components/StudentsClient';

export default async function StudentsPage() {
    const session = await auth();
    if (!session?.user.academicInstitutionId) redirect('/login');

    const [students, groups] = await Promise.all([
        prisma.user.findMany({
            where: {
                userRole: { name: USER_ROLE.STUDENT },
                academicInstitutionId: session.user.academicInstitutionId,
            },
            include: { group: true },
            orderBy: [{ group: { name: 'asc' } }, { lastname: 'asc' }],
        }),
        prisma.group.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return <StudentsClient students={students} groups={groups} />;
}
