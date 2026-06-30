import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
    prismaUserFindFirstMock,
    prismaAcademicInstitutionFindUniqueMock,
    prismaUserUpdateMock,
    prismaLmsOrderUpdateManyMock,
    prismaUserFindUniqueMock,
    prisma$transactionMock,
    logAuditMock,
    createStudentAuthSessionMock,
    bcryptHashMock,
    getInstitutionFlagsMock,
} = vi.hoisted(() => ({
    prismaUserFindFirstMock: vi.fn(),
    prismaAcademicInstitutionFindUniqueMock: vi.fn(),
    prismaUserUpdateMock: vi.fn(),
    prismaLmsOrderUpdateManyMock: vi.fn(),
    prismaUserFindUniqueMock: vi.fn(),
    prisma$transactionMock: vi.fn(),
    logAuditMock: vi.fn(),
    createStudentAuthSessionMock: vi.fn(),
    bcryptHashMock: vi.fn(),
    getInstitutionFlagsMock: vi.fn(),
}));

vi.mock('@/shared/lib/prisma', () => ({
    prisma: {
        user: {
            findFirst: prismaUserFindFirstMock,
            findUnique: prismaUserFindUniqueMock,
            update: prismaUserUpdateMock,
        },
        academicInstitution: {
            findUnique: prismaAcademicInstitutionFindUniqueMock,
        },
        lmsOrder: {
            updateMany: prismaLmsOrderUpdateManyMock,
        },
        $transaction: prisma$transactionMock,
    },
}));

vi.mock('bcryptjs', () => ({
    default: {
        hash: bcryptHashMock,
    },
}));

vi.mock('@/shared/lib/audit', () => ({
    logAudit: logAuditMock,
}));

vi.mock('@/features/audit/lib/actions', () => ({
    AUDIT_ACTION: { STUDENT_LOGIN_SUCCESS: 'STUDENT_LOGIN_SUCCESS' },
}));

vi.mock('@/features/exam-session/lib/session', () => ({
    createStudentAuthSession: createStudentAuthSessionMock,
}));

vi.mock('@/features/auth/lib/institution-flags', () => ({
    getInstitutionFlags: getInstitutionFlagsMock,
}));

import { activateB2cAccount } from '../b2c-activation';

const VALID_INPUT = {
    token: 'tok-valid',
    password: 'Aulika2026',
    confirmPassword: 'Aulika2026',
};

describe('activateB2cAccount', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        bcryptHashMock.mockResolvedValue('hashed-pw');
        logAuditMock.mockResolvedValue(undefined);
        getInstitutionFlagsMock.mockResolvedValue({
            examsEnabled: true,
            lmsEnabled: true,
            examsPlanCode: 'exams_colegio',
            lmsPlanCode: 'lms_colegio',
        });
        // $transaction ejecuta la callback con el `prisma` mockeado.
        prisma$transactionMock.mockImplementation(async (cb) =>
            cb({
                user: { update: prismaUserUpdateMock },
                lmsOrder: { updateMany: prismaLmsOrderUpdateManyMock },
            }),
        );
        prismaUserUpdateMock.mockResolvedValue({});
        prismaLmsOrderUpdateManyMock.mockResolvedValue({ count: 0 });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('rechaza payload inválido (Zod)', async () => {
        const res = await activateB2cAccount({ token: '', password: 'short', confirmPassword: 'diferente' });
        expect(res.error).toBeTruthy();
        expect(prismaUserFindFirstMock).not.toHaveBeenCalled();
    });

    it('rechaza token inválido (sin user)', async () => {
        prismaUserFindFirstMock.mockResolvedValueOnce(null);
        const res = await activateB2cAccount(VALID_INPUT);
        expect(res.error).toMatch(/inválido o expirado/i);
    });

    it('rechaza token expirado', async () => {
        prismaUserFindFirstMock.mockResolvedValueOnce({
            id: 'user-1',
            email: 'j@test.cl',
            academicInstitutionId: 'inst-1',
            activationTokenExp: new Date('2026-01-01T00:00:00Z'),
        });
        const res = await activateB2cAccount(VALID_INPUT);
        expect(res.error).toMatch(/expir/i);
    });

    it('rechaza token sin activationTokenExp', async () => {
        prismaUserFindFirstMock.mockResolvedValueOnce({
            id: 'user-1',
            email: 'j@test.cl',
            academicInstitutionId: 'inst-1',
            activationTokenExp: null,
        });
        const res = await activateB2cAccount(VALID_INPUT);
        expect(res.error).toMatch(/expir/i);
    });

    it('rechaza si el user no tiene institución', async () => {
        prismaUserFindFirstMock.mockResolvedValueOnce({
            id: 'user-1',
            email: 'j@test.cl',
            academicInstitutionId: null,
            activationTokenExp: new Date('2030-01-01'),
        });
        const res = await activateB2cAccount(VALID_INPUT);
        expect(res.error).toMatch(/instituci/i);
    });

    it('rechaza si la institución ya no existe', async () => {
        prismaUserFindFirstMock.mockResolvedValueOnce({
            id: 'user-1',
            email: 'j@test.cl',
            academicInstitutionId: 'inst-borrada',
            activationTokenExp: new Date('2030-01-01'),
        });
        prismaAcademicInstitutionFindUniqueMock.mockResolvedValueOnce(null);
        const res = await activateB2cAccount(VALID_INPUT);
        expect(res.error).toMatch(/instituci/i);
    });

    it('happy path: hashea password, limpia tokens, vincula órdenes huérfanas, abre sesión', async () => {
        const exp = new Date('2030-01-01T00:00:00Z');
        prismaUserFindFirstMock.mockResolvedValueOnce({
            id: 'user-1',
            email: 'j@test.cl',
            academicInstitutionId: 'inst-1',
            activationTokenExp: exp,
        });
        prismaAcademicInstitutionFindUniqueMock.mockResolvedValueOnce({
            id: 'inst-1',
            slug: 'colegio-demo',
            plan: 'COLEGIO',
        });
        prismaUserFindUniqueMock.mockResolvedValueOnce({ groupId: 'group-1' });
        prismaLmsOrderUpdateManyMock.mockResolvedValueOnce({ count: 1 });

        const res = await activateB2cAccount(VALID_INPUT);

        expect(res.error).toBeNull();
        expect(res.data).toEqual({
            studentId: 'user-1',
            institutionSlug: 'colegio-demo',
        });

        expect(bcryptHashMock).toHaveBeenCalledWith('Aulika2026', 10);
        expect(prismaUserUpdateMock).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            data: {
                password: 'hashed-pw',
                active: true,
                activationToken: null,
                activationTokenExp: null,
            },
        });
        expect(prismaLmsOrderUpdateManyMock).toHaveBeenCalledWith({
            where: { enrolledUserId: null, status: 'APROBADO' },
            data: { enrolledUserId: 'user-1' },
        });
        expect(createStudentAuthSessionMock).toHaveBeenCalledWith({
            studentId: 'user-1',
            groupId: 'group-1',
        });
        expect(logAuditMock).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'STUDENT_LOGIN_SUCCESS',
                metadata: { source: 'b2c-activation' },
            }),
        );
    });

    it('no abre sesión jose si el user no tiene groupId', async () => {
        prismaUserFindFirstMock.mockResolvedValueOnce({
            id: 'user-1',
            email: 'j@test.cl',
            academicInstitutionId: 'inst-1',
            activationTokenExp: new Date('2030-01-01'),
        });
        prismaAcademicInstitutionFindUniqueMock.mockResolvedValueOnce({
            id: 'inst-1',
            slug: 'colegio-demo',
            plan: 'COLEGIO',
        });
        prismaUserFindUniqueMock.mockResolvedValueOnce({ groupId: null });

        const res = await activateB2cAccount(VALID_INPUT);
        expect(res.error).toBeNull();
        expect(createStudentAuthSessionMock).not.toHaveBeenCalled();
    });

    it('no rompe si getInstitutionFlags falla (best-effort)', async () => {
        prismaUserFindFirstMock.mockResolvedValueOnce({
            id: 'user-1',
            email: 'j@test.cl',
            academicInstitutionId: 'inst-1',
            activationTokenExp: new Date('2030-01-01'),
        });
        prismaAcademicInstitutionFindUniqueMock.mockResolvedValueOnce({
            id: 'inst-1',
            slug: 'colegio-demo',
            plan: 'COLEGIO',
        });
        prismaUserFindUniqueMock.mockResolvedValueOnce({ groupId: 'group-1' });
        getInstitutionFlagsMock.mockRejectedValueOnce(new Error('boom'));

        const res = await activateB2cAccount(VALID_INPUT);
        expect(res.error).toBeNull();
    });
});