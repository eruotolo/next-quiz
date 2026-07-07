'use server';

import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { assignProfessorsSchema, courseSchema } from '@/features/courses/schemas/course.schemas';
import { logAudit } from '@/shared/lib/audit';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { assertQuota } from '@/features/subscriptions/lib/quota';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';
import { revalidatePath } from 'next/cache';

// D14: en instituciones de educación superior la materia crea su propio Grupo.
const AUTO_GROUP_INSTITUTION_TYPES = ['UNIVERSIDAD', 'INSTITUTO_PROFESIONAL', 'CFT'];

/**
 * Autoriza la mutación de una materia.
 * - Admin/SuperAdmin: pueden operar sobre cualquier materia de su institución.
 * - Profesor: solo si es Jefe de Carrera (coordinador) del programa indicado.
 */
async function authorizeCourseMutation(slug: string, programId?: string | null) {
    const ctx = await requireInstitutionAccess(slug, [
        USER_ROLE.ADMIN,
        USER_ROLE.SUPER_ADMIN,
        USER_ROLE.PROFESOR,
    ]);

    const isAdmin = ctx.userRole === USER_ROLE.ADMIN || ctx.userRole === USER_ROLE.SUPER_ADMIN;
    if (!isAdmin) {
        const isCoordinator = !!programId && ctx.coordinatedProgramIds.includes(programId);
        if (!isCoordinator) {
            throw new Error('No tienes permisos de coordinador para este programa.');
        }
    }
    return ctx;
}

/**
 * Valida que todas las referencias de la materia pertenezcan a la institución
 * (anti-IDOR): período, programa, grupos y profesores. Los opcionales ausentes
 * (null/undefined o array vacío) se ignoran. Lanza Error con mensaje claro.
 * Relación materia↔grupos es N:M via `CourseSectionGroup`.
 */
async function assertCourseRelationsInstitution(
    institutionId: string,
    refs: {
        programId?: string | null;
        periodId: string;
        groupIds: string[];
        professorIds: string[];
    },
): Promise<void> {
    const [period, program, groupCount, professorCount] = await Promise.all([
        prisma.academicPeriod.findFirst({
            where: { id: refs.periodId, academicInstitutionId: institutionId },
            select: { id: true },
        }),
        refs.programId
            ? prisma.program.findFirst({
                  where: { id: refs.programId, academicInstitutionId: institutionId },
                  select: { id: true },
              })
            : Promise.resolve(null),
        refs.groupIds.length > 0
            ? prisma.group.count({
                  where: { id: { in: refs.groupIds }, academicInstitutionId: institutionId },
              })
            : Promise.resolve(0),
        refs.professorIds.length > 0
            ? prisma.user.count({
                  where: {
                      id: { in: refs.professorIds },
                      academicInstitutionId: institutionId,
                      userRole: { name: { in: [USER_ROLE.PROFESOR, USER_ROLE.ADMIN] } },
                  },
              })
            : Promise.resolve(0),
    ]);

    if (!period) throw new Error('El período seleccionado no pertenece a esta institución.');
    if (refs.programId && !program)
        throw new Error('El programa seleccionado no pertenece a esta institución.');
    if (refs.groupIds.length > 0 && groupCount !== refs.groupIds.length)
        throw new Error('Uno o más grupos seleccionados no pertenecen a esta institución.');
    if (refs.professorIds.length > 0 && professorCount !== refs.professorIds.length)
        throw new Error('Uno o más profesores no pertenecen a esta institución.');
}

/** Cuenta cuántos de los profesores indicados pertenecen a la institución. */
async function countValidProfessors(
    institutionId: string,
    professorIds: string[],
): Promise<number> {
    if (professorIds.length === 0) return 0;
    return prisma.user.count({
        where: {
            id: { in: professorIds },
            academicInstitutionId: institutionId,
            userRole: { name: { in: [USER_ROLE.PROFESOR, USER_ROLE.ADMIN] } },
        },
    });
}

/** Reemplaza el set de uniones materia↔grupo por la nueva lista (atómico). */
async function syncCourseSectionGroups(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    courseSectionId: string,
    groupIds: string[],
): Promise<void> {
    await tx.courseSectionGroup.deleteMany({ where: { courseSectionId } });
    if (groupIds.length > 0) {
        await tx.courseSectionGroup.createMany({
            data: groupIds.map((groupId) => ({ courseSectionId, groupId })),
            skipDuplicates: true,
        });
    }
}

export async function createCourse(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = courseSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

        const ctx = await authorizeCourseMutation(slug, parsed.data.programId);

        await assertQuota(ctx.institutionId, 'course', ctx.userRole);

        const { name, code, programId, periodId, groupIds, professorIds } = parsed.data;

        await assertCourseRelationsInstitution(ctx.institutionId, {
            programId,
            periodId,
            groupIds,
            professorIds,
        });

        // D14: las instituciones de educación superior inscriben por materia, así
        // que si no se eligió un grupo se crea uno automáticamente.
        const institution = await prisma.academicInstitution.findUnique({
            where: { id: ctx.institutionId },
            select: { type: true },
        });
        const isUniType =
            !!institution?.type && AUTO_GROUP_INSTITUTION_TYPES.includes(institution.type);

        const effectiveGroupIds = [...groupIds];

        const course = await prisma.$transaction(async (tx) => {
            if (isUniType && effectiveGroupIds.length === 0) {
                const groupName = code ? `${name} (${code})` : name;
                const newGroup = await tx.group.create({
                    data: {
                        name: groupName,
                        academicInstitutionId: ctx.institutionId,
                        programId: programId ?? null,
                        periodId,
                    },
                });
                effectiveGroupIds.push(newGroup.id);
            }

            const created = await tx.courseSection.create({
                data: {
                    name,
                    code,
                    programId,
                    periodId,
                    professors: { connect: professorIds.map((id) => ({ id })) },
                },
                select: { id: true },
            });

            await syncCourseSectionGroups(tx, created.id, effectiveGroupIds);

            return created;
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_CREATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'CourseSection',
            entityId: course.id,
        });

        revalidatePath(`/${slug}/courses`);
        return ok({ id: course.id });
    } catch (err) {
        return fail(toActionError(err, 'Error al crear la materia.'));
    }
}

export async function updateCourse(slug: string, id: string, data: unknown): Promise<ActionResult> {
    try {
        const parsed = courseSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

        const ctx = await authorizeCourseMutation(slug, parsed.data.programId);

        const { name, code, programId, periodId, groupIds, professorIds } = parsed.data;

        await assertCourseRelationsInstitution(ctx.institutionId, {
            programId,
            periodId,
            groupIds,
            professorIds,
        });

        // updateMany no soporta relaciones anidadas: actualiza escalares y luego
        // los profesores + uniones materia↔grupo en una transacción.
        await prisma.$transaction(async (tx) => {
            await tx.courseSection.updateMany({
                where: { id, period: { academicInstitutionId: ctx.institutionId } },
                data: { name, code, programId, periodId },
            });
            await tx.courseSection.update({
                where: { id },
                data: { professors: { set: professorIds.map((pid) => ({ id: pid })) } },
            });
            await syncCourseSectionGroups(tx, id, groupIds);
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'CourseSection',
            entityId: id,
        });

        revalidatePath(`/${slug}/courses`);
        revalidatePath(`/${slug}/courses/${id}`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al actualizar la materia.'));
    }
}

export async function deleteCourse(slug: string, id: string): Promise<ActionResult> {
    try {
        // Eliminar es exclusivo de Admin/SuperAdmin (matriz: Jefe Carrera ❌).
        const ctx = await requireInstitutionAccess(slug, [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN]);

        const res = await prisma.courseSection.deleteMany({
            where: { id, period: { academicInstitutionId: ctx.institutionId } },
        });
        if (res.count === 0) return fail('Materia no encontrada.');

        await logAudit({
            action: AUDIT_ACTION.COURSE_DELETE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'CourseSection',
            entityId: id,
        });

        revalidatePath(`/${slug}/courses`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al eliminar la materia.'));
    }
}

export async function assignProfessors(
    slug: string,
    id: string,
    data: unknown,
): Promise<ActionResult> {
    try {
        const parsed = assignProfessorsSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        // Filtro por institución (anti-IDOR): la materia debe pertenecer a esta.
        const course = await prisma.courseSection.findFirst({
            where: { id, period: { academicInstitutionId: ctx.institutionId } },
            select: { id: true, programId: true },
        });
        if (!course) return fail('Materia no encontrada.');

        const isAdmin = ctx.userRole === USER_ROLE.ADMIN || ctx.userRole === USER_ROLE.SUPER_ADMIN;
        if (!isAdmin) {
            const isCoordinator =
                !!course.programId && ctx.coordinatedProgramIds.includes(course.programId);
            if (!isCoordinator) return fail('No tienes permisos de coordinador para esta materia.');
        }

        if (parsed.data.professorIds.length > 0) {
            const valid = await countValidProfessors(ctx.institutionId, parsed.data.professorIds);
            if (valid !== parsed.data.professorIds.length) {
                return fail('Uno o más profesores no pertenecen a esta institución.');
            }
        }

        await prisma.courseSection.update({
            where: { id },
            data: { professors: { set: parsed.data.professorIds.map((pid) => ({ id: pid })) } },
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'CourseSection',
            entityId: id,
            metadata: { action: 'assignProfessors' },
        });

        revalidatePath(`/${slug}/courses`);
        revalidatePath(`/${slug}/courses/${id}`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al asignar profesores.'));
    }
}
