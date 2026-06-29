'use server';

import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import {
    lmsCourseSchema,
    lmsModuleSchema,
    lmsLessonSchema,
    reorderModulesSchema,
    reorderLessonsSchema,
} from '@/features/lms/schemas/lms.schemas';
import { logAudit } from '@/shared/lib/audit';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';
import { revalidatePath } from 'next/cache';

// ─── Courses ─────────────────────────────────────────────────────────────────

export async function createLmsCourse(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = lmsCourseSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const course = await prisma.lmsCourse.create({
            data: {
                title: parsed.data.title,
                description: parsed.data.description ?? null,
                coverImageUrl: parsed.data.coverImageUrl ?? null,
                published: parsed.data.published,
                courseSectionId: parsed.data.courseSectionId ?? null,
                academicInstitutionId: ctx.institutionId,
                createdById: ctx.userId,
            },
            select: { id: true },
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_CREATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsCourse',
            entityId: course.id,
        });

        revalidatePath(`/${slug}/aula`);
        return ok({ id: course.id });
    } catch (err) {
        return fail(toActionError(err, 'Error al crear el curso.'));
    }
}

export async function updateLmsCourse(
    slug: string,
    id: string,
    data: unknown,
): Promise<ActionResult> {
    try {
        const parsed = lmsCourseSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const res = await prisma.lmsCourse.updateMany({
            where: { id, academicInstitutionId: ctx.institutionId },
            data: {
                title: parsed.data.title,
                description: parsed.data.description ?? null,
                coverImageUrl: parsed.data.coverImageUrl ?? null,
                published: parsed.data.published,
                courseSectionId: parsed.data.courseSectionId ?? null,
            },
        });
        if (res.count === 0) return fail('Curso no encontrado.');

        await logAudit({
            action: AUDIT_ACTION.COURSE_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsCourse',
            entityId: id,
        });

        revalidatePath(`/${slug}/aula`);
        revalidatePath(`/${slug}/aula/${id}`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al actualizar el curso.'));
    }
}

export async function deleteLmsCourse(slug: string, id: string): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug, [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN]);

        const res = await prisma.lmsCourse.deleteMany({
            where: { id, academicInstitutionId: ctx.institutionId },
        });
        if (res.count === 0) return fail('Curso no encontrado.');

        await logAudit({
            action: AUDIT_ACTION.COURSE_DELETE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsCourse',
            entityId: id,
        });

        revalidatePath(`/${slug}/aula`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al eliminar el curso.'));
    }
}

// ─── Modules ─────────────────────────────────────────────────────────────────

export async function createLmsModule(
    slug: string,
    courseId: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = lmsModuleSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const course = await prisma.lmsCourse.findFirst({
            where: { id: courseId, academicInstitutionId: ctx.institutionId },
            select: { id: true },
        });
        if (!course) return fail('Curso no encontrado.');

        const last = await prisma.lmsModule.findFirst({
            where: { courseId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });
        const nextOrder = (last?.order ?? -1) + 1;

        const mod = await prisma.lmsModule.create({
            data: {
                title: parsed.data.title,
                description: parsed.data.description ?? null,
                order: parsed.data.order ?? nextOrder,
                courseId,
            },
            select: { id: true },
        });

        revalidatePath(`/${slug}/aula/${courseId}`);
        return ok({ id: mod.id });
    } catch (err) {
        return fail(toActionError(err, 'Error al crear el módulo.'));
    }
}

export async function updateLmsModule(
    slug: string,
    moduleId: string,
    data: unknown,
): Promise<ActionResult> {
    try {
        const parsed = lmsModuleSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const mod = await prisma.lmsModule.findFirst({
            where: { id: moduleId, course: { academicInstitutionId: ctx.institutionId } },
            select: { id: true, courseId: true },
        });
        if (!mod) return fail('Módulo no encontrado.');

        await prisma.lmsModule.update({
            where: { id: moduleId },
            data: {
                title: parsed.data.title,
                description: parsed.data.description ?? null,
            },
        });

        revalidatePath(`/${slug}/aula/${mod.courseId}`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al actualizar el módulo.'));
    }
}

export async function deleteLmsModule(slug: string, moduleId: string): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug, [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN]);

        const mod = await prisma.lmsModule.findFirst({
            where: { id: moduleId, course: { academicInstitutionId: ctx.institutionId } },
            select: { id: true, courseId: true },
        });
        if (!mod) return fail('Módulo no encontrado.');

        await prisma.lmsModule.delete({ where: { id: moduleId } });

        revalidatePath(`/${slug}/aula/${mod.courseId}`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al eliminar el módulo.'));
    }
}

export async function reorderLmsModules(
    slug: string,
    data: unknown,
): Promise<ActionResult> {
    try {
        const parsed = reorderModulesSchema.safeParse(data);
        if (!parsed.success) return fail('Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const course = await prisma.lmsCourse.findFirst({
            where: { id: parsed.data.courseId, academicInstitutionId: ctx.institutionId },
            select: { id: true },
        });
        if (!course) return fail('Curso no encontrado.');

        await prisma.$transaction(
            parsed.data.moduleIds.map((moduleId, index) =>
                prisma.lmsModule.updateMany({
                    where: { id: moduleId, courseId: parsed.data.courseId },
                    data: { order: index },
                }),
            ),
        );

        revalidatePath(`/${slug}/aula/${parsed.data.courseId}`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al reordenar módulos.'));
    }
}

// ─── Lessons ─────────────────────────────────────────────────────────────────

export async function createLmsLesson(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = lmsLessonSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const mod = await prisma.lmsModule.findFirst({
            where: { id: parsed.data.moduleId, course: { academicInstitutionId: ctx.institutionId } },
            select: { id: true },
        });
        if (!mod) return fail('Módulo no encontrado.');

        if (parsed.data.type === 'EXAMEN' && !parsed.data.examId) {
            return fail('Una lección tipo EXAMEN requiere un examen asociado.');
        }

        const last = await prisma.lmsLesson.findFirst({
            where: { moduleId: parsed.data.moduleId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });
        const nextOrder = (last?.order ?? -1) + 1;

        const lesson = await prisma.lmsLesson.create({
            data: {
                moduleId: parsed.data.moduleId,
                title: parsed.data.title,
                type: parsed.data.type,
                order: parsed.data.order ?? nextOrder,
                contentJson: parsed.data.contentJson ?? undefined,
                videoAssetId: parsed.data.videoAssetId ?? null,
                videoUploadId: parsed.data.videoUploadId ?? null,
                fileUrl: parsed.data.fileUrl ?? null,
                externalLink: parsed.data.externalLink ?? null,
                durationSec: parsed.data.durationSec ?? null,
                examId: parsed.data.examId ?? null,
            },
            select: { id: true },
        });

        revalidatePath(`/${slug}/aula`);
        return ok({ id: lesson.id });
    } catch (err) {
        return fail(toActionError(err, 'Error al crear la lección.'));
    }
}

export async function updateLmsLesson(
    slug: string,
    lessonId: string,
    data: unknown,
): Promise<ActionResult> {
    try {
        const parsed = lmsLessonSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const lesson = await prisma.lmsLesson.findFirst({
            where: { id: lessonId, module: { course: { academicInstitutionId: ctx.institutionId } } },
            select: { id: true },
        });
        if (!lesson) return fail('Lección no encontrada.');

        if (parsed.data.type === 'EXAMEN' && !parsed.data.examId) {
            return fail('Una lección tipo EXAMEN requiere un examen asociado.');
        }

        await prisma.lmsLesson.update({
            where: { id: lessonId },
            data: {
                title: parsed.data.title,
                type: parsed.data.type,
                contentJson: parsed.data.contentJson ?? undefined,
                videoAssetId: parsed.data.videoAssetId ?? null,
                videoUploadId: parsed.data.videoUploadId ?? null,
                fileUrl: parsed.data.fileUrl ?? null,
                externalLink: parsed.data.externalLink ?? null,
                durationSec: parsed.data.durationSec ?? null,
                examId: parsed.data.examId ?? null,
            },
        });

        revalidatePath(`/${slug}/aula`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al actualizar la lección.'));
    }
}

export async function deleteLmsLesson(slug: string, lessonId: string): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug, [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN]);

        const lesson = await prisma.lmsLesson.findFirst({
            where: { id: lessonId, module: { course: { academicInstitutionId: ctx.institutionId } } },
            select: { id: true },
        });
        if (!lesson) return fail('Lección no encontrada.');

        await prisma.lmsLesson.delete({ where: { id: lessonId } });

        revalidatePath(`/${slug}/aula`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al eliminar la lección.'));
    }
}

export async function reorderLmsLessons(
    slug: string,
    data: unknown,
): Promise<ActionResult> {
    try {
        const parsed = reorderLessonsSchema.safeParse(data);
        if (!parsed.success) return fail('Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const mod = await prisma.lmsModule.findFirst({
            where: { id: parsed.data.moduleId, course: { academicInstitutionId: ctx.institutionId } },
            select: { id: true, courseId: true },
        });
        if (!mod) return fail('Módulo no encontrado.');

        await prisma.$transaction(
            parsed.data.lessonIds.map((lessonId, index) =>
                prisma.lmsLesson.updateMany({
                    where: { id: lessonId, moduleId: parsed.data.moduleId },
                    data: { order: index },
                }),
            ),
        );

        revalidatePath(`/${slug}/aula/${mod.courseId}`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al reordenar lecciones.'));
    }
}
