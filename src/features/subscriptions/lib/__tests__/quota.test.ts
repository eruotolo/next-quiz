import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
    prismaInstitutionFindUniqueMock,
    prismaPlanLimitsFindUniqueMock,
    prismaPlanLimitsFindFirstMock,
} = vi.hoisted(() => ({
    prismaInstitutionFindUniqueMock: vi.fn(),
    prismaPlanLimitsFindUniqueMock: vi.fn(),
    prismaPlanLimitsFindFirstMock: vi.fn(),
}));

vi.mock('@/shared/lib/prisma', () => ({
    prisma: {
        academicInstitution: {
            findUnique: prismaInstitutionFindUniqueMock,
        },
        planLimits: {
            findUnique: prismaPlanLimitsFindUniqueMock,
            findFirst: prismaPlanLimitsFindFirstMock,
        },
    },
}));

import { getProductLimits } from '../quota';

describe('getProductLimits', () => {
    beforeEach(() => {
        prismaInstitutionFindUniqueMock.mockReset();
        prismaPlanLimitsFindUniqueMock.mockReset();
        prismaPlanLimitsFindFirstMock.mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('devuelve null si la institución no existe', async () => {
        prismaInstitutionFindUniqueMock.mockResolvedValueOnce(null);
        const result = await getProductLimits('inst-x');
        expect(result).toBeNull();
    });

    it('devuelve enabled=false y limits=null si exams está deshabilitado', async () => {
        prismaInstitutionFindUniqueMock.mockResolvedValueOnce({
            plan: 'FREE',
            examsEnabled: false,
            examsPlanCode: 'exams_free',
            lmsEnabled: false,
            lmsPlanCode: null,
        });
        const result = await getProductLimits('inst-1');
        expect(result?.exams).toEqual({
            product: 'exams',
            enabled: false,
            planCode: 'exams_free',
            label: '—',
            limits: null,
        });
        expect(result?.lms.enabled).toBe(false);
    });

    it('resuelve limits del planCode cuando exams está habilitado', async () => {
        prismaInstitutionFindUniqueMock.mockResolvedValueOnce({
            plan: 'COLEGIO',
            examsEnabled: true,
            examsPlanCode: 'exams_colegio',
            lmsEnabled: true,
            lmsPlanCode: 'lms_colegio',
        });
        prismaPlanLimitsFindUniqueMock.mockResolvedValueOnce({
            maxGroups: 30,
            maxAdmins: 5,
            maxProfessors: null,
            maxStudents: 300,
            maxExamsPerYear: null,
            maxPrograms: 15,
            maxCourses: null,
        });
        prismaPlanLimitsFindUniqueMock.mockResolvedValueOnce({
            maxGroups: 30,
            maxAdmins: 5,
            maxProfessors: null,
            maxStudents: 300,
            maxExamsPerYear: null,
            maxPrograms: 15,
            maxCourses: null,
        });
        const result = await getProductLimits('inst-1');
        expect(result?.exams.enabled).toBe(true);
        expect(result?.exams.planCode).toBe('exams_colegio');
        expect(result?.exams.limits?.maxGroups).toBe(30);
        expect(result?.lms.enabled).toBe(true);
        expect(result?.lms.label).toBe('COLEGIO · lms_colegio');
        // Verifica que se llamó con compound key correcto
        expect(prismaPlanLimitsFindUniqueMock).toHaveBeenCalledWith({
            where: { plan_planCode: { plan: 'COLEGIO', planCode: 'exams_colegio' } },
        });
    });

    it('devuelve label=— si el producto está habilitado pero sin planCode', async () => {
        prismaInstitutionFindUniqueMock.mockResolvedValueOnce({
            plan: 'FREE',
            examsEnabled: true,
            examsPlanCode: null,
            lmsEnabled: false,
            lmsPlanCode: null,
        });
        const result = await getProductLimits('inst-1');
        expect(result?.exams.label).toBe('—');
        expect(result?.exams.limits).toBeNull();
    });
});