'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { ADMIN_ROLES, USER_ROLE, type UserRoleName } from '@/shared/lib/roles';

export interface SearchResult {
    type: 'student' | 'exam' | 'route';
    id: string;
    label: string;
    sub?: string;
    href: string;
}

export async function searchGlobal(
    q: string,
    slug: string,
): Promise<{ data: SearchResult[]; error: string | null }> {
    const session = await auth();
    if (!session?.user) return { data: [], error: 'No autorizado' };
    if (!ADMIN_ROLES.includes(session.user.userRoleName as UserRoleName)) {
        return { data: [], error: 'Sin permisos' };
    }

    const isSuperAdmin = session.user.userRoleName === USER_ROLE.SUPER_ADMIN;
    if (!isSuperAdmin && session.user.institutionSlug !== slug) {
        return { data: [], error: 'Sin permisos' };
    }

    const trimmed = q.trim();
    if (trimmed.length < 2) return { data: [], error: null };

    const institution = await prisma.academicInstitution.findUnique({
        where: { slug },
        select: { id: true },
    });
    if (!institution) return { data: [], error: 'Institución no encontrada' };

    const [students, exams] = await Promise.all([
        prisma.user.findMany({
            where: {
                academicInstitutionId: institution.id,
                userRole: { name: 'Estudiante' },
                OR: [
                    { name: { contains: trimmed, mode: 'insensitive' } },
                    { lastname: { contains: trimmed, mode: 'insensitive' } },
                    { rut: { contains: trimmed } },
                ],
            },
            select: { id: true, name: true, lastname: true, rut: true, group: { select: { name: true } } },
            take: 5,
        }),
        prisma.exam.findMany({
            where: {
                title: { contains: trimmed, mode: 'insensitive' },
                groups: {
                    some: { users: { some: { academicInstitutionId: institution.id } } },
                },
            },
            select: { id: true, title: true, active: true },
            take: 5,
        }),
    ]);

    const results: SearchResult[] = [
        ...students.map((s) => ({
            type: 'student' as const,
            id: s.id,
            label: `${s.name} ${s.lastname}`,
            sub: s.group?.name ?? s.rut,
            href: `/${slug}/students`,
        })),
        ...exams.map((e) => ({
            type: 'exam' as const,
            id: e.id,
            label: e.title,
            sub: e.active ? 'Activo' : 'Inactivo',
            href: `/${slug}/exams/${e.id}/edit`,
        })),
    ];

    return { data: results, error: null };
}
