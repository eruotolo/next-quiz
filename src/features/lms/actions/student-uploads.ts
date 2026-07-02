'use server';

import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { uploadLmsFile } from '@/shared/lib/blob';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';

const ALLOWED_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp',
]);

const MAX_BYTES = 25 * 1024 * 1024;

export async function uploadStudentSubmissionFile(
    formData: FormData,
): Promise<ActionResult<{ url: string; filename: string }>> {
    try {
        const session = await getStudentAuthSession();
        if (!session) return fail('No estás autenticado');

        const file = formData.get('file');
        if (!(file instanceof File)) return fail('Archivo requerido');
        if (file.size > MAX_BYTES) return fail('El archivo supera 25 MB');
        if (file.type && !ALLOWED_TYPES.has(file.type)) {
            return fail('Tipo de archivo no permitido (PDF, Word, imágenes)');
        }

        const result = await uploadLmsFile(`submission/${file.name}`, file, { access: 'public' });
        return ok({ url: result.url, filename: file.name });
    } catch (err) {
        return fail(toActionError(err, 'Error al subir el archivo.'));
    }
}
