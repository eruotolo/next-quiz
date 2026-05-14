'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { studentSchema } from '@/features/students/schemas/student.schemas';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export async function createStudent(data: unknown): Promise<void> {
    const session = await auth();
    const institutionId = session?.user.academicInstitutionId;
    const slug = session?.user.institutionSlug;
    if (!institutionId || !slug) throw new Error('Unauthorized');

    const { groupId, ...rest } = studentSchema.parse(data);
    const student = await prisma.user.create({
        data: {
            ...rest,
            group: { connect: { id: groupId } },
            userRole: { connect: { name: USER_ROLE.STUDENT } },
            academicInstitution: { connect: { id: institutionId } },
        },
        select: { id: true },
    });
    await logAudit({
        action: AUDIT_ACTION.STUDENT_CREATE,
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorRole: session.user.userRoleName,
        academicInstitutionId: institutionId,
        entity: 'User',
        entityId: student.id,
    });
    revalidatePath(`/${slug}/students`);
}

export async function updateStudent(id: string, data: unknown): Promise<void> {
    const session = await auth();
    const slug = session?.user.institutionSlug;
    if (!slug) throw new Error('Unauthorized');

    const parsed = studentSchema.parse(data);
    await prisma.user.update({ where: { id }, data: parsed });
    await logAudit({
        action: AUDIT_ACTION.STUDENT_UPDATE,
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorRole: session.user.userRoleName,
        academicInstitutionId: session.user.academicInstitutionId,
        entity: 'User',
        entityId: id,
    });
    revalidatePath(`/${slug}/students`);
}

export async function deleteStudent(id: string): Promise<void> {
    const session = await auth();
    const slug = session?.user.institutionSlug;
    if (!slug) throw new Error('Unauthorized');

    await prisma.user.delete({
        where: { id, userRole: { name: USER_ROLE.STUDENT } },
    });
    await logAudit({
        action: AUDIT_ACTION.STUDENT_DELETE,
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorRole: session.user.userRoleName,
        academicInstitutionId: session.user.academicInstitutionId,
        entity: 'User',
        entityId: id,
    });
    revalidatePath(`/${slug}/students`);
}

export interface ImportStudentsResult {
    created: number;
    skipped: number;
    errors: Array<{ row: number; message: string }>;
}

export async function importStudents(
    rows: Array<{ name: string; lastname: string; email: string; rut: string; groupId: string }>,
): Promise<ImportStudentsResult> {
    const session = await auth();
    const institutionId = session?.user.academicInstitutionId;
    const slug = session?.user.institutionSlug;
    if (!institutionId || !slug) throw new Error('Unauthorized');

    const studentRole = await prisma.userRole.findUniqueOrThrow({
        where: { name: USER_ROLE.STUDENT },
    });

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
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        try {
            const parsed = studentSchema.parse(row);
            valid.push({
                ...parsed,
                userRoleId: studentRole.id,
                academicInstitutionId: institutionId,
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
        return { created: 0, skipped: 0, errors };
    }

    const result = await prisma.user.createMany({ data: valid, skipDuplicates: true });

    await logAudit({
        action: AUDIT_ACTION.STUDENT_IMPORT,
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorRole: session.user.userRoleName,
        academicInstitutionId: institutionId,
        entity: 'User',
        metadata: { created: result.count, skipped: valid.length - result.count, errorCount: errors.length },
    });
    revalidatePath(`/${slug}/students`);
    return { created: result.count, skipped: valid.length - result.count, errors };
}
