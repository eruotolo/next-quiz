'use server';

import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { groupProfessorFilter } from '@/shared/lib/scoping';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { studentSchema } from '@/features/students/schemas/student.schemas';
import { assertQuota } from '@/features/subscriptions/lib/quota';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ADMIN_ONLY = [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN] as const;
const ADMIN_OR_PROFESOR = [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.PROFESOR] as const;

/** Verifica que un grupo pertenezca a los grupos asignados al profesor. */
async function professorOwnsGroup(groupId: string, professorId: string): Promise<boolean> {
    const count = await prisma.group.count({
        where: { id: groupId, ...groupProfessorFilter(professorId) },
    });
    return count > 0;
}

/** Verifica que un profesor tenga acceso al grupo del estudiante en su institución. */
async function professorHasAccess(
    studentId: string,
    professorId: string,
    institutionId: string,
): Promise<boolean> {
    const student = await prisma.user.findFirst({
        where: { id: studentId, academicInstitutionId: institutionId },
        select: {
            group: { select: { professors: { where: { id: professorId }, select: { id: true } } } },
        },
    });
    return (student?.group?.professors.length ?? 0) > 0;
}

export async function createStudent(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_OR_PROFESOR]);

        const parsed = studentSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

        const { groupId, ...rest } = parsed.data;
        if (ctx.isProfesor && !(await professorOwnsGroup(groupId, ctx.userId))) {
            return fail('Solo puedes crear estudiantes en tus grupos.');
        }

        await assertQuota(ctx.institutionId, 'student', ctx.userRole);

        const student = await prisma.user.create({
            data: {
                ...rest,
                group: { connect: { id: groupId } },
                userRole: { connect: { name: USER_ROLE.STUDENT } },
                academicInstitution: { connect: { id: ctx.institutionId } },
            },
            select: { id: true },
        });
        await logAudit({
            action: AUDIT_ACTION.STUDENT_CREATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'User',
            entityId: student.id,
        });
        revalidatePath(`/${slug}/students`);
        return ok({ id: student.id });
    } catch (err) {
        return fail(toActionError(err, 'Error al crear el estudiante.'));
    }
}

export async function updateStudent(
    slug: string,
    id: string,
    data: unknown,
): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_OR_PROFESOR]);

        const parsed = studentSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

        if (ctx.isProfesor && !(await professorHasAccess(id, ctx.userId, ctx.institutionId))) {
            return fail('Sin permisos sobre este estudiante.');
        }

        if (parsed.data.groupId) {
            const group = await prisma.group.findFirst({
                where: { id: parsed.data.groupId, academicInstitutionId: ctx.institutionId }
            });
            if (!group) return fail('El grupo no pertenece a la institución.');
        }

        const res = await prisma.user.updateMany({
            where: {
                id,
                academicInstitutionId: ctx.institutionId,
                userRole: { name: USER_ROLE.STUDENT },
            },
            data: parsed.data,
        });
        if (res.count === 0) return fail('Estudiante no encontrado.');

        await logAudit({
            action: AUDIT_ACTION.STUDENT_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'User',
            entityId: id,
        });
        revalidatePath(`/${slug}/students`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al actualizar el estudiante.'));
    }
}

export async function deleteStudent(slug: string, id: string): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_ONLY]);

        const res = await prisma.user.deleteMany({
            where: {
                id,
                academicInstitutionId: ctx.institutionId,
                userRole: { name: USER_ROLE.STUDENT },
            },
        });
        if (res.count === 0) return fail('Estudiante no encontrado.');

        await logAudit({
            action: AUDIT_ACTION.STUDENT_DELETE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'User',
            entityId: id,
        });
        revalidatePath(`/${slug}/students`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al eliminar el estudiante.'));
    }
}

export async function toggleStudentActive(
    slug: string,
    id: string,
    active: boolean,
): Promise<ActionResult> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_OR_PROFESOR]);

        if (ctx.isProfesor && !(await professorHasAccess(id, ctx.userId, ctx.institutionId))) {
            return fail('Sin permisos sobre este estudiante.');
        }

        const res = await prisma.user.updateMany({
            where: {
                id,
                academicInstitutionId: ctx.institutionId,
                userRole: { name: USER_ROLE.STUDENT },
            },
            data: { active },
        });
        if (res.count === 0) return fail('Estudiante no encontrado.');

        await logAudit({
            action: AUDIT_ACTION.STUDENT_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'User',
            entityId: id,
            metadata: { active },
        });
        revalidatePath(`/${slug}/students`);
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al actualizar el estado.'));
    }
}

export interface ImportStudentsResult {
    created: number;
    skipped: number;
    errors: { row: number; message: string }[];
}

export async function importStudents(
    slug: string,
    rows: { name: string; lastname: string; email: string; rut: string; groupId: string }[],
): Promise<ActionResult<ImportStudentsResult>> {
    try {
        const ctx = await requireInstitutionAccess(slug, [...ADMIN_OR_PROFESOR]);

        await assertQuota(ctx.institutionId, 'student', ctx.userRole, rows.length);

        const studentRole = await prisma.userRole.findUniqueOrThrow({
            where: { name: USER_ROLE.STUDENT },
        });

        // Profesor: solo puede importar a sus grupos. Cargamos sus grupos una vez
        // y las filas con un grupo ajeno se marcan como error (no se crean).
        let allowedGroupIds: Set<string> | null = null;
        if (ctx.isProfesor) {
            const ownGroups = await prisma.group.findMany({
                where: {
                    academicInstitutionId: ctx.institutionId,
                    ...groupProfessorFilter(ctx.userId),
                },
                select: { id: true },
            });
            allowedGroupIds = new Set(ownGroups.map((g) => g.id));
        }

        type ValidRow = {
            name: string;
            lastname: string;
            email: string;
            rut: string;
            groupId: string;
            userRoleId: string;
            academicInstitutionId: string;
        };

        const valid: ValidRow[] = [];
        const errors: { row: number; message: string }[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2;
            try {
                const parsed = studentSchema.parse(row);
                if (allowedGroupIds && !allowedGroupIds.has(parsed.groupId)) {
                    errors.push({ row: rowNum, message: 'El grupo no pertenece a tus grupos.' });
                    continue;
                }
                valid.push({
                    ...parsed,
                    userRoleId: studentRole.id,
                    academicInstitutionId: ctx.institutionId,
                });
            } catch (err) {
                const msg =
                    err instanceof z.ZodError
                        ? (err.errors[0]?.message ?? 'Datos inválidos')
                        : 'Error de validación';
                errors.push({ row: rowNum, message: msg });
            }
        }

        if (valid.length === 0) {
            return ok({ created: 0, skipped: 0, errors });
        }

        const result = await prisma.user.createMany({ data: valid, skipDuplicates: true });

        await logAudit({
            action: AUDIT_ACTION.STUDENT_IMPORT,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'User',
            metadata: {
                created: result.count,
                skipped: valid.length - result.count,
                errorCount: errors.length,
            },
        });
        revalidatePath(`/${slug}/students`);
        return ok({ created: result.count, skipped: valid.length - result.count, errors });
    } catch (err) {
        return fail(toActionError(err, 'Error al importar estudiantes.'));
    }
}
