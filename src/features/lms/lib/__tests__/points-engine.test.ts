import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock del cliente Prisma antes de importar el engine.
type TxClient = {
    lmsPointEvent: {
        create: ReturnType<typeof vi.fn>;
        aggregate: ReturnType<typeof vi.fn>;
        count: ReturnType<typeof vi.fn>;
    };
    lmsStreak: {
        findUnique: ReturnType<typeof vi.fn>;
        upsert: ReturnType<typeof vi.fn>;
    };
    lmsLessonProgress: {
        count: ReturnType<typeof vi.fn>;
    };
    lmsSubmission: {
        count: ReturnType<typeof vi.fn>;
    };
    lmsForumPost: {
        count: ReturnType<typeof vi.fn>;
    };
    lmsBadge: {
        findMany: ReturnType<typeof vi.fn>;
    };
    lmsUserBadge: {
        findMany: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
    };
};

const txMock: TxClient = {
    lmsPointEvent: {
        create: vi.fn(),
        aggregate: vi.fn(),
        count: vi.fn(),
    },
    lmsStreak: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
    },
    lmsLessonProgress: { count: vi.fn() },
    lmsSubmission: { count: vi.fn() },
    lmsForumPost: { count: vi.fn() },
    lmsBadge: { findMany: vi.fn() },
    lmsUserBadge: { findMany: vi.fn(), create: vi.fn() },
};

const prismaMock = {
    $transaction: vi.fn(async (cb: (tx: TxClient) => unknown) => cb(txMock)),
};

vi.mock('@/shared/lib/prisma', () => ({
    prisma: prismaMock,
}));

const { awardPointsForEvent } = await import('../points-engine');

beforeEach(() => {
    vi.resetAllMocks();
    // Defaults neutros: usuario sin racha, sin puntos, sin badges, sin actividad.
    txMock.lmsStreak.findUnique.mockResolvedValue(null);
    txMock.lmsStreak.upsert.mockImplementation(async ({ create, update }) => ({
        ...(create ?? update),
    }));
    txMock.lmsPointEvent.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
    txMock.lmsPointEvent.count.mockResolvedValue(0);
    txMock.lmsLessonProgress.count.mockResolvedValue(0);
    txMock.lmsSubmission.count.mockResolvedValue(0);
    txMock.lmsForumPost.count.mockResolvedValue(0);
    txMock.lmsBadge.findMany.mockResolvedValue([]);
    txMock.lmsUserBadge.findMany.mockResolvedValue([]);
    txMock.lmsUserBadge.create.mockResolvedValue({ id: 'ub1' });
});

describe('awardPointsForEvent', () => {
    it('ignora montos negativos o NaN', async () => {
        const r1 = await awardPointsForEvent({
            userId: 'u1',
            sourceType: 'MANUAL',
            amount: -5,
            reason: 'x',
        });
        expect(r1.awarded).toBe(false);
        expect(prismaMock.$transaction).not.toHaveBeenCalled();

        const r2 = await awardPointsForEvent({
            userId: 'u1',
            sourceType: 'MANUAL',
            amount: Number.NaN,
            reason: 'x',
        });
        expect(r2.awarded).toBe(false);
    });

    it('no inserta cuando amount=0 y no hay dedupeKey', async () => {
        const r = await awardPointsForEvent({
            userId: 'u1',
            sourceType: 'MANUAL',
            amount: 0,
            reason: 'marcador',
        });
        expect(r.awarded).toBe(false);
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('crea PointEvent + actualiza racha + devuelve total', async () => {
        txMock.lmsPointEvent.create.mockResolvedValueOnce({
            id: 'pe1',
            createdAt: new Date('2026-06-29T15:00:00Z'),
            amount: 10,
        });
        txMock.lmsPointEvent.aggregate.mockResolvedValueOnce({ _sum: { amount: 10 } });

        const r = await awardPointsForEvent({
            userId: 'u1',
            sourceType: 'ASSIGNMENT_SUBMITTED',
            amount: 10,
            reason: 'Entrega de tarea',
        });

        expect(r.awarded).toBe(true);
        expect(r.eventId).toBe('pe1');
        expect(r.totalPoints).toBe(10);
        expect(r.streak?.current).toBe(1);
        expect(txMock.lmsPointEvent.create).toHaveBeenCalledOnce();
        expect(txMock.lmsStreak.upsert).toHaveBeenCalledOnce();
    });

    it('idempotencia: ignora P2002 sin desbloquear badges', async () => {
        txMock.lmsPointEvent.create.mockRejectedValueOnce({ code: 'P2002' });

        const r = await awardPointsForEvent({
            userId: 'u1',
            sourceType: 'ASSIGNMENT_GRADED',
            amount: 5,
            reason: 'Calificada',
            dedupeKey: 'SUBMISSION:abc:v1',
        });

        expect(r.awarded).toBe(false);
        expect(r.eventId).toBeNull();
        expect(txMock.lmsStreak.upsert).not.toHaveBeenCalled();
    });

    it('desbloquea badge elegible y acredita bonus', async () => {
        txMock.lmsPointEvent.create
            .mockResolvedValueOnce({ id: 'pe1', createdAt: new Date('2026-06-29T15:00:00Z') })
            .mockResolvedValueOnce({ id: 'pe2' }); // bonus
        txMock.lmsPointEvent.aggregate.mockResolvedValueOnce({ _sum: { amount: 100 } });
        txMock.lmsBadge.findMany.mockResolvedValueOnce([
            {
                id: 'b1',
                code: 'hundred_points',
                name: '100 Puntos',
                description: 'Acumulá 100 puntos',
                icon: 'Trophy',
                pointsReward: 25,
                criteria: { type: 'TOTAL_POINTS', threshold: 100 },
                active: true,
            },
        ]);
        txMock.lmsUserBadge.findMany.mockResolvedValueOnce([]);

        const r = await awardPointsForEvent({
            userId: 'u1',
            sourceType: 'MANUAL',
            amount: 50,
            reason: 'Bonus manual',
        });

        expect(r.newBadges).toHaveLength(1);
        expect(r.newBadges[0]?.code).toBe('hundred_points');
        expect(txMock.lmsUserBadge.create).toHaveBeenCalledOnce();
        // El engine acredita 25 pts extra como MANUAL.
        expect(txMock.lmsPointEvent.create).toHaveBeenCalledTimes(2);
        const bonusCall = txMock.lmsPointEvent.create.mock.calls[1]?.[0];
        expect(bonusCall?.data?.amount).toBe(25);
        expect(bonusCall?.data?.dedupeKey).toBe('BADGE_REWARD:b1');
    });

    it('no duplica badge si ya estaba awarded (P2002 en UserBadge)', async () => {
        txMock.lmsPointEvent.create.mockResolvedValueOnce({ id: 'pe1', createdAt: new Date() });
        txMock.lmsPointEvent.aggregate.mockResolvedValueOnce({ _sum: { amount: 100 } });
        txMock.lmsBadge.findMany.mockResolvedValueOnce([
            {
                id: 'b1',
                code: 'hundred_points',
                name: '100 Puntos',
                description: 'x',
                icon: 'Trophy',
                pointsReward: 0,
                criteria: { type: 'TOTAL_POINTS', threshold: 100 },
                active: true,
            },
        ]);
        txMock.lmsUserBadge.findMany.mockResolvedValueOnce([]); // ninguno previo
        txMock.lmsUserBadge.create.mockRejectedValueOnce({ code: 'P2002' });

        const r = await awardPointsForEvent({
            userId: 'u1',
            sourceType: 'MANUAL',
            amount: 50,
            reason: 'x',
        });

        expect(r.newBadges).toHaveLength(0);
    });

    it('atrapa errores inesperados y devuelve awarded=false', async () => {
        txMock.lmsPointEvent.create.mockRejectedValueOnce(new Error('DB down'));

        const r = await awardPointsForEvent({
            userId: 'u1',
            sourceType: 'MANUAL',
            amount: 10,
            reason: 'x',
        });

        expect(r.awarded).toBe(false);
        expect(r.eventId).toBeNull();
    });
});
