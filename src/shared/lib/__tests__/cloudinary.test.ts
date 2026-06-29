import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
    prismaFindManyMock,
    cloudinaryConfigMock,
    cloudinaryUploadStreamMock,
    cloudinaryDestroyMock,
} = vi.hoisted(() => ({
    prismaFindManyMock: vi.fn(),
    cloudinaryConfigMock: vi.fn(),
    cloudinaryUploadStreamMock: vi.fn(),
    cloudinaryDestroyMock: vi.fn(),
}));

vi.mock('@/shared/lib/prisma', () => ({
    prisma: {
        appConfig: {
            findMany: prismaFindManyMock,
        },
    },
}));

vi.mock('cloudinary', () => ({
    v2: {
        config: cloudinaryConfigMock,
        uploader: {
            upload_stream: cloudinaryUploadStreamMock,
            destroy: cloudinaryDestroyMock,
        },
    },
}));

import { isCloudinaryConfigured, uploadCertificatePdf, deleteCertificatePdf } from '../cloudinary';
import { APP_CONFIG_KEY } from '@/features/config/lib/app-config-keys';

describe('cloudinary wrapper', () => {
    beforeEach(() => {
        prismaFindManyMock.mockReset();
        cloudinaryConfigMock.mockReset();
        cloudinaryUploadStreamMock.mockReset();
        cloudinaryDestroyMock.mockReset();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('returns false from isCloudinaryConfigured when no creds', async () => {
        prismaFindManyMock.mockResolvedValueOnce([]);
        const result = await isCloudinaryConfigured();
        expect(result).toBe(false);
    });

    it('returns true from isCloudinaryConfigured when all 3 creds present', async () => {
        prismaFindManyMock.mockResolvedValueOnce([
            { key: APP_CONFIG_KEY.CLOUDINARY_CLOUD_NAME, value: 'mycloud' },
            { key: APP_CONFIG_KEY.CLOUDINARY_API_KEY, value: '123' },
            { key: APP_CONFIG_KEY.CLOUDINARY_API_SECRET, value: 'secret' },
        ]);
        const result = await isCloudinaryConfigured();
        expect(result).toBe(true);
    });

    it('uploadCertificatePdf returns friendly error when not configured', async () => {
        prismaFindManyMock.mockResolvedValueOnce([]);
        const result = await uploadCertificatePdf(Buffer.from('test'), 'cert_abc');
        expect(result.uploaded).toBe(false);
        expect(result.error).toContain('Configurá las credenciales');
    });

    it('uploadCertificatePdf uploads to Cloudinary when configured', async () => {
        prismaFindManyMock.mockResolvedValueOnce([
            { key: APP_CONFIG_KEY.CLOUDINARY_CLOUD_NAME, value: 'mycloud' },
            { key: APP_CONFIG_KEY.CLOUDINARY_API_KEY, value: '123' },
            { key: APP_CONFIG_KEY.CLOUDINARY_API_SECRET, value: 'secret' },
        ]);

        cloudinaryUploadStreamMock.mockImplementationOnce(
            (_opts: unknown, cb: (err: unknown, result: unknown) => void) => {
                cb(null, { secure_url: 'https://res.cloudinary.com/demo/raw/upload/cert_abc.pdf', public_id: 'lms/certificates/cert_abc' });
                return { end: (): void => undefined };
            },
        );

        const result = await uploadCertificatePdf(Buffer.from('pdf-content'), 'cert_abc');
        expect(result.uploaded).toBe(true);
        expect(result.url).toContain('cloudinary.com');
        expect(cloudinaryConfigMock).toHaveBeenCalledWith(
            expect.objectContaining({ cloud_name: 'mycloud', api_key: '123', api_secret: 'secret' }),
        );
    });

    it('uploadCertificatePdf handles upload error gracefully', async () => {
        prismaFindManyMock.mockResolvedValueOnce([
            { key: APP_CONFIG_KEY.CLOUDINARY_CLOUD_NAME, value: 'mycloud' },
            { key: APP_CONFIG_KEY.CLOUDINARY_API_KEY, value: '123' },
            { key: APP_CONFIG_KEY.CLOUDINARY_API_SECRET, value: 'secret' },
        ]);

        cloudinaryUploadStreamMock.mockImplementationOnce(
            (_opts: unknown, cb: (err: unknown, result: unknown) => void) => {
                cb(new Error('Network timeout'), null);
                return { end: (): void => undefined };
            },
        );

        const result = await uploadCertificatePdf(Buffer.from('pdf'), 'cert_abc');
        expect(result.uploaded).toBe(false);
        expect(result.error).toContain('Network timeout');
    });

    it('deleteCertificatePdf returns false when not configured', async () => {
        prismaFindManyMock.mockResolvedValueOnce([]);
        const result = await deleteCertificatePdf('cert_abc');
        expect(result.deleted).toBe(false);
    });

    it('deleteCertificatePdf calls Cloudinary destroy when configured', async () => {
        prismaFindManyMock.mockResolvedValueOnce([
            { key: APP_CONFIG_KEY.CLOUDINARY_CLOUD_NAME, value: 'mycloud' },
            { key: APP_CONFIG_KEY.CLOUDINARY_API_KEY, value: '123' },
            { key: APP_CONFIG_KEY.CLOUDINARY_API_SECRET, value: 'secret' },
        ]);
        cloudinaryDestroyMock.mockResolvedValueOnce({ result: 'ok' });

        const result = await deleteCertificatePdf('cert_abc');
        expect(result.deleted).toBe(true);
        expect(cloudinaryDestroyMock).toHaveBeenCalledWith('cert_abc', { resource_type: 'raw' });
    });
});
