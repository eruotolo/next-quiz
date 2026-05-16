'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { ADMIN_ROLES, USER_ROLE, type UserRoleName } from '@/shared/lib/roles';

export interface GroupWithStats {
    id: string;
    name: string;
    stream: string | null;
    tutorName: string | null;
    studentCount: number;
    examCount: number;
    avgScore: number | null;
}

export async function getGroupsWithStats(
    slug: string,
): Promise<{ data: GroupWithStats[]; error: string | null }> {
    const session = await auth();
    if (!session?.user) return { data: [], error: 'No autorizado' };
    if (!ADMIN_ROLES.includes(session.user.userRoleName as UserRoleName)) {
        return { data: [], error: 'Sin permisos' };
    }

    const isSuperAdmin = session.user.userRoleName === USER_ROLE.SUPER_ADMIN;
    if (!isSuperAdmin && session.user.institutionSlug !== slug) {
        return { data: [], error: 'Sin permisos' };
    }

    const institution = await prisma.academicInstitution.findUnique({
        where: { slug },
        select: { id: true },
    });
    if (!institution) return { data: [], error: 'Institución no encontrada' };

    const groups = await prisma.group.findMany({
        where: {
            users: { some: { academicInstitutionId: institution.id } },
        },
        select: {
            id: true,
            name: true,
            stream: true,
            tutor: { select: { name: true, lastname: true } },
            users: {
                where: { academicInstitutionId: institution.id },
                select: {
                    id: true,
                    results: { select: { score: true, maxScore: true } },
                },
            },
            _count: { select: { exams: true } },
        },
        orderBy: { name: 'asc' },
    });

    const data: GroupWithStats[] = groups.map((g) => {
        const allResults = g.users.flatMap((u) => u.results);
        const avgScore =
            allResults.length > 0
                ? allResults.reduce((acc, r) => acc + r.score / r.maxScore, 0) / allResults.length
                : null;

        return {
            id: g.id,
            name: g.name,
            stream: g.stream,
            tutorName: g.tutor ? `${g.tutor.name} ${g.tutor.lastname}` : null,
            studentCount: g.users.length,
            examCount: g._count.exams,
            avgScore: avgScore !== null ? Math.round(avgScore * 100) / 100 : null,
        };
    });

    return { data, error: null };
}
