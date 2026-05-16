'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { ADMIN_ROLES, USER_ROLE, type UserRoleName } from '@/shared/lib/roles';

interface DashboardStats {
    totalStudents: number;
    activeExams: number;
    avgGrade: number | null;
    recentResults: Array<{
        id: string;
        studentName: string;
        examTitle: string;
        score: number;
        maxScore: number;
        completedAt: Date;
    }>;
    activeExamList: Array<{
        id: string;
        title: string;
        completedCount: number;
        totalStudents: number;
    }>;
}

export async function getDashboardData(
    slug: string,
): Promise<{ data: DashboardStats | null; error: string | null }> {
    const session = await auth();
    if (!session?.user) return { data: null, error: 'No autorizado' };
    if (!ADMIN_ROLES.includes(session.user.userRoleName as UserRoleName)) {
        return { data: null, error: 'Sin permisos' };
    }

    const isSuperAdmin = session.user.userRoleName === USER_ROLE.SUPER_ADMIN;
    if (!isSuperAdmin && session.user.institutionSlug !== slug) {
        return { data: null, error: 'Sin permisos' };
    }

    const institution = await prisma.academicInstitution.findUnique({
        where: { slug },
        select: { id: true },
    });
    if (!institution) return { data: null, error: 'Institución no encontrada' };

    const [totalStudents, activeExams, recentResults] = await Promise.all([
        prisma.user.count({
            where: {
                academicInstitutionId: institution.id,
                userRole: { name: 'Estudiante' },
                active: true,
            },
        }),
        prisma.exam.findMany({
            where: {
                active: true,
                groups: {
                    some: {
                        users: {
                            some: { academicInstitutionId: institution.id },
                        },
                    },
                },
            },
            select: {
                id: true,
                title: true,
                results: { select: { id: true } },
                groups: {
                    select: {
                        users: {
                            where: { academicInstitutionId: institution.id },
                            select: { id: true },
                        },
                    },
                },
            },
        }),
        prisma.result.findMany({
            where: {
                student: { academicInstitutionId: institution.id },
            },
            orderBy: { completedAt: 'desc' },
            take: 10,
            select: {
                id: true,
                score: true,
                maxScore: true,
                completedAt: true,
                student: { select: { name: true, lastname: true } },
                exam: { select: { title: true } },
            },
        }),
    ]);

    const allResults = await prisma.result.findMany({
        where: { student: { academicInstitutionId: institution.id } },
        select: { score: true, maxScore: true },
    });

    const avgGrade =
        allResults.length > 0
            ? allResults.reduce((acc, r) => acc + r.score / r.maxScore, 0) / allResults.length
            : null;

    return {
        data: {
            totalStudents,
            activeExams: activeExams.length,
            avgGrade: avgGrade !== null ? Math.round(avgGrade * 100) / 100 : null,
            recentResults: recentResults.map((r) => ({
                id: r.id,
                studentName: `${r.student.name} ${r.student.lastname}`,
                examTitle: r.exam.title,
                score: r.score,
                maxScore: r.maxScore,
                completedAt: r.completedAt,
            })),
            activeExamList: activeExams.map((e) => ({
                id: e.id,
                title: e.title,
                completedCount: e.results.length,
                totalStudents: e.groups.reduce((acc, g) => acc + g.users.length, 0),
            })),
        },
        error: null,
    };
}
