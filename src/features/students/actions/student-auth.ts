'use server';

import { randomUUID } from 'node:crypto';
import { prisma } from '@/shared/lib/prisma';
import { isValidRut, normalizeRut } from '@/shared/lib/rut';
import { USER_ROLE } from '@/shared/lib/roles';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { createResultSession, createStudentSession } from '@/features/exam-session/lib/session';
import { redirect } from 'next/navigation';

interface ActionState {
    error?: string;
}

export async function validateStudent(
    _prevState: ActionState,
    formData: FormData,
): Promise<ActionState> {
    const raw = ((formData.get('credential') as string) ?? '').trim();
    if (!raw) return { error: 'Ingresá tu RUT o email.' };

    const isEmail = raw.includes('@');

    let student: { id: string; email: string; groupId: string | null } | null = null;

    if (isEmail) {
        const emailLower = raw.toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
            await logAudit({
                action: AUDIT_ACTION.STUDENT_LOGIN_FAILURE,
                actorEmail: emailLower,
                actorRole: USER_ROLE.STUDENT,
                status: 'failure',
                metadata: { reason: 'invalid_email_format' },
            });
            return { error: 'Email inválido.' };
        }
        student = await prisma.user.findFirst({
            where: { email: emailLower, userRole: { name: USER_ROLE.STUDENT } },
            select: { id: true, email: true, groupId: true },
        });
        if (!student) {
            await logAudit({
                action: AUDIT_ACTION.STUDENT_LOGIN_FAILURE,
                actorEmail: emailLower,
                actorRole: USER_ROLE.STUDENT,
                status: 'failure',
                metadata: { reason: 'email_not_found' },
            });
            return { error: 'Email no encontrado. Verificá con tu profesor.' };
        }
    } else {
        const rut = normalizeRut(raw);
        if (!isValidRut(rut)) {
            await logAudit({
                action: AUDIT_ACTION.STUDENT_LOGIN_FAILURE,
                actorRole: USER_ROLE.STUDENT,
                status: 'failure',
                metadata: { reason: 'invalid_rut_format' },
            });
            return { error: 'RUT inválido.' };
        }
        student = await prisma.user.findFirst({
            where: { rut, userRole: { name: USER_ROLE.STUDENT } },
            select: { id: true, email: true, groupId: true },
        });
        if (!student) {
            await logAudit({
                action: AUDIT_ACTION.STUDENT_LOGIN_FAILURE,
                actorRole: USER_ROLE.STUDENT,
                status: 'failure',
                metadata: { reason: 'rut_not_found' },
            });
            return { error: 'RUT no encontrado. Verificá con tu profesor.' };
        }
    }

    if (!student) {
        return { error: 'Credencial no encontrada. Verificá con tu profesor.' };
    }

    if (!student.groupId) {
        await logAudit({
            action: AUDIT_ACTION.STUDENT_LOGIN_FAILURE,
            actorId: student.id,
            actorEmail: student.email,
            actorRole: USER_ROLE.STUDENT,
            status: 'failure',
            metadata: { reason: 'no_group_assigned' },
        });
        return { error: 'No estás asignado a ningún grupo. Verificá con tu profesor.' };
    }

    const exam = await prisma.exam.findFirst({
        where: { active: true, groups: { some: { id: student.groupId } } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, timeLimit: true, _count: { select: { questions: true } } },
    });

    if (!exam) {
        await logAudit({
            action: AUDIT_ACTION.STUDENT_LOGIN_FAILURE,
            actorId: student.id,
            actorEmail: student.email,
            actorRole: USER_ROLE.STUDENT,
            status: 'failure',
            metadata: { reason: 'no_active_exam' },
        });
        return { error: 'Tu grupo no tiene un examen activo en este momento.' };
    }

    if (exam._count.questions === 0) {
        await logAudit({
            action: AUDIT_ACTION.STUDENT_LOGIN_FAILURE,
            actorId: student.id,
            actorEmail: student.email,
            actorRole: USER_ROLE.STUDENT,
            status: 'failure',
            metadata: { reason: 'exam_has_no_questions', examId: exam.id },
        });
        return {
            error: 'El examen activo no tiene preguntas disponibles. Verificá con tu profesor.',
        };
    }

    const existing = await prisma.result.findUnique({
        where: { studentId_examId: { studentId: student.id, examId: exam.id } },
    });
    if (existing) {
        await logAudit({
            action: AUDIT_ACTION.STUDENT_LOGIN_SUCCESS,
            actorId: student.id,
            actorEmail: student.email,
            actorRole: USER_ROLE.STUDENT,
            entity: 'Exam',
            entityId: exam.id,
            status: 'success',
            metadata: { resumedResult: existing.id },
        });
        await createResultSession(existing.id, student.id);
        redirect(`/examen/resultado/${existing.id}`);
    }

    const endsAt = Date.now() + exam.timeLimit * 60 * 1000;
    const attemptKey = randomUUID();

    await logAudit({
        action: AUDIT_ACTION.STUDENT_LOGIN_SUCCESS,
        actorId: student.id,
        actorEmail: student.email,
        actorRole: USER_ROLE.STUDENT,
        entity: 'Exam',
        entityId: exam.id,
        status: 'success',
    });

    await createStudentSession({ studentId: student.id, examId: exam.id, endsAt, attemptKey });

    redirect(`/examen/${exam.id}`);
}
