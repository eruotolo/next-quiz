import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { getPlanLimits } from './plan-limits';

export type QuotaResource = 'exam' | 'group' | 'admin' | 'professor' | 'student';

interface EffectiveLimits {
    maxGroups: number | null;
    maxAdmins: number | null;
    maxProfessors: number | null;
    maxStudents: number | null;
    maxExamsPerYear: number | null;
}

const RESOURCE_LIMIT_KEY: Record<QuotaResource, keyof EffectiveLimits> = {
    exam: 'maxExamsPerYear',
    group: 'maxGroups',
    admin: 'maxAdmins',
    professor: 'maxProfessors',
    student: 'maxStudents',
};

/**
 * Resuelve los límites efectivos de una institución: si tiene un plan interno
 * (CustomPlan) asignado, manda ese; si no, los del plan comercial.
 */
async function getEffectiveLimits(
    institutionId: string,
): Promise<{ limits: EffectiveLimits; label: string } | null> {
    const institution = await prisma.academicInstitution.findUnique({
        where: { id: institutionId },
        select: {
            plan: true,
            customPlan: {
                select: {
                    name: true,
                    maxGroups: true,
                    maxAdmins: true,
                    maxProfessors: true,
                    maxStudents: true,
                    maxExamsPerYear: true,
                },
            },
        },
    });
    if (!institution) return null;

    if (institution.customPlan) {
        const c = institution.customPlan;
        return {
            limits: {
                maxGroups: c.maxGroups,
                maxAdmins: c.maxAdmins,
                maxProfessors: c.maxProfessors,
                maxStudents: c.maxStudents,
                maxExamsPerYear: c.maxExamsPerYear,
            },
            label: c.name,
        };
    }

    const pl = await getPlanLimits(institution.plan);
    return {
        limits: {
            maxGroups: pl.maxGroups,
            maxAdmins: pl.maxAdmins,
            maxProfessors: pl.maxProfessors,
            maxStudents: pl.maxStudents,
            maxExamsPerYear: pl.maxExamsPerYear,
        },
        label: institution.plan,
    };
}

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

async function countResource(
    institutionId: string,
    resource: QuotaResource,
    demoSessionId?: string | null,
): Promise<number> {
    if (resource === 'exam') {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        return prisma.exam.count({
            where: {
                academicInstitutionId: institutionId,
                createdAt: { gte: startOfYear },
                // Modo demo: el cupo FREE de exámenes es por sesión del visitante.
                ...(demoSessionId ? { demoSessionId } : {}),
            },
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
    demoSessionId?: string | null,
): Promise<void> {
    if (callerRole === USER_ROLE.SUPER_ADMIN) return;
    if (!institutionId) return;

    const effective = await getEffectiveLimits(institutionId);
    if (!effective) return;

    const limitKey = RESOURCE_LIMIT_KEY[resource];
    const max = effective.limits[limitKey];
    if (max === null || max === undefined) return;

    const used = await countResource(institutionId, resource, demoSessionId);
    if (used + extra >= max) {
        throw new QuotaExceededError(resource, used + extra, max, effective.label);
    }
}

export type QuotaUsage = {
    resource: QuotaResource;
    used: number;
    max: number | null;
};

export async function getQuotaUsage(institutionId: string): Promise<QuotaUsage[]> {
    const effective = await getEffectiveLimits(institutionId);
    if (!effective) return [];

    const resources: QuotaResource[] = ['group', 'student', 'exam'];

    return Promise.all(
        resources.map(async (resource) => {
            const limitKey = RESOURCE_LIMIT_KEY[resource];
            const max = effective.limits[limitKey] ?? null;
            const used = await countResource(institutionId, resource);
            return { resource, used, max };
        }),
    );
}
