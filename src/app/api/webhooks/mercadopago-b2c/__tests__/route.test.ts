import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
    prismaWebhookEventCreateMock,
    prismaWebhookEventUpdateMock,
    prismaLmsOrderFindUniqueMock,
    prismaLmsOrderUpdateMock,
    prismaLmsOrderUpdateManyMock,
    prismaLmsCourseFindUniqueMock,
    prismaLmsCourseFindManyMock,
    prismaUserRoleFindUniqueOrThrowMock,
    prismaUserUpsertMock,
    prismaLmsEnrollmentUpsertMock,
    prisma$transactionMock,
    verifyWebhookSignatureMock,
    sendEmailMock,
    buildStudentActivationEmailMock,
} = vi.hoisted(() => ({
    prismaWebhookEventCreateMock: vi.fn(),
    prismaWebhookEventUpdateMock: vi.fn(),
    prismaLmsOrderFindUniqueMock: vi.fn(),
    prismaLmsOrderUpdateMock: vi.fn(),
    prismaLmsOrderUpdateManyMock: vi.fn(),
    prismaLmsCourseFindUniqueMock: vi.fn(),
    prismaLmsCourseFindManyMock: vi.fn(),
    prismaUserRoleFindUniqueOrThrowMock: vi.fn(),
    prismaUserUpsertMock: vi.fn(),
    prismaLmsEnrollmentUpsertMock: vi.fn(),
    prisma$transactionMock: vi.fn(),
    verifyWebhookSignatureMock: vi.fn(),
    sendEmailMock: vi.fn(),
    buildStudentActivationEmailMock: vi.fn(),
}));

vi.mock('@/shared/lib/prisma', () => ({
    prisma: {
        webhookEvent: {
            create: prismaWebhookEventCreateMock,
            update: prismaWebhookEventUpdateMock,
        },
        lmsOrder: {
            findUnique: prismaLmsOrderFindUniqueMock,
            update: prismaLmsOrderUpdateMock,
            updateMany: prismaLmsOrderUpdateManyMock,
        },
        lmsCourse: {
            findUnique: prismaLmsCourseFindUniqueMock,
            findMany: prismaLmsCourseFindManyMock,
        },
        userRole: {
            findUniqueOrThrow: prismaUserRoleFindUniqueOrThrowMock,
        },
        user: {
            upsert: prismaUserUpsertMock,
        },
        lmsEnrollment: {
            upsert: prismaLmsEnrollmentUpsertMock,
        },
        $transaction: prisma$transactionMock,
    },
}));

vi.mock('@/features/subscriptions/lib/mercadopago', () => ({
    verifyWebhookSignature: verifyWebhookSignatureMock,
}));

vi.mock('@/shared/lib/email', () => ({
    sendEmail: sendEmailMock,
    buildStudentActivationEmail: buildStudentActivationEmailMock,
}));

import { NextRequest } from 'next/server';
import { POST } from '../route';

const ORIGINAL_FETCH = globalThis.fetch;

function makeRequest(body: unknown, signatureOk = true): NextRequest {
    verifyWebhookSignatureMock.mockReturnValueOnce(signatureOk);
    return new NextRequest('http://localhost/api/webhooks/mercadopago-b2c', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-signature': 'ts=1,v1=abc',
            'x-request-id': 'req-1',
        },
        body: JSON.stringify(body),
    });
}

describe('webhook /api/webhooks/mercadopago-b2c', () => {
    beforeEach(() => {
        // resetAllMocks (no clearAllMocks) para vaciar también la cola de
        // implementaciones `mockResolvedValueOnce` entre tests. Sin esto, los
        // tests nuevos al final del archivo consumen mocks leftovers de tests
        // anteriores y fallan con datos cruzados.
        vi.resetAllMocks();
        process.env.MP_ACCESS_TOKEN = 'test-token';
        process.env.AUTH_URL = 'https://aulika.cl';
        // $transaction ejecuta la callback con el `prisma` mockeado.
        prisma$transactionMock.mockImplementation(async (cb) => {
            const tx = {
                lmsOrder: {
                    findUnique: prismaLmsOrderFindUniqueMock,
                    update: prismaLmsOrderUpdateMock,
                },
                lmsCourse: {
                    findUnique: prismaLmsCourseFindUniqueMock,
                    findMany: prismaLmsCourseFindManyMock,
                },
                userRole: { findUniqueOrThrow: prismaUserRoleFindUniqueOrThrowMock },
                user: { upsert: prismaUserUpsertMock },
                lmsEnrollment: { upsert: prismaLmsEnrollmentUpsertMock },
            };
            return cb(tx);
        });
        prismaUserRoleFindUniqueOrThrowMock.mockResolvedValue({ id: 'role-1' });
        prismaUserUpsertMock.mockResolvedValue({ id: 'user-1' });
        prismaLmsEnrollmentUpsertMock.mockResolvedValue({ id: 'enr-1' });
        prismaWebhookEventCreateMock.mockResolvedValue({ id: 'event-1' });
        prismaWebhookEventUpdateMock.mockResolvedValue({});
        prismaLmsOrderUpdateManyMock.mockResolvedValue({ count: 0 });
        sendEmailMock.mockResolvedValue(undefined);
        buildStudentActivationEmailMock.mockReturnValue('<html>activation</html>');
        globalThis.fetch = vi.fn() as unknown as typeof fetch;
    });

    afterEach(() => {
        globalThis.fetch = ORIGINAL_FETCH;
        vi.restoreAllMocks();
    });

    it('rechaza JSON inválido con 400', async () => {
        const req = new NextRequest('http://localhost/api/webhooks/mercadopago-b2c', {
            method: 'POST',
            headers: { 'x-signature': 'ts=1,v1=abc', 'x-request-id': 'req-1' },
            body: 'no-json',
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid JSON' });
    });

    it('rechaza firma inválida con 401', async () => {
        const req = makeRequest({ type: 'payment', data: { id: 'mp-1' } }, false);
        const res = await POST(req);
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({ error: 'Invalid signature' });
    });

    it('ignora topics != payment (received:true)', async () => {
        const req = makeRequest({ type: 'merchant_order', data: { id: 'mo-1' } });
        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ received: true });
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('rechaza si falta data.id con 400', async () => {
        const req = makeRequest({ type: 'payment', data: {} });
        const res = await POST(req);
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Missing data.id' });
    });

    it('rechaza si MP_ACCESS_TOKEN no está configurado (500)', async () => {
        delete process.env.MP_ACCESS_TOKEN;
        const req = makeRequest({ type: 'payment', data: { id: 'mp-1' } });
        const res = await POST(req);
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({ error: 'MP not configured' });
    });

    it('happy path: fetch payment, fulfill order, send email, mark event processed', async () => {
        (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'approved',
                external_reference: 'order-1',
                preference_id: 'pref-1',
            }),
        });
        prismaLmsOrderFindUniqueMock.mockResolvedValue({
            id: 'order-1',
            status: 'PENDIENTE',
            courseId: 'c-1',
            categoryId: null,
            kind: 'COURSE',
            course: { title: 'Curso Test', academicInstitutionId: 'inst-aulika-online', academicInstitution: { slug: 'aulika-online' } },
            category: null,
            studentRut: '123456785',
            studentName: 'Juan',
            studentLastname: 'Pérez',
            studentEmail: 'j@test.cl',
        });

        const req = makeRequest({ type: 'payment', data: { id: 'mp-1' } });
        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ received: true });

        // Order fulfillment: upsert user + enrollment + order APROBADO.
        expect(prismaUserUpsertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { rut: '123456785' },
                create: expect.objectContaining({
                    name: 'Juan',
                    rut: '123456785',
                    password: null,
                }),
            }),
        );
        expect(prismaLmsEnrollmentUpsertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId_courseId: { userId: 'user-1', courseId: 'c-1' } },
            }),
        );
        expect(prismaLmsOrderUpdateMock).toHaveBeenCalledWith({
            where: { id: 'order-1' },
            data: {
                status: 'APROBADO',
                mpPaymentId: 'mp-1',
                enrolledUserId: 'user-1',
                enrollmentId: 'enr-1',
            },
        });

        // Email Brevo enviado fuera de la transacción.
        expect(sendEmailMock).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'j@test.cl',
                toName: 'Juan',
                subject: expect.stringContaining('Activá tu cuenta'),
            }),
        );

        // Evento marcado como procesado.
        expect(prismaWebhookEventUpdateMock).toHaveBeenCalledWith({
            where: { id: 'event-1' },
            data: { processed: true, error: null },
        });
    });

    it('idempotente: si la orden ya está APROBADO, no hace upserts y no envía email', async () => {
        (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'approved',
                external_reference: 'order-1',
            }),
        });
        prismaLmsOrderFindUniqueMock.mockResolvedValueOnce({
            id: 'order-1',
            status: 'APROBADO',
            courseId: 'c-1',
            categoryId: null,
            kind: 'COURSE',
            course: { title: 'Curso Test', academicInstitutionId: 'inst-aulika-online', academicInstitution: { slug: 'aulika-online' } },
            category: null,
            studentRut: '123456785',
            studentName: 'Juan',
            studentLastname: 'Pérez',
            studentEmail: 'j@test.cl',
        });

        const req = makeRequest({ type: 'payment', data: { id: 'mp-1' } });
        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(prismaUserUpsertMock).not.toHaveBeenCalled();
        expect(prismaLmsEnrollmentUpsertMock).not.toHaveBeenCalled();
        expect(prismaLmsOrderUpdateMock).not.toHaveBeenCalled();
        expect(sendEmailMock).not.toHaveBeenCalled();
        expect(prismaWebhookEventUpdateMock).toHaveBeenCalledWith({
            where: { id: 'event-1' },
            data: { processed: true, error: null },
        });
    });

    it('payment rejected: marca la orden como RECHAZADO si estaba PENDIENTE', async () => {
        (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'rejected',
                external_reference: 'order-1',
            }),
        });
        prismaLmsOrderUpdateManyMock.mockResolvedValueOnce({ count: 1 });

        const req = makeRequest({ type: 'payment', data: { id: 'mp-1' } });
        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(prismaLmsOrderUpdateManyMock).toHaveBeenCalledWith({
            where: { id: 'order-1', status: 'PENDIENTE' },
            data: { status: 'RECHAZADO' },
        });
        expect(sendEmailMock).not.toHaveBeenCalled();
    });

    it('payment pendiente: no marca RECHAZADO ni APROBADO', async () => {
        (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'pending',
                external_reference: 'order-1',
            }),
        });
        const req = makeRequest({ type: 'payment', data: { id: 'mp-1' } });
        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(prismaLmsOrderUpdateManyMock).not.toHaveBeenCalled();
    });

    it('si fetch de MP falla, el evento queda como processed=true (graceful)', async () => {
        (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: false,
        });
        const req = makeRequest({ type: 'payment', data: { id: 'mp-1' } });
        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(prismaUserUpsertMock).not.toHaveBeenCalled();
        expect(prismaWebhookEventUpdateMock).toHaveBeenCalledWith({
            where: { id: 'event-1' },
            data: { processed: true, error: null },
        });
    });

    it('si la transaction revienta, el evento queda con processed=false + mensaje de error', async () => {
        (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'approved',
                external_reference: 'order-1',
            }),
        });
        prismaLmsOrderFindUniqueMock.mockResolvedValue({
            id: 'order-1',
            status: 'PENDIENTE',
            courseId: 'c-1',
            categoryId: null,
            kind: 'COURSE',
            course: { title: 'Curso Test', academicInstitutionId: 'inst-aulika-online', academicInstitution: { slug: 'aulika-online' } },
            category: null,
            studentRut: '123456785',
            studentName: 'Juan',
            studentLastname: 'Pérez',
            studentEmail: 'j@test.cl',
        });
        prisma$transactionMock.mockImplementationOnce(async () => {
            throw new Error('DB timeout');
        });

        const req = makeRequest({ type: 'payment', data: { id: 'mp-1' } });
        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(prismaWebhookEventUpdateMock).toHaveBeenCalledWith({
            where: { id: 'event-1' },
            data: { processed: false, error: 'DB timeout' },
        });
    });

    it('webhook sin orden en external_reference sale gracefully', async () => {
        (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: 'approved' }),
        });
        const req = makeRequest({ type: 'payment', data: { id: 'mp-1' } });
        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(prismaUserUpsertMock).not.toHaveBeenCalled();
    });

    it('compra del Pack Completo PAES: autoinscribe al alumno en los 7 cursos individuales', async () => {
        (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'approved',
                external_reference: 'order-bundle',
                preference_id: 'pref-bundle',
            }),
        });
        prismaLmsOrderFindUniqueMock.mockResolvedValue({
            id: 'order-bundle',
            status: 'PENDIENTE',
            kind: 'CATEGORY_BUNDLE',
            courseId: null,
            categoryId: 'cat-paes',
            course: null,
            category: {
                name: 'PAES',
                academicInstitutionId: 'inst-aulika-online',
                academicInstitution: { slug: 'aulika-online' },
                courses: [
                    { courseId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
                    { courseId: 'e6c7104f-9e4a-4e2e-8d8a-6b45a278fb6e' },
                    { courseId: 'd3b07384-d113-4ec2-a53b-e10bde486c91' },
                ],
            },
            studentRut: '123456785',
            studentName: 'Juan',
            studentLastname: 'Pérez',
            studentEmail: 'j@test.cl',
        });

        const req = makeRequest({ type: 'payment', data: { id: 'mp-bundle' } });
        const res = await POST(req);
        expect(res.status).toBe(200);

        // La inscripción primaria es al primer curso del bundle (mocks retornan 3,
        // el primero es la "primary" según la implementación).
        expect(prismaLmsEnrollmentUpsertMock).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    userId_courseId: {
                        userId: 'user-1',
                        courseId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                    },
                },
            }),
        );

        // Se autoinscribió en cada uno de los 3 cursos PAES (mocks retornan 3):
        // 1 inscripción primaria + 2 siblings = 3 upserts totales.
        expect(prismaLmsEnrollmentUpsertMock).toHaveBeenCalledTimes(3);
    });

    it('compra de curso individual: NO autoinscribe en otros cursos (findMany no se llama)', async () => {
        (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'approved',
                external_reference: 'order-individual',
                preference_id: 'pref-individual',
            }),
        });
        prismaLmsOrderFindUniqueMock.mockResolvedValue({
            id: 'order-individual',
            status: 'PENDIENTE',
            courseId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            categoryId: null,
            kind: 'COURSE',
            course: { title: 'Curso Test', academicInstitutionId: 'inst-aulika-online', academicInstitution: { slug: 'aulika-online' } },
            category: null,
            studentRut: '123456785',
            studentName: 'Juan',
            studentLastname: 'Pérez',
            studentEmail: 'j@test.cl',
        });

        const req = makeRequest({ type: 'payment', data: { id: 'mp-individual' } });
        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(prismaLmsCourseFindManyMock).not.toHaveBeenCalled();
        expect(prismaLmsEnrollmentUpsertMock).toHaveBeenCalledTimes(1);
    });

    it('brevo email failure no rompe el webhook (best-effort)', async () => {
        (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'approved',
                external_reference: 'order-1',
            }),
        });
        prismaLmsOrderFindUniqueMock.mockResolvedValue({
            id: 'order-1',
            status: 'PENDIENTE',
            courseId: 'c-1',
            categoryId: null,
            kind: 'COURSE',
            course: { title: 'Curso Test', academicInstitutionId: 'inst-aulika-online', academicInstitution: { slug: 'aulika-online' } },
            category: null,
            studentRut: '123456785',
            studentName: 'Juan',
            studentLastname: 'Pérez',
            studentEmail: 'j@test.cl',
        });
        // sendEmail retorna una Promise rejected; el void + .catch la absorbe.
        sendEmailMock.mockImplementationOnce(() => Promise.reject(new Error('Brevo 500')));

        const req = makeRequest({ type: 'payment', data: { id: 'mp-1' } });
        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(prismaWebhookEventUpdateMock).toHaveBeenCalledWith({
            where: { id: 'event-1' },
            data: { processed: true, error: null },
        });
    });
});