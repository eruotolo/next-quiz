import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaFindUniqueMock } = vi.hoisted(() => ({
    prismaFindUniqueMock: vi.fn(),
}));

vi.mock('@/shared/lib/prisma', () => ({
    prisma: {
        academicInstitution: {
            findUnique: prismaFindUniqueMock,
        },
    },
}));

import { getInstitutionFlags } from '../institution-flags';

describe('getInstitutionFlags', () => {
    beforeEach(() => {
        prismaFindUniqueMock.mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('devuelve flags desde la DB cuando la institución existe', async () => {
        prismaFindUniqueMock.mockResolvedValueOnce({
            examsEnabled: true,
            lmsEnabled: true,
            examsPlanCode: 'exams_colegio',
            lmsPlanCode: 'lms_colegio',
        });
        const flags = await getInstitutionFlags('inst-1', 'COLEGIO');
        expect(flags).toEqual({
            examsEnabled: true,
            lmsEnabled: true,
            examsPlanCode: 'exams_colegio',
            lmsPlanCode: 'lms_colegio',
        });
        expect(prismaFindUniqueMock).toHaveBeenCalledWith({
            where: { id: 'inst-1' },
            select: {
                examsEnabled: true,
                lmsEnabled: true,
                examsPlanCode: true,
                lmsPlanCode: true,
            },
        });
    });

    it('fallback por plan FREE si institutionId es null', async () => {
        const flags = await getInstitutionFlags(null, 'FREE');
        expect(flags).toEqual({
            examsEnabled: true,
            lmsEnabled: false,
            examsPlanCode: null,
            lmsPlanCode: null,
        });
        expect(prismaFindUniqueMock).not.toHaveBeenCalled();
    });

    it('fallback por plan FREE si la institución no existe', async () => {
        prismaFindUniqueMock.mockResolvedValueOnce(null);
        const flags = await getInstitutionFlags('inst-1', 'FREE');
        expect(flags.lmsEnabled).toBe(false);
        expect(flags.examsEnabled).toBe(true);
    });

    it('fallback por plan COLEGIO si Prisma falla (DB sin migrar)', async () => {
        prismaFindUniqueMock.mockRejectedValueOnce(new Error('column does not exist'));
        const flags = await getInstitutionFlags('inst-1', 'COLEGIO');
        expect(flags.lmsEnabled).toBe(true);
        expect(flags.examsEnabled).toBe(true);
    });

    it('fallback heurístico: LMS activo para planes pagos', async () => {
        prismaFindUniqueMock.mockRejectedValueOnce(new Error('boom'));
        for (const plan of ['FREE', 'DOCENTE', 'COLEGIO', 'INSTITUCIONAL'] as const) {
            const flags = await getInstitutionFlags('inst-1', plan);
            const expectedLms = plan !== 'FREE';
            expect(flags.lmsEnabled).toBe(expectedLms);
            expect(flags.examsEnabled).toBe(true);
        }
    });
});
