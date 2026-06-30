import { createMuxDirectUpload, getMuxAssetFromUpload, muxPlaybackId } from '@/shared/lib/mux';

interface UploadResult {
    ok: boolean;
    assetId?: string;
    playbackId?: string;
    error?: string;
}

export async function uploadDailyRecordingToMux(downloadUrl: string): Promise<UploadResult> {
    try {
        const downloadResponse = await fetch(downloadUrl);
        if (!downloadResponse.ok) {
            return {
                ok: false,
                error: `No se pudo descargar la grabación de Daily (${downloadResponse.status}).`,
            };
        }

        const arrayBuffer = await downloadResponse.arrayBuffer();
        const upload = await createMuxDirectUpload();

        const putResponse = await fetch(upload.uploadUrl, {
            method: 'PUT',
            body: arrayBuffer,
            headers: { 'Content-Type': 'application/octet-stream' },
        });
        if (!putResponse.ok) {
            return {
                ok: false,
                error: `Mux rechazó la subida (${putResponse.status}).`,
            };
        }

        const assetId = await getMuxAssetFromUpload(upload.uploadId);
        if (!assetId) {
            return {
                ok: false,
                error: 'Mux no devolvió el asset_id tras la subida.',
            };
        }

        const playbackId = await muxPlaybackId(assetId);
        return {
            ok: true,
            assetId,
            playbackId: playbackId ?? undefined,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido al subir a Mux.';
        return { ok: false, error: message };
    }
}
