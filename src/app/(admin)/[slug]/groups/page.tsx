import { auth } from '@/features/auth/auth';
import { GroupsClient } from '@/features/groups/components/GroupsClient';
import { calcGrade } from '@/features/results/lib/grade';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { redirect } from 'next/navigation';

export default async function GroupsPage({ params }: { params: Promise<{ slug: string }> }) {
    const [{ slug }, session] = await Promise.all([params, auth()]);
    if (!session) redirect('/login');

    const inst = await prisma.academicInstitution.findUnique({
        where: { slug },
        select: { id: true, name: true },
    });
    if (!inst) redirect(session.user.userRoleName === USER_ROLE.SUPER_ADMIN ? '/config' : '/login');

    const isSuperAdmin = session.user.userRoleName === USER_ROLE.SUPER_ADMIN;
    const isAdmin = session.user.userRoleName === USER_ROLE.ADMIN;
    const isProfesor = session.user.userRoleName === USER_ROLE.PROFESOR;

    if (!isSuperAdmin && session.user.academicInstitutionId !== inst.id) redirect('/login');

    const canMutate = isSuperAdmin || isAdmin;

    const [groups, professors] = await Promise.all([
        prisma.group.findMany({
            where: {
                academicInstitutionId: inst.id,
                ...(isProfesor ? { professors: { some: { id: session.user.id } } } : {}),
            },
            include: {
                _count: { select: { users: true, exams: true } },
                tutor: { select: { id: true, name: true, lastname: true } },
                users: {
                    where: { userRole: { name: USER_ROLE.STUDENT } },
                    select: { id: true, name: true, lastname: true, rut: true, active: true },
                    orderBy: { lastname: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        }),
        prisma.user.findMany({
            where: { academicInstitutionId: inst.id, userRole: { name: USER_ROLE.PROFESOR } },
            select: { id: true, name: true, lastname: true },
            orderBy: { lastname: 'asc' },
        }),
    ]);

    // Promedio real por grupo: nota promedio de los resultados de sus estudiantes.
    const groupIds = groups.map((g) => g.id);
    const results =
        groupIds.length > 0
            ? await prisma.result.findMany({
                  where: {
                      student: { groupId: { in: groupIds } },
                      exam: { academicInstitutionId: inst.id },
                  },
                  select: {
                      score: true,
                      maxScore: true,
                      student: { select: { groupId: true } },
                      exam: { select: { maxGrade: true, passingGrade: true, passingPercentage: true } },
                  },
              })
            : [];

    const gradeSums = new Map<string, { total: number; count: number }>();
    for (const r of results) {
        const gid = r.student.groupId;
        if (!gid) continue;
        const grade = calcGrade(
            r.score,
            r.maxScore,
            r.exam.maxGrade,
            r.exam.passingGrade,
            r.exam.passingPercentage,
        );
        const entry = gradeSums.get(gid) ?? { total: 0, count: 0 };
        entry.total += grade;
        entry.count += 1;
        gradeSums.set(gid, entry);
    }

    const groupsWithAvg = groups.map((g) => {
        const s = gradeSums.get(g.id);
        return {
            ...g,
            avgGrade: s && s.count > 0 ? Math.round((s.total / s.count) * 10) / 10 : null,
        };
    });

    return (
        <GroupsClient
            slug={slug}
            institutionName={inst.name}
            groups={groupsWithAvg}
            professors={professors}
            canMutate={canMutate}
        />
    );
}
