import { auth } from '@/features/auth/auth';
import { DashboardClient } from '@/features/dashboard/components/DashboardClient';
import { calcGrade } from '@/features/results/lib/grade';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { redirect } from 'next/navigation';

interface Props {
    params: Promise<{ slug: string }>;
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
}

export default async function InstitutionDashboardPage({ params }: Props) {
    const [{ slug }, session] = await Promise.all([params, auth()]);
    if (!session) redirect('/login');

    let institutionId: string;
    let institutionName: string;

    if (session.user.userRoleName === USER_ROLE.SUPER_ADMIN) {
        const inst = await prisma.academicInstitution.findUnique({
            where: { slug },
            select: { id: true, name: true },
        });
        if (!inst) redirect('/config');
        institutionId = inst.id;
        institutionName = inst.name;
    } else {
        if (!session.user.academicInstitutionId) redirect('/login');
        institutionId = session.user.academicInstitutionId;
        const inst = await prisma.academicInstitution.findUnique({
            where: { id: institutionId },
            select: { name: true },
        });
        institutionName = inst?.name ?? slug;
    }

    const [
        totalStudents,
        totalExams,
        groups,
        activeExamsList,
        recentResults,
        institutionResultsRaw,
        ungroupedStudents,
    ] = await Promise.all([
        prisma.user.count({
            where: { userRole: { name: USER_ROLE.STUDENT }, academicInstitutionId: institutionId },
        }),
        prisma.exam.count(),
        prisma.group.findMany({ orderBy: { name: 'asc' } }),
        prisma.exam.findMany({
            where: { active: true },
            select: {
                id: true,
                title: true,
                subject: true,
                unit: true,
                closesAt: true,
                groups: {
                    select: {
                        name: true,
                        users: {
                            where: { userRole: { name: USER_ROLE.STUDENT } },
                            select: { id: true },
                        },
                    },
                },
                _count: { select: { results: true } },
            },
            orderBy: { closesAt: 'asc' },
            take: 5,
        }),
        prisma.result.findMany({
            where: { student: { academicInstitutionId: institutionId } },
            select: {
                id: true,
                score: true,
                maxScore: true,
                completedAt: true,
                student: { select: { name: true, lastname: true } },
                exam: {
                    select: {
                        title: true,
                        subject: true,
                        maxGrade: true,
                        passingGrade: true,
                        passingPercentage: true,
                    },
                },
            },
            orderBy: { completedAt: 'desc' },
            take: 5,
        }),
        prisma.result.findMany({
            where: { student: { academicInstitutionId: institutionId } },
            select: {
                score: true,
                maxScore: true,
                exam: { select: { maxGrade: true, passingGrade: true, passingPercentage: true } },
            },
        }),
        prisma.user.count({
            where: {
                userRole: { name: USER_ROLE.STUDENT },
                academicInstitutionId: institutionId,
                groupId: null,
            },
        }),
    ]);

    const avgGrade =
        institutionResultsRaw.length > 0
            ? institutionResultsRaw.reduce((acc, r) => {
                  return (
                      acc +
                      calcGrade(
                          r.score,
                          r.maxScore,
                          r.exam.maxGrade,
                          r.exam.passingGrade,
                          r.exam.passingPercentage,
                      )
                  );
              }, 0) / institutionResultsRaw.length
            : null;

    const uniqueStudentsWithResults = new Set(
        await prisma.result
            .findMany({
                where: { student: { academicInstitutionId: institutionId } },
                select: { studentId: true },
            })
            .then((rows) => rows.map((r) => r.studentId)),
    ).size;

    const attendancePct =
        totalStudents > 0 ? Math.round((uniqueStudentsWithResults / totalStudents) * 100) : 0;

    const firstName = session.user.name?.split(' ')[0] ?? 'Admin';

    const activeExams = activeExamsList.map((exam) => {
        const totalStudentsInGroups = exam.groups.reduce((acc, g) => acc + g.users.length, 0);
        const groupNames = exam.groups.map((g) => g.name).join(', ');
        return {
            id: exam.id,
            title: exam.title,
            subject: exam.subject,
            unit: exam.unit,
            closesAt: exam.closesAt?.toISOString() ?? null,
            groupNames,
            totalStudents: totalStudentsInGroups,
            submittedCount: exam._count.results,
        };
    });

    const formattedResults = recentResults.map((r) => ({
        id: r.id,
        studentName: `${r.student.name} ${r.student.lastname}`,
        examTitle: r.exam.title,
        examSubject: r.exam.subject,
        grade: calcGrade(
            r.score,
            r.maxScore,
            r.exam.maxGrade,
            r.exam.passingGrade,
            r.exam.passingPercentage,
        ),
        maxGrade: r.exam.maxGrade,
        passingGrade: r.exam.passingGrade,
        completedAt: r.completedAt.toISOString(),
    }));

    return (
        <DashboardClient
            firstName={firstName}
            greeting={getGreeting()}
            institutionName={institutionName}
            slug={slug}
            groups={groups}
            stats={{
                students: totalStudents,
                activeExams: activeExamsList.length,
                totalExams,
                results: institutionResultsRaw.length,
            }}
            activeExams={activeExams}
            recentResults={formattedResults}
            avgGrade={avgGrade}
            attendancePct={attendancePct}
            uniqueStudentsWithResults={uniqueStudentsWithResults}
            ungroupedStudents={ungroupedStudents}
        />
    );
}
