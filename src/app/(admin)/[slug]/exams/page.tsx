import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { ExamsClient } from '@/features/exams/components/ExamsClient';
import { demoExamFilter } from '@/features/demo/lib/demo';
import { calcGrade } from '@/shared/lib/grade';
import { USER_ROLE } from '@/shared/lib/roles';
import { prisma } from '@/shared/lib/prisma';
import {
    examProfessorFilter,
    groupProfessorFilter,
    courseSectionProfessorFilter,
} from '@/shared/lib/scoping';

export default async function ExamsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { institutionId, institutionName, isProfesor, userId, isDemo, demoSessionId } =
        await requireInstitutionPageAccess(slug);

    // Parallel: exams, groups, courseSections, student counts (no results here)
    const [exams, groups, courseSections, studentGroups] = await Promise.all([
        prisma.exam.findMany({
            where: {
                academicInstitutionId: institutionId,
                ...(isProfesor && examProfessorFilter(userId)),
                ...demoExamFilter({ isDemo, demoSessionId }),
            },
            include: {
                groups: true,
                courseSection: {
                    select: {
                        id: true,
                        name: true,
                        programId: true,
                        periodId: true,
                        groupId: true,
                    },
                },
                _count: { select: { questions: true, results: true } },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.group.findMany({
            where: {
                academicInstitutionId: institutionId,
                ...(isProfesor && groupProfessorFilter(userId)),
            },
            orderBy: { name: 'asc' },
        }),
        prisma.courseSection.findMany({
            where: {
                period: { academicInstitutionId: institutionId },
                ...(isProfesor && courseSectionProfessorFilter(userId)),
            },
            select: {
                id: true,
                name: true,
                programId: true,
                periodId: true,
                groupId: true,
                program: { select: { id: true, name: true } },
                period: { select: { id: true, name: true } },
            },
            orderBy: { name: 'asc' },
        }),
        prisma.user.findMany({
            where: {
                academicInstitutionId: institutionId,
                userRole: { name: USER_ROLE.STUDENT },
                groupId: { not: null },
            },
            select: { groupId: true },
        }),
    ]);

    // Identify corregidos: closesAt in the past AND (active OR has results)
    const now = new Date();
    const corregidosIds = exams
        .filter(
            (e) =>
                !!(e.closesAt && new Date(e.closesAt) < now) && (e.active || e._count.results > 0),
        )
        .map((e) => e.id);

    // Fetch results ONLY for corregidos exams (the only status that shows grade stats)
    const rawResults =
        corregidosIds.length > 0
            ? await prisma.result.findMany({
                  where: { examId: { in: corregidosIds } },
                  select: { examId: true, score: true, maxScore: true },
              })
            : [];

    // Group results by examId for O(1) lookup
    const resultsByExamId = new Map<string, { score: number; maxScore: number }[]>();
    for (const r of rawResults) {
        const list = resultsByExamId.get(r.examId) ?? [];
        list.push({ score: r.score, maxScore: r.maxScore });
        resultsByExamId.set(r.examId, list);
    }

    const studentCountMap = new Map<string, number>();
    for (const { groupId } of studentGroups) {
        if (groupId) studentCountMap.set(groupId, (studentCountMap.get(groupId) ?? 0) + 1);
    }

    const examsWithStats = exams.map((exam) => {
        const results = resultsByExamId.get(exam.id) ?? [];
        const avgGrade =
            results.length > 0
                ? results.reduce(
                      (sum, r) =>
                          sum +
                          calcGrade(
                              r.score,
                              r.maxScore,
                              exam.maxGrade,
                              exam.passingGrade,
                              exam.passingPercentage,
                          ),
                      0,
                  ) / results.length
                : null;
        const passCount = results.filter(
            (r) =>
                calcGrade(
                    r.score,
                    r.maxScore,
                    exam.maxGrade,
                    exam.passingGrade,
                    exam.passingPercentage,
                ) >= exam.passingGrade,
        ).length;
        const passRate = results.length > 0 ? Math.round((passCount / results.length) * 100) : null;
        const totalStudents = exam.groups.reduce(
            (sum, g) => sum + (studentCountMap.get(g.id) ?? 0),
            0,
        );
        return { ...exam, avgGrade, passRate, totalStudents };
    });

    return (
        <ExamsClient
            exams={examsWithStats}
            groups={groups}
            courseSections={courseSections}
            isProfesor={isProfesor}
            isDemo={isDemo}
        />
    );
}
