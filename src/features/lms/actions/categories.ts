'use server';

import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import {
    lmsCategorySchema,
    slugifyCategory,
} from '@/features/lms/schemas/category.schemas';
import { logAudit } from '@/shared/lib/audit';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';
import { revalidatePath } from 'next/cache';

export async function createLmsCategory(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = lmsCategorySchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
        ]);

        const finalSlug = parsed.data.slug || slugifyCategory(parsed.data.name);

        // Validar unicidad del slug por institución
        const existing = await prisma.lmsCategory.findUnique({
            where: { academicInstitutionId_slug: { academicInstitutionId: ctx.institutionId, slug: finalSlug } },
            select: { id: true },
        });
        if (existing) return fail(`Ya existe una categoría con slug "${finalSlug}".`);

        const category = await prisma.lmsCategory.create({
            data: {
                name: parsed.data.name,
                slug: finalSlug,
                description: parsed.data.description ?? null,
                coverImageUrl: parsed.data.coverImageUrl ?? null,
                order: parsed.data.order ?? 0,
                isBundle: parsed.data.isBundle ?? false,
                bundlePrice: parsed.data.bundlePrice ?? null,
                isPublic: parsed.data.isPublic ?? false,
                academicInstitutionId: ctx.institutionId,
            },
            select: { id: true },
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_CREATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsCategory',
            entityId: category.id,
        });

        revalidatePath(`/${slug}/aula/categorias`);
        return ok({ id: category.id });
    } catch (err) {
        return fail(toActionError(err, 'Error al crear la categoría.'));
    }
}

export async function updateLmsCategory(
    slug: string,
    categoryId: string,
    data: unknown,
): Promise<ActionResult> {
    try {
        const parsed = lmsCategorySchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
        ]);

        const existing = await prisma.lmsCategory.findFirst({
            where: { id: categoryId, academicInstitutionId: ctx.institutionId },
            select: { id: true, slug: true },
        });
        if (!existing) return fail('Categoría no encontrada.');

        const finalSlug = parsed.data.slug || slugifyCategory(parsed.data.name);

        if (finalSlug !== existing.slug) {
            const dup = await prisma.lmsCategory.findUnique({
                where: { academicInstitutionId_slug: { academicInstitutionId: ctx.institutionId, slug: finalSlug } },
                select: { id: true },
            });
            if (dup) return fail(`Ya existe una categoría con slug "${finalSlug}".`);
        }

        await prisma.lmsCategory.update({
            where: { id: categoryId },
            data: {
                name: parsed.data.name,
                slug: finalSlug,
                description: parsed.data.description ?? null,
                coverImageUrl: parsed.data.coverImageUrl ?? null,
                order: parsed.data.order ?? 0,
                isBundle: parsed.data.isBundle ?? false,
                bundlePrice: parsed.data.bundlePrice ?? null,
                isPublic: parsed.data.isPublic ?? false,
            },
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsCategory',
            entityId: categoryId,
        });

        revalidatePath(`/${slug}/aula/categorias`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al actualizar la categoría.'));
    }
}

export async function deleteLmsCategory(slug: string, categoryId: string): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
        ]);

        const existing = await prisma.lmsCategory.findFirst({
            where: { id: categoryId, academicInstitutionId: ctx.institutionId },
            select: { id: true },
        });
        if (!existing) return fail('Categoría no encontrada.');

        await prisma.lmsCategory.delete({ where: { id: categoryId } });

        await logAudit({
            action: AUDIT_ACTION.COURSE_DELETE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsCategory',
            entityId: categoryId,
        });

        revalidatePath(`/${slug}/aula/categorias`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al eliminar la categoría.'));
    }
}

/**
 * Sincroniza la lista de cursos asociados a una categoría (diff contra el set
 * actual). Borra los que no estén en el nuevo array y crea los nuevos.
 */
export async function setCourseCategories(
    slug: string,
    courseId: string,
    categoryIds: string[],
): Promise<ActionResult> {
    try {
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

        // Validar que todas las categorías pertenecen a la misma institución.
        if (categoryIds.length > 0) {
            const valid = await prisma.lmsCategory.count({
                where: {
                    id: { in: categoryIds },
                    academicInstitutionId: ctx.institutionId,
                },
            });
            if (valid !== categoryIds.length) {
                return fail('Una o más categorías no pertenecen a esta institución.');
            }
        }

        const current = await prisma.lmsCourseCategory.findMany({
            where: { courseId },
            select: { categoryId: true },
        });
        const currentSet = new Set(current.map((c) => c.categoryId));
        const nextSet = new Set(categoryIds);

        const toDelete = [...currentSet].filter((id) => !nextSet.has(id));
        const toCreate = [...nextSet].filter((id) => !currentSet.has(id));

        await prisma.$transaction([
            ...(toDelete.length > 0
                ? [
                      prisma.lmsCourseCategory.deleteMany({
                          where: { courseId, categoryId: { in: toDelete } },
                      }),
                  ]
                : []),
            ...(toCreate.length > 0
                ? [
                      prisma.lmsCourseCategory.createMany({
                          data: toCreate.map((categoryId) => ({ courseId, categoryId })),
                      }),
                  ]
                : []),
        ]);

        revalidatePath(`/${slug}/aula/${courseId}`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al actualizar las categorías.'));
    }
}