'use server';

import { revalidatePath } from 'next/cache';
import { randomBytes } from 'node:crypto';
import { fail, ok, toActionError } from '@/shared/types/action';
import type { ActionResult } from '@/shared/types/action';
import { saveWhiteboardSnapshotSchema } from '@/features/lms/schemas/lms-phase6-live.schemas';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { isCloudinaryConfigured, uploadWhiteboardPng } from '@/shared/lib/cloudinary';

export async function saveWhiteboardSnapshot(
    rawInput: unknown,
): Promise<ActionResult<{ id: string; pngUrl: string }>> {
    const parsed = saveWhiteboardSnapshotSchema.safeParse(rawInput);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');
    const data = parsed.data;

    const { auth } = await import('@/features/auth/auth');
    const session = await auth();
    if (!session?.user?.id) return fail('No autenticado');
    const userId = session.user.id;
    const userRoleName = session.user.userRoleName;

    const liveSession = await prisma.lmsLiveSession.findUnique({
        where: { id: data.sessionId },
        select: {
            id: true,
            courseId: true,
            course: { select: { academicInstitutionId: true } },
        },
    });
    if (!liveSession) return fail('Sesión no encontrada');

    let allowed = userRoleName === USER_ROLE.SUPER_ADMIN;
    if (!allowed) {
        const membership = await prisma.user.findUnique({
            where: { id: userId },
            select: { academicInstitutionId: true },
        });
        if (
            (userRoleName === USER_ROLE.ADMIN || userRoleName === USER_ROLE.PROFESOR) &&
            membership?.academicInstitutionId === liveSession.course.academicInstitutionId
        ) {
            allowed = true;
        } else if (userRoleName === USER_ROLE.STUDENT) {
            const enrollment = await prisma.lmsEnrollment.findFirst({
                where: { userId, courseId: liveSession.courseId },
                select: { id: true },
            });
            if (enrollment) allowed = true;
        }
    }
    if (!allowed) return fail('No autorizado');

    try {
        const cloudReady = await isCloudinaryConfigured();
        let pngUrl = '';
        if (cloudReady) {
            const buffer = Buffer.from(data.pngBase64, 'base64');
            const publicId = `lms/whiteboard/${data.sessionId}/${randomBytes(6).toString('hex')}-${Date.now()}`;
            const upload = await uploadWhiteboardPng(buffer, publicId);
            pngUrl = upload.uploaded && upload.url ? upload.url : '';
        } else {
            // Modo degradado: no hay Cloudinary configurado. Igual persistimos
            // con un data URL mientras se carga en otro lado (puede romperse al
            // pasar de 25 MB en DB). Avisamos al cliente que el snapshot no
            // queda en storage externo.
            pngUrl = `data:image/png;base64,${data.pngBase64}`;
        }

        const snapshot = await prisma.lmsWhiteboardSnapshot.create({
            data: {
                sessionId: data.sessionId,
                userId,
                pngUrl,
                width: data.width,
                height: data.height,
                title: data.title ?? null,
            },
        });
        revalidatePath(`/aula/clases/${data.sessionId}`);
        return ok({ id: snapshot.id, pngUrl });
    } catch (err) {
        return fail(toActionError(err, 'No se pudo guardar la pizarra'));
    }
}
