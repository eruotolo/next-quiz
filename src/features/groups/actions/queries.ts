'use server';

import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';

interface ProfessorOption {
    id: string;
    name: string;
    lastname: string;
}

export async function getProfessorsForSlug(slug: string): Promise<ProfessorOption[]> {
    const { institutionId } = await requireInstitutionAccess(slug);
    return prisma.user.findMany({
        where: {
            academicInstitutionId: institutionId,
            userRole: { name: { in: [USER_ROLE.PROFESOR, USER_ROLE.ADMIN] } },
        },
        select: { id: true, name: true, lastname: true },
        orderBy: { lastname: 'asc' },
    });
}

/** Cada materia incluye los grupos donde ya está asignada (info visual). */
export interface CourseSectionOption {
    id: string;
    name: string;
    programId: string | null;
    periodId: string;
    groups: { id: string; name: string }[];
}

export interface GroupFormData {
    professors: ProfessorOption[];
    programs: { id: string; name: string }[];
    periods: { id: string; name: string }[];
    courseSections: CourseSectionOption[];
}

/** Datos necesarios para el formulario de grupo (carrera, semestre, ramos). */
export async function getGroupFormData(slug: string): Promise<GroupFormData> {
    const { institutionId } = await requireInstitutionAccess(slug);
    const [professors, programs, periods, courseSections] = await Promise.all([
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
            select: {
                id: true,
                name: true,
                programId: true,
                periodId: true,
                groupLinks: {
                    select: {
                        group: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { name: 'asc' },
        }),
    ]);
    return {
        professors,
        programs,
        periods,
        courseSections: courseSections.map((c) => ({
            id: c.id,
            name: c.name,
            programId: c.programId,
            periodId: c.periodId,
            groups: c.groupLinks.map((link) => ({
                id: link.group.id,
                name: link.group.name,
            })),
        })),
    };
}
