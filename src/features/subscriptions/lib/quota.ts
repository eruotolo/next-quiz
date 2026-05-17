import type { PlanLimits } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { getPlanLimits } from './plan-limits';

export type QuotaResource = 'exam' | 'group' | 'admin' | 'professor' | 'student';

const RESOURCE_LIMIT_KEY: Record<QuotaResource, keyof PlanLimits> = {
    exam: 'maxExamsPerYear',
    group: 'maxGroups',
    admin: 'maxAdmins',
    professor: 'maxProfessors',
    student: 'maxStudents',
};

export class QuotaExceededError extends Error {
    constructor(
        public readonly resource: QuotaResource,
        public readonly used: number,
        public readonly max: number,
        public readonly plan: string,
    ) {
        super(`Límite de ${resource} alcanzado (${used}/${max}) para el plan ${plan}`);
        this.name = 'QuotaExceededError';
    }
}

async function countResource(institutionId: string, resource: QuotaResource): Promise<number> {
    if (resource === 'exam') {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        return prisma.exam.count({
            where: { academicInstitutionId: institutionId, createdAt: { gte: startOfYear } },
        });
    }

    if (resource === 'group') {
        return prisma.group.count({ where: { academicInstitutionId: institutionId } });
    }

    const roleNameMap: Partial<Record<QuotaResource, string>> = {
        admin: 'Administrador',
        professor: 'Profesor',
        student: 'Estudiante',
    };
    const roleName = roleNameMap[resource];
    if (!roleName) return 0;

    return prisma.user.count({
        where: {
            academicInstitutionId: institutionId,
            active: true,
            userRole: { name: roleName },
        },
    });
}

export async function assertQuota(
    institutionId: string | null | undefined,
    resource: QuotaResource,
    callerRole: string,
    extra = 0,
): Promise<void> {
    if (callerRole === USER_ROLE.SUPER_ADMIN) return;
    if (!institutionId) return;

    const institution = await prisma.academicInstitution.findUnique({
        where: { id: institutionId },
        select: { plan: true },
    });
    if (!institution) return;

    const limits = await getPlanLimits(institution.plan);
    const limitKey = RESOURCE_LIMIT_KEY[resource];
    const max = limits[limitKey] as number | null;
    if (max === null || max === undefined) return;

    const used = await countResource(institutionId, resource);
    if (used + extra >= max) {
        throw new QuotaExceededError(resource, used + extra, max, institution.plan);
    }
}

export type QuotaUsage = {
    resource: QuotaResource;
    used: number;
    max: number | null;
};

export async function getQuotaUsage(institutionId: string): Promise<QuotaUsage[]> {
    const institution = await prisma.academicInstitution.findUnique({
        where: { id: institutionId },
        select: { plan: true },
    });
    if (!institution) return [];

    const limits = await getPlanLimits(institution.plan);
    const resources: QuotaResource[] = ['group', 'student', 'exam'];

    return Promise.all(
        resources.map(async (resource) => {
            const limitKey = RESOURCE_LIMIT_KEY[resource];
            const max = (limits[limitKey] as number | null) ?? null;
            const used = await countResource(institutionId, resource);
            return { resource, used, max };
        }),
    );
}
