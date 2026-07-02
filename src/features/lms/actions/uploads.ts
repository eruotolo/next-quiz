'use server';

import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { uploadLmsFile } from '@/shared/lib/blob';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';
import { revalidatePath } from 'next/cache';

const ALLOWED_DOCUMENT_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/webp',
]);

const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

async function assertLessonEditable(slug: string, lessonId: string) {
    const ctx = await requireInstitutionAccess(slug, [
        USER_ROLE.ADMIN,
        USER_ROLE.SUPER_ADMIN,
        USER_ROLE.PROFESOR,
    ]);
    const lesson = await prisma.lmsLesson.findFirst({
        where: { id: lessonId, module: { course: { academicInstitutionId: ctx.institutionId } } },
        select: { id: true, module: { select: { courseId: true } } },
    });
    if (!lesson) throw new Error('Lección no encontrada.');
    return { ctx, courseId: lesson.module.courseId };
}

export async function uploadLessonDocument(
    slug: string,
    lessonId: string,
    formData: FormData,
): Promise<ActionResult<{ url: string; pathname: string }>> {
    try {
        const { ctx, courseId } = await assertLessonEditable(slug, lessonId);
        const file = formData.get('file');
        if (!(file instanceof File)) return fail('Archivo requerido.');
        if (file.size > MAX_DOCUMENT_BYTES) return fail('El archivo supera 25 MB.');
        if (file.type && !ALLOWED_DOCUMENT_TYPES.has(file.type)) {
            return fail('Tipo de archivo no permitido.');
        }

        const result = await uploadLmsFile(file.name, file, { access: 'public' });

        await prisma.lmsLesson.update({
            where: { id: lessonId },
            data: { fileUrl: result.url, type: 'DOCUMENTO' },
        });

        revalidatePath(`/${slug}/aula/${courseId}`);
        void ctx;
        return ok({ url: result.url, pathname: result.pathname });
    } catch (err) {
        return fail(toActionError(err, 'Error al subir el documento.'));
    }
}
