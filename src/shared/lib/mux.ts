import Mux from '@mux/mux-node';

const globalForMux = globalThis as unknown as { mux: Mux | undefined };

function getMuxClient(): Mux {
    if (globalForMux.mux) return globalForMux.mux;
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;
    if (!tokenId || !tokenSecret) {
        throw new Error('MUX_TOKEN_ID y MUX_TOKEN_SECRET son requeridos');
    }
    const client = new Mux({ tokenId, tokenSecret });
    if (process.env.NODE_ENV !== 'production') {
        globalForMux.mux = client;
    }
    return client;
}

export interface MuxDirectUpload {
    uploadId: string;
    uploadUrl: string;
}

export async function createMuxDirectUpload(): Promise<MuxDirectUpload> {
    const upload = await getMuxClient().video.uploads.create({
        cors_origin: '*',
        new_asset_settings: {
            playback_policy: ['public'],
            encoding_tier: 'baseline',
        },
    });
    if (!upload.id || !upload.url) {
        throw new Error('Mux no devolvió un upload válido.');
    }
    return { uploadId: upload.id, uploadUrl: upload.url };
}

export async function getMuxAssetFromUpload(uploadId: string): Promise<string | null> {
    const upload = await getMuxClient().video.uploads.retrieve(uploadId);
    if (!upload.asset_id) return null;
    return upload.asset_id;
}

export async function getMuxAssetStatus(assetId: string): Promise<'preparing' | 'ready' | 'errored'> {
    const asset = await getMuxClient().video.assets.retrieve(assetId);
    return asset.status as 'preparing' | 'ready' | 'errored';
}

export async function muxPlaybackId(assetId: string): Promise<string | null> {
    const asset = await getMuxClient().video.assets.retrieve(assetId);
    return asset.playback_ids?.[0]?.id ?? null;
}

export async function deleteMuxAsset(assetId: string): Promise<void> {
    await getMuxClient().video.assets.delete(assetId);
}
