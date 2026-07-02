import { put, del, list, type PutBlobResult } from '@vercel/blob';

const PREFIX_LMS = 'lms/';

export interface UploadedFile {
    url: string;
    pathname: string;
    contentType: string | null;
}

function toUploadedFile(result: PutBlobResult): UploadedFile {
    return {
        url: result.url,
        pathname: result.pathname,
        contentType: result.contentType ?? null,
    };
}

export async function uploadLmsFile(
    filename: string,
    body: Buffer | ReadableStream<Uint8Array> | Blob,
    options: { access?: 'public' } = {},
): Promise<UploadedFile> {
    const result = await put(`${PREFIX_LMS}${filename}`, body, {
        access: options.access ?? 'public',
        addRandomSuffix: true,
    });
    return toUploadedFile(result);
}

export async function deleteLmsFile(url: string): Promise<void> {
    await del(url);
}

export async function listLmsFiles(prefix: string): Promise<{ url: string; pathname: string }[]> {
    const { blobs } = await list({ prefix: `${PREFIX_LMS}${prefix}` });
    return blobs.map((b) => ({ url: b.url, pathname: b.pathname }));
}
