import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '@/shared/lib/prisma';
import { APP_CONFIG_KEY } from '@/features/config/lib/app-config-keys';

export interface CloudinaryConfig {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
}

interface AppConfigRow {
    key: string;
    value: string;
}

async function getCloudinaryConfig(): Promise<CloudinaryConfig | null> {
    const configs: AppConfigRow[] = await prisma.appConfig.findMany({
        where: {
            key: {
                in: [
                    APP_CONFIG_KEY.CLOUDINARY_CLOUD_NAME,
                    APP_CONFIG_KEY.CLOUDINARY_API_KEY,
                    APP_CONFIG_KEY.CLOUDINARY_API_SECRET,
                ],
            },
        },
        select: { key: true, value: true },
    });

    const map = Object.fromEntries(configs.map((c) => [c.key, c.value]));
    const cloudName = map[APP_CONFIG_KEY.CLOUDINARY_CLOUD_NAME];
    const apiKey = map[APP_CONFIG_KEY.CLOUDINARY_API_KEY];
    const apiSecret = map[APP_CONFIG_KEY.CLOUDINARY_API_SECRET];

    if (!cloudName || !apiKey || !apiSecret) return null;
    return { cloudName, apiKey, apiSecret };
}

function configureClient(config: CloudinaryConfig): void {
    cloudinary.config({
        cloud_name: config.cloudName,
        api_key: config.apiKey,
        api_secret: config.apiSecret,
        secure: true,
    });
}

export interface UploadResult {
    uploaded: boolean;
    url?: string;
    publicId?: string;
    error?: string;
}

function uploadStream(
    buffer: Buffer,
    publicId: string,
    options: { resourceType: 'raw' | 'image'; folder: string },
): Promise<{ secure_url: string; public_id: string }> {
    return new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
            {
                resource_type: options.resourceType,
                folder: options.folder,
                public_id: publicId,
                overwrite: true,
                type: 'upload',
            },
            (error, result) => {
                if (error) {
                    reject(new Error(error.message || 'Error al subir a Cloudinary'));
                    return;
                }
                if (!result) {
                    reject(new Error('Cloudinary devolvió respuesta vacía'));
                    return;
                }
                resolve({ secure_url: result.secure_url, public_id: result.public_id });
            },
        );
        upload.end(buffer);
    });
}

export async function uploadCertificatePdf(
    buffer: Buffer,
    publicId: string,
): Promise<UploadResult> {
    try {
        const config = await getCloudinaryConfig();
        if (!config) {
            return {
                uploaded: false,
                error: 'Configurá las credenciales de Cloudinary en Configuración antes de generar certificados.',
            };
        }
        configureClient(config);
        const result = await uploadStream(buffer, publicId, {
            resourceType: 'raw',
            folder: 'lms/certificates',
        });
        return { uploaded: true, url: result.secure_url, publicId: result.public_id };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al subir PDF a Cloudinary.';
        console.error('[Cloudinary] uploadCertificatePdf failed:', message);
        return { uploaded: false, error: message };
    }
}

export async function uploadWhiteboardPng(
    buffer: Buffer,
    publicId: string,
): Promise<UploadResult> {
    try {
        const config = await getCloudinaryConfig();
        if (!config) {
            return {
                uploaded: false,
                error: 'Cloudinary no configurado. El snapshot quedará solo como data URL.',
            };
        }
        configureClient(config);
        const result = await uploadStream(buffer, publicId, {
            resourceType: 'image',
            folder: 'lms/whiteboard',
        });
        return { uploaded: true, url: result.secure_url, publicId: result.public_id };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al subir PNG a Cloudinary.';
        console.error('[Cloudinary] uploadWhiteboardPng failed:', message);
        return { uploaded: false, error: message };
    }
}

export async function deleteCertificatePdf(publicId: string): Promise<{ deleted: boolean; error?: string }> {
    try {
        const config = await getCloudinaryConfig();
        if (!config) {
            return { deleted: false, error: 'Cloudinary no configurado.' };
        }
        configureClient(config);
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        return { deleted: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al borrar PDF en Cloudinary.';
        console.error('[Cloudinary] deleteCertificatePdf failed:', message);
        return { deleted: false, error: message };
    }
}

export async function isCloudinaryConfigured(): Promise<boolean> {
    const config = await getCloudinaryConfig();
    return config !== null;
}
