import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaPlanLimitsUpsertMock, prismaInstitutionUpdateManyMock } = vi.hoisted(
    () => ({
        prismaPlanLimitsUpsertMock: vi.fn(),
        prismaInstitutionUpdateManyMock: vi.fn(),
    }),
);

vi.mock('@prisma/client', () => ({
    // No necesitamos tipos en runtime; vitest no requiere la implementación.
}));

import { PLAN_CODES_SEED, seedPlanCodes } from '../plan-codes';

function makeFakePrisma() {
    return {
        planLimits: {
            upsert: prismaPlanLimitsUpsertMock,
        },
        academicInstitution: {
            updateMany: prismaInstitutionUpdateManyMock,
        },
    };
}

describe('PLAN_CODES_SEED', () => {
    it('tiene exactamente los 6 packs esperados', () => {
        const codes = PLAN_CODES_SEED.map((s) => s.planCode).sort();
        expect(codes).toEqual([
            'exams_colegio',
            'exams_docente',
            'exams_free',
            'lms_colegio',
            'lms_free',
            'pack_completo',
        ]);
    });

    it('cada pack tiene una descripción no vacía', () => {
        for (const seed of PLAN_CODES_SEED) {
            expect(seed.description.length).toBeGreaterThan(0);
        }
    });

    it('pack_completo está bajo INSTITUCIONAL', () => {
        const pack = PLAN_CODES_SEED.find((s) => s.planCode === 'pack_completo');
        expect(pack?.plan).toBe('INSTITUCIONAL');
    });
});

describe('seedPlanCodes', () => {
    beforeEach(() => {
        prismaPlanLimitsUpsertMock.mockReset();
        prismaInstitutionUpdateManyMock.mockReset();
        prismaPlanLimitsUpsertMock.mockResolvedValue({});
        prismaInstitutionUpdateManyMock.mockResolvedValue({ count: 0 });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('upserta los 6 packs por compound key (plan, planCode)', async () => {
        await seedPlanCodes(makeFakePrisma() as never);
        expect(prismaPlanLimitsUpsertMock).toHaveBeenCalledTimes(6);
        const firstCall = prismaPlanLimitsUpsertMock.mock.calls[0]?.[0];
        expect(firstCall?.where).toEqual({
            plan_planCode: {
                plan: PLAN_CODES_SEED[0]?.plan,
                planCode: PLAN_CODES_SEED[0]?.planCode,
            },
        });
    });

    it('hace backfill de los 4 planes comerciales', async () => {
        await seedPlanCodes(makeFakePrisma() as never);
        // 4 planes: FREE, DOCENTE, COLEGIO, INSTITUCIONAL.
        expect(prismaInstitutionUpdateManyMock).toHaveBeenCalledTimes(4);
    });

    it('habilita LMS para COLEGIO e INSTITUCIONAL pero no para FREE/DOCENTE', async () => {
        await seedPlanCodes(makeFakePrisma() as never);
        const lmsUpdateCalls = prismaInstitutionUpdateManyMock.mock.calls
            .map((c) => c[0])
            .filter((args) => 'lmsEnabled' in (args?.data ?? {}));
        expect(lmsUpdateCalls).toHaveLength(4);
        const byPlan = Object.fromEntries(
            lmsUpdateCalls.map((args: { where: { plan: string }; data: { lmsEnabled: boolean } }) => [
                args.where.plan,
                args.data.lmsEnabled,
            ]),
        );
        expect(byPlan.FREE).toBe(false);
        expect(byPlan.DOCENTE).toBe(false);
        expect(byPlan.COLEGIO).toBe(true);
        expect(byPlan.INSTITUCIONAL).toBe(true);
    });

    it('es idempotente: re-correr no duplica', async () => {
        prismaPlanLimitsUpsertMock.mockResolvedValue({});
        prismaInstitutionUpdateManyMock.mockResolvedValue({ count: 0 });
        await seedPlanCodes(makeFakePrisma() as never);
        await seedPlanCodes(makeFakePrisma() as never);
        expect(prismaPlanLimitsUpsertMock).toHaveBeenCalledTimes(12);
        // El idempotencia real la da upsert por compound key, no la lógica interna.
    });

    it('reporta counts de upserts + backfilled', async () => {
        prismaPlanLimitsUpsertMock.mockResolvedValue({});
        prismaInstitutionUpdateManyMock.mockResolvedValueOnce({ count: 5 });
        prismaInstitutionUpdateManyMock.mockResolvedValueOnce({ count: 3 });
        prismaInstitutionUpdateManyMock.mockResolvedValueOnce({ count: 8 });
        prismaInstitutionUpdateManyMock.mockResolvedValueOnce({ count: 1 });
        const result = await seedPlanCodes(makeFakePrisma() as never);
        expect(result.upserted).toBe(6);
        expect(result.backfilled).toBe(17);
    });
});