import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
    prismaInstitutionFindUniqueMock,
    prismaLmsCourseFindFirstMock,
    prismaUserFindFirstMock,
    prismaLmsOrderFindFirstMock,
    prismaLmsOrderCreateMock,
    prismaLmsOrderUpdateMock,
    createPreferenceMock,
    logAuditMock,
} = vi.hoisted(() => ({
    prismaInstitutionFindUniqueMock: vi.fn(),
    prismaLmsCourseFindFirstMock: vi.fn(),
    prismaUserFindFirstMock: vi.fn(),
    prismaLmsOrderFindFirstMock: vi.fn(),
    prismaLmsOrderCreateMock: vi.fn(),
    prismaLmsOrderUpdateMock: vi.fn(),
    createPreferenceMock: vi.fn(),
    logAuditMock: vi.fn(),
}));

vi.mock('@/shared/lib/prisma', () => ({
    prisma: {
        academicInstitution: {
            findUnique: prismaInstitutionFindUniqueMock,
        },
        lmsCourse: {
            findFirst: prismaLmsCourseFindFirstMock,
        },
        user: {
            findFirst: prismaUserFindFirstMock,
        },
        lmsOrder: {
            findFirst: prismaLmsOrderFindFirstMock,
            create: prismaLmsOrderCreateMock,
            update: prismaLmsOrderUpdateMock,
        },
    },
}));

vi.mock('@/features/subscriptions/lib/mercadopago', () => ({
    createPreference: createPreferenceMock,
}));

vi.mock('@/shared/lib/audit', () => ({
    logAudit: logAuditMock,
}));

vi.mock('@/features/audit/lib/actions', () => ({
    AUDIT_ACTION: { SUBSCRIPTION_CREATE: 'SUBSCRIPTION_CREATE' },
}));

import { createLmsCheckoutPreference } from '../b2c-orders';

const VALID_INPUT = {
    kind: 'COURSE' as const,
    courseId: '11111111-1111-4111-8111-111111111111',
    studentRut: '12.345.678-5',
    studentName: 'Juan',
    studentLastname: 'Pérez',
    studentEmail: 'Juan@Test.CL',
    acceptTerms: true,
};

describe('createLmsCheckoutPreference', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.MP_BACK_URL_BASE = 'https://www.aulika.cl';
        process.env.MP_ACCESS_TOKEN = 'test-token';
        prismaInstitutionFindUniqueMock.mockResolvedValue({
            id: 'inst-1',
            name: 'Aulika Online',
            active: true,
        });
        prismaLmsCourseFindFirstMock.mockResolvedValue({
            id: '11111111-1111-4111-8111-111111111111',
            title: 'Curso Test',
            price: 19990,
        });
        prismaUserFindFirstMock.mockResolvedValue(null);
        prismaLmsOrderFindFirstMock.mockResolvedValue(null);
        prismaLmsOrderCreateMock.mockResolvedValue({ id: 'order-1' });
        prismaLmsOrderUpdateMock.mockResolvedValue({ id: 'order-1' });
        createPreferenceMock.mockResolvedValue({
            preferenceId: 'mp-pref-1',
            initPoint: 'https://mp.cl/checkout',
        });
        logAuditMock.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('rechaza payload inválido (Zod)', async () => {
        const res = await createLmsCheckoutPreference({
            courseId: 'invalid',
            studentRut: '12.345.678-0',
            studentName: 'J',
            studentLastname: 'P',
            studentEmail: 'no-email',
            acceptTerms: false,
        });
        expect(res.error).toBeTruthy();
        expect(res.data).toBeNull();
        expect(prismaInstitutionFindUniqueMock).not.toHaveBeenCalled();
    });

    it('rechaza si la institución vendedora B2C no existe', async () => {
        prismaInstitutionFindUniqueMock.mockResolvedValueOnce(null);
        const res = await createLmsCheckoutPreference(VALID_INPUT);
        expect(res.error).toMatch(/catálogo b2c no está disponible/i);
        expect(res.data).toBeNull();
    });

    it('rechaza si la institución vendedora está inactiva', async () => {
        prismaInstitutionFindUniqueMock.mockResolvedValueOnce({
            id: 'inst-1',
            name: 'Aulika Online',
            active: false,
        });
        const res = await createLmsCheckoutPreference(VALID_INPUT);
        expect(res.error).toMatch(/catálogo b2c no está disponible/i);
    });

    it('rechaza si el curso no es público o no existe', async () => {
        prismaLmsCourseFindFirstMock.mockResolvedValueOnce(null);
        const res = await createLmsCheckoutPreference(VALID_INPUT);
        expect(res.error).toMatch(/curso no disponible/i);
    });

    it('rechaza si el precio es 0 o null (curso gratuito)', async () => {
        prismaLmsCourseFindFirstMock.mockResolvedValueOnce({
            id: '11111111-1111-4111-8111-111111111111',
            title: 'Gratis',
            price: 0,
        });
        const res = await createLmsCheckoutPreference(VALID_INPUT);
        expect(res.error).toMatch(/gratuito/i);
    });

    it('rechaza si el RUT/email pertenece a otra institución (anti-IDOR)', async () => {
        prismaUserFindFirstMock.mockResolvedValueOnce({ id: 'user-otro' });
        const res = await createLmsCheckoutPreference(VALID_INPUT);
        expect(res.error).toMatch(/otra instituci/i);
        expect(prismaLmsOrderCreateMock).not.toHaveBeenCalled();
    });

    it('rechaza si ya existe una orden APROBADO para el mismo curso+RUT', async () => {
        prismaLmsOrderFindFirstMock.mockResolvedValueOnce({ id: 'old-order' });
        const res = await createLmsCheckoutPreference(VALID_INPUT);
        expect(res.error).toMatch(/ya compraste/i);
        expect(prismaLmsOrderCreateMock).not.toHaveBeenCalled();
    });

    it('normaliza RUT y lowercase email al crear la orden', async () => {
        await createLmsCheckoutPreference(VALID_INPUT);
        expect(prismaLmsOrderCreateMock).toHaveBeenCalledWith({
            data: expect.objectContaining({
                studentRut: '123456785',
                studentEmail: 'juan@test.cl',
            }),
            select: { id: true },
        });
    });

    it('happy path: crea orden, llama MP, actualiza mpPreferenceId y devuelve initPoint', async () => {
        const res = await createLmsCheckoutPreference(VALID_INPUT);
        expect(res.error).toBeNull();
        expect(res.data).toEqual({
            orderId: 'order-1',
            initPoint: 'https://mp.cl/checkout',
        });
        expect(createPreferenceMock).toHaveBeenCalledWith(
            expect.objectContaining({
                item: expect.objectContaining({
                    title: 'Curso Test · Aulika Online',
                    unitPrice: 19990,
                }),
                payerEmail: 'juan@test.cl',
                externalReference: 'order-1',
                backUrls: expect.objectContaining({
                    success: expect.stringContaining('status=approved'),
                    failure: expect.stringContaining('status=rejected'),
                    pending: expect.stringContaining('status=pending'),
                }),
            }),
        );
        expect(prismaLmsOrderUpdateMock).toHaveBeenCalledWith({
            where: { id: 'order-1' },
            data: { mpPreferenceId: 'mp-pref-1' },
        });
        expect(logAuditMock).toHaveBeenCalled();
    });

    it('happy path: backUrls no contienen slug y usan rutas planas', async () => {
        const res = await createLmsCheckoutPreference(VALID_INPUT);
        expect(res.error).toBeNull();
        const firstCall = createPreferenceMock.mock.calls[0];
        expect(firstCall).toBeDefined();
        const call = firstCall![0];
        expect(call.backUrls.success).toContain(
            'https://www.aulika.cl/checkout/11111111-1111-4111-8111-111111111111/exito',
        );
        expect(call.backUrls.success).not.toContain('/aulika-online/');
    });

    it('si MP falla, marca la orden como RECHAZADO y devuelve error', async () => {
        createPreferenceMock.mockRejectedValueOnce(new Error('MP timeout'));
        const res = await createLmsCheckoutPreference(VALID_INPUT);
        expect(res.error).toMatch(/mp timeout/i);
        expect(res.data).toBeNull();
        expect(prismaLmsOrderUpdateMock).toHaveBeenCalledWith({
            where: { id: 'order-1' },
            data: { status: 'RECHAZADO' },
        });
    });

    it('si MP falla con error genérico, mensaje legible', async () => {
        createPreferenceMock.mockRejectedValueOnce(new Error('Network error'));
        const res = await createLmsCheckoutPreference(VALID_INPUT);
        expect(res.error).toBe('Network error');
    });
});
