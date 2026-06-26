'use server';

import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { calcGrade } from '@/shared/lib/grade';
import { prisma } from '@/shared/lib/prisma';

export interface AcademicResultRow {
    id: string;
    score: number;
    maxScore: number;
    grade: number;
    passed: boolean;
    completedAt: string;
    exam: {
        id: string;
        title: string;
        maxGrade: number;
        passingGrade: number;
        courseSectionName: string | null;
        periodYear: number | null;
        periodName: string | null;
        groupName: string | null;
    };
}

export async function getStudentAcademicHistory(
    slug: string,
    studentId: string,
): Promise<{ data: AcademicResultRow[] } | { error: string }> {
    try {
        const { institutionId, isProfesor, userId } = await requireInstitutionPageAccess(slug);

        const examFilter = isProfesor
            ? {
                  OR: [
                      { courseSection: { professors: { some: { id: userId } } } },
                      { groups: { some: { professors: { some: { id: userId } } } } },
                  ],
              }
            : {};

        const results = await prisma.result.findMany({
            where: {
                studentId,
                exam: {
                    academicInstitutionId: institutionId,
                    ...examFilter,
                },
            },
            include: {
                exam: {
                    select: {
                        id: true,
                        title: true,
                        maxGrade: true,
                        passingGrade: true,
                        passingPercentage: true,
                        courseSection: {
                            select: {
                                name: true,
                                period: { select: { name: true, year: true } },
                            },
                        },
                        groups: {
                            select: { name: true },
                            take: 1,
                        },
                    },
                },
            },
            orderBy: { completedAt: 'desc' },
        });

        const data: AcademicResultRow[] = results.map((r) => {
            const grade = calcGrade(
                r.score,
                r.maxScore,
                r.exam.maxGrade,
                r.exam.passingGrade,
                r.exam.passingPercentage,
            );
            return {
                id: r.id,
                score: r.score,
                maxScore: r.maxScore,
                grade,
                passed: grade >= r.exam.passingGrade,
                completedAt: r.completedAt.toISOString(),
                exam: {
                    id: r.exam.id,
                    title: r.exam.title,
                    maxGrade: r.exam.maxGrade,
                    passingGrade: r.exam.passingGrade,
                    courseSectionName: r.exam.courseSection?.name ?? null,
                    periodYear: r.exam.courseSection?.period.year ?? null,
                    periodName: r.exam.courseSection?.period.name ?? null,
                    groupName: r.exam.groups[0]?.name ?? null,
                },
            };
        });

        return { data };
    } catch (err) {
        const message =
            err instanceof Error ? err.message : 'Error al obtener el historial académico.';
        return { error: message };
    }
}
