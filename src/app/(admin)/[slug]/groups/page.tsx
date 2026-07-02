import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { GroupsClient } from '@/features/groups/components/GroupsClient';
import { calcGrade } from '@/shared/lib/grade';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { groupProfessorFilter } from '@/shared/lib/scoping';

export default async function GroupsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { institutionId, institutionName, userId, isProfesor, userRole, isDemo } =
        await requireInstitutionPageAccess(slug);

    // Solo Admin/SuperAdmin mutan grupos; el Profesor solo ve los suyos.
    const canMutate = userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPER_ADMIN;

    const [groups, professors, programs, periods, courseSections] = await Promise.all([
        prisma.group.findMany({
            where: {
                academicInstitutionId: institutionId,
                ...(isProfesor && groupProfessorFilter(userId)),
            },
            include: {
                _count: { select: { users: true, exams: true } },
                tutor: { select: { id: true, name: true, lastname: true } },
                program: { select: { id: true, name: true } },
                period: { select: { id: true, name: true } },
                courseSections: { select: { id: true, name: true }, orderBy: { name: 'asc' } },
                users: {
                    where: { userRole: { name: USER_ROLE.STUDENT } },
                    select: { id: true, name: true, lastname: true, rut: true, active: true },
                    orderBy: { lastname: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        }),
        prisma.user.findMany({
            where: {
                academicInstitutionId: institutionId,
                userRole: { name: { in: [USER_ROLE.PROFESOR, USER_ROLE.ADMIN] } },
            },
            select: { id: true, name: true, lastname: true },
            orderBy: { lastname: 'asc' },
        }),
        prisma.program.findMany({
            where: { academicInstitutionId: institutionId },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        }),
        prisma.academicPeriod.findMany({
            where: { academicInstitutionId: institutionId },
            select: { id: true, name: true },
            orderBy: { year: 'desc' },
        }),
        prisma.courseSection.findMany({
            where: { period: { academicInstitutionId: institutionId } },
            select: { id: true, name: true, programId: true, periodId: true },
            orderBy: { name: 'asc' },
        }),
    ]);

    // Promedio real por grupo: nota promedio de los resultados de sus estudiantes.
    const groupIds = groups.map((g) => g.id);
    const results =
        groupIds.length > 0
            ? await prisma.result.findMany({
                  where: {
                      student: { groupId: { in: groupIds } },
                      exam: { academicInstitutionId: institutionId },
                  },
                  select: {
                      score: true,
                      maxScore: true,
                      student: { select: { groupId: true } },
                      exam: {
                          select: { maxGrade: true, passingGrade: true, passingPercentage: true },
                      },
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
            groups={groupsWithAvg}
            professors={professors}
            programs={programs}
            periods={periods}
            courseSections={courseSections}
            canMutate={canMutate}
            isDemo={isDemo}
        />
    );
}
