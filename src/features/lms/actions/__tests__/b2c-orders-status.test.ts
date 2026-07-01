import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaLmsOrderFindUniqueMock, prismaUserFindUniqueMock } = vi.hoisted(() => ({
    prismaLmsOrderFindUniqueMock: vi.fn(),
    prismaUserFindUniqueMock: vi.fn(),
}));

vi.mock('@/shared/lib/prisma', () => ({
    prisma: {
        lmsOrder: {
            findUnique: prismaLmsOrderFindUniqueMock,
        },
        user: {
            findUnique: prismaUserFindUniqueMock,
        },
    },
}));

import { getLmsOrderStatus } from '../b2c-orders';

describe('getLmsOrderStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('devuelve error si la orden no existe', async () => {
        prismaLmsOrderFindUniqueMock.mockResolvedValueOnce(null);
        const res = await getLmsOrderStatus('order-x');
        expect(res.error).toMatch(/orden no encontrada/i);
        expect(res.data).toBeNull();
    });

    it('devuelve status PENDIENTE sin activationToken si enrolledUserId es null', async () => {
        prismaLmsOrderFindUniqueMock.mockResolvedValueOnce({
            status: 'PENDIENTE',
            studentEmail: 'j@test.cl',
            courseId: 'c-1',
            categoryId: null,
            kind: 'COURSE',
            course: { title: 'Curso' },
            category: null,
            enrolledUserId: null,
        });
        const res = await getLmsOrderStatus('order-1');
        expect(res.error).toBeNull();
        expect(res.data).toEqual({
            status: 'PENDIENTE',
            activationToken: null,
            activationTokenExp: null,
            productTitle: 'Curso',
            courseId: 'c-1',
            categoryId: null,
            studentEmail: 'j@test.cl',
        });
        expect(prismaUserFindUniqueMock).not.toHaveBeenCalled();
    });

    it('expone activationToken cuando la orden está APROBADO y el user existe', async () => {
        prismaLmsOrderFindUniqueMock.mockResolvedValueOnce({
            status: 'APROBADO',
            studentEmail: 'j@test.cl',
            courseId: 'c-1',
            categoryId: null,
            kind: 'COURSE',
            course: { title: 'Curso' },
            category: null,
            enrolledUserId: 'user-1',
        });
        prismaUserFindUniqueMock.mockResolvedValueOnce({
            activationToken: 'tok-123',
            activationTokenExp: new Date('2026-07-01T00:00:00Z'),
        });
        const res = await getLmsOrderStatus('order-1');
        expect(res.data?.activationToken).toBe('tok-123');
        expect(res.data?.activationTokenExp).toEqual(new Date('2026-07-01T00:00:00Z'));
    });

    it('expose null token si el user fue borrado (huérfano defensivo)', async () => {
        prismaLmsOrderFindUniqueMock.mockResolvedValueOnce({
            status: 'APROBADO',
            studentEmail: 'j@test.cl',
            courseId: 'c-1',
            categoryId: null,
            kind: 'COURSE',
            course: { title: 'Curso' },
            category: null,
            enrolledUserId: 'user-1',
        });
        prismaUserFindUniqueMock.mockResolvedValueOnce(null);
        const res = await getLmsOrderStatus('order-1');
        expect(res.data?.activationToken).toBeNull();
    });

    it('mapea status RECHAZADO', async () => {
        prismaLmsOrderFindUniqueMock.mockResolvedValueOnce({
            status: 'RECHAZADO',
            studentEmail: 'j@test.cl',
            courseId: 'c-1',
            categoryId: null,
            kind: 'COURSE',
            course: { title: 'Curso' },
            category: null,
            enrolledUserId: null,
        });
        const res = await getLmsOrderStatus('order-1');
        expect(res.data?.status).toBe('RECHAZADO');
    });
});