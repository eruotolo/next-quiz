'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { ADMIN_ROLES, USER_ROLE, type UserRoleName } from '@/shared/lib/roles';

export type ExamStatus = 'activo' | 'programado' | 'cerrado' | 'borrador';

export interface ExamListItem {
    id: string;
    title: string;
    active: boolean;
    status: ExamStatus;
    timeLimit: number;
    subject: string | null;
    scheduledAt: Date | null;
    closesAt: Date | null;
    questionCount: number;
    resultCount: number;
    groupNames: string;
}

function deriveStatus(exam: {
    active: boolean;
    scheduledAt: Date | null;
    closesAt: Date | null;
}): ExamStatus {
    const now = new Date();
    if (exam.active) {
        if (exam.closesAt && exam.closesAt < now) return 'cerrado';
        return 'activo';
    }
    if (exam.scheduledAt && exam.scheduledAt > now) return 'programado';
    return 'borrador';
}

export async function getExamsList(
    academicInstitutionId: string,
    filter?: ExamStatus | 'todos',
): Promise<{ data: ExamListItem[]; error: string | null }> {
    const session = await auth();
    if (!session?.user) return { data: [], error: 'No autorizado' };
    if (!ADMIN_ROLES.includes(session.user.userRoleName as UserRoleName)) {
        return { data: [], error: 'Sin permisos' };
    }

    const isSuperAdmin = session.user.userRoleName === USER_ROLE.SUPER_ADMIN;
    if (!isSuperAdmin && session.user.academicInstitutionId !== academicInstitutionId) {
        return { data: [], error: 'Sin permisos' };
    }

    const exams = await prisma.exam.findMany({
        where: {
            academicInstitutionId,
        },
        select: {
            id: true,
            title: true,
            active: true,
            timeLimit: true,
            subject: true,
            scheduledAt: true,
            closesAt: true,
            _count: { select: { questions: true, results: true } },
            groups: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
    });

    const items: ExamListItem[] = exams.map((e) => ({
        id: e.id,
        title: e.title,
        active: e.active,
        status: deriveStatus(e),
        timeLimit: e.timeLimit,
        subject: e.subject,
        scheduledAt: e.scheduledAt,
        closesAt: e.closesAt,
        questionCount: e._count.questions,
        resultCount: e._count.results,
        groupNames: e.groups.map((g) => g.name).join(', '),
    }));

    const filtered =
        !filter || filter === 'todos' ? items : items.filter((i) => i.status === filter);

    return { data: filtered, error: null };
}
