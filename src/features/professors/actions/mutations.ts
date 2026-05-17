'use server';

import { auth } from '@/features/auth/auth';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import {
    createProfessorSchema,
    updateProfessorSchema,
} from '@/features/professors/schemas/professor.schemas';
import { logAudit } from '@/shared/lib/audit';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { assertQuota } from '@/features/subscriptions/lib/quota';
import type { Session } from 'next-auth';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

async function resolveSlugAndInstitution(
    session: Session,
    institutionSlug?: string,
): Promise<{ slug: string; institutionId: string }> {
    if (session.user.userRoleName === USER_ROLE.SUPER_ADMIN) {
        if (!institutionSlug) throw new Error('Unauthorized');
        const inst = await prisma.academicInstitution.findUnique({
            where: { slug: institutionSlug },
            select: { id: true },
        });
        if (!inst) throw new Error('Unauthorized');
        return { slug: institutionSlug, institutionId: inst.id };
    }

    const slug = session.user.institutionSlug;
    const institutionId = session.user.academicInstitutionId;
    if (!slug || !institutionId) throw new Error('Unauthorized');
    return { slug, institutionId };
}

async function resolveProfessorInstitution(
    professorId: string,
): Promise<{ slug: string; institutionId: string }> {
    const professor = await prisma.user.findUnique({
        where: { id: professorId },
        select: { academicInstitution: { select: { id: true, slug: true } } },
    });
    const slug = professor?.academicInstitution?.slug;
    const institutionId = professor?.academicInstitution?.id;
    if (!slug || !institutionId) throw new Error('Not found');
    return { slug, institutionId };
}

// institutionSlug is required when SuperAdmin creates a professor
export async function createProfessor(data: unknown, institutionSlug?: string): Promise<void> {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');
    if (
        session.user.userRoleName !== USER_ROLE.ADMIN &&
        session.user.userRoleName !== USER_ROLE.SUPER_ADMIN
    ) {
        throw new Error('Forbidden');
    }
    const { slug, institutionId } = await resolveSlugAndInstitution(session, institutionSlug);

    await assertQuota(institutionId, 'professor', session.user.userRoleName);

    const { groupIds, roleName, password, ...rest } = createProfessorSchema.parse(data);
    const hashedPassword = await bcrypt.hash(password, 10);

    const professor = await prisma.user.create({
        data: {
            ...rest,
            password: hashedPassword,
            userRole: { connect: { name: roleName } },
            academicInstitution: { connect: { id: institutionId } },
            professorGroups: { connect: groupIds.map((id) => ({ id })) },
        },
        select: { id: true },
    });

    await logAudit({
        action: AUDIT_ACTION.PROFESSOR_CREATE,
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorRole: session.user.userRoleName,
        academicInstitutionId: institutionId,
        entity: 'User',
        entityId: professor.id,
    });

    revalidatePath(`/${slug}/professors`);
}

export async function updateProfessor(id: string, data: unknown): Promise<void> {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');
    if (
        session.user.userRoleName !== USER_ROLE.ADMIN &&
        session.user.userRoleName !== USER_ROLE.SUPER_ADMIN
    ) {
        throw new Error('Forbidden');
    }

    // Get institution from the professor record (works for SuperAdmin and regular users)
    const { slug, institutionId } = await resolveProfessorInstitution(id);

    const { groupIds, roleName, password, ...rest } = updateProfessorSchema.parse(data);

    const passwordData =
        password && password.length > 0
            ? { password: await bcrypt.hash(password, 10) }
            : {};

    await prisma.user.update({
        where: { id },
        data: {
            ...rest,
            ...passwordData,
            userRole: { connect: { name: roleName } },
            professorGroups: { set: groupIds.map((gid) => ({ id: gid })) },
        },
    });

    await logAudit({
        action: AUDIT_ACTION.PROFESSOR_UPDATE,
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorRole: session.user.userRoleName,
        academicInstitutionId: institutionId,
        entity: 'User',
        entityId: id,
    });

    revalidatePath(`/${slug}/professors`);
}

export async function deleteProfessor(id: string): Promise<void> {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');
    if (
        session.user.userRoleName !== USER_ROLE.ADMIN &&
        session.user.userRoleName !== USER_ROLE.SUPER_ADMIN
    ) {
        throw new Error('Forbidden');
    }

    // Get institution from the professor record (works for SuperAdmin and regular users)
    const { slug, institutionId } = await resolveProfessorInstitution(id);

    await prisma.user.delete({ where: { id } });

    await logAudit({
        action: AUDIT_ACTION.PROFESSOR_DELETE,
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorRole: session.user.userRoleName,
        academicInstitutionId: institutionId,
        entity: 'User',
        entityId: id,
    });

    revalidatePath(`/${slug}/professors`);
}
