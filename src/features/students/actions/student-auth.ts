'use server';

import { prisma } from '@/shared/lib/prisma';
import { isValidRut, normalizeRut } from '@/shared/lib/rut';
import { USER_ROLE } from '@/shared/lib/roles';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { createStudentAuthSession } from '@/features/exam-session/lib/session';
import { redirect } from 'next/navigation';

interface ActionState {
    error?: string;
}

/**
 * Valida la credencial del estudiante (RUT o email) y abre su sesión.
 * Siempre redirige al panel "Mis exámenes" (/examen/seleccion), que resuelve
 * qué mostrar (disponibles, próximos o rendidos) y desde dónde se elige rendir.
 */
export async function validateStudent(
    _prevState: ActionState,
    formData: FormData,
): Promise<ActionState> {
    const raw = ((formData.get('credential') as string) ?? '').trim();
    if (!raw) return { error: 'Ingresá tu RUT o email.' };

    const isEmail = raw.includes('@');

    let student: {
        id: string;
        email: string;
        groupId: string | null;
        academicInstitutionId: string | null;
    } | null = null;

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
            select: { id: true, email: true, groupId: true, academicInstitutionId: true },
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
            select: { id: true, email: true, groupId: true, academicInstitutionId: true },
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

    await logAudit({
        action: AUDIT_ACTION.STUDENT_LOGIN_SUCCESS,
        actorId: student.id,
        actorEmail: student.email,
        actorRole: USER_ROLE.STUDENT,
        status: 'success',
    });

    await createStudentAuthSession({ studentId: student.id, groupId: student.groupId });

    // Si la institución tiene Aula Virtual habilitada (≥1 curso LMS publicado),
    // derivamos al selector dual. Si no, vamos directo al panel de exámenes.
    const hasLms = student.academicInstitutionId
        ? (await prisma.lmsCourse.count({
              where: {
                  academicInstitutionId: student.academicInstitutionId,
                  published: true,
              },
          })) > 0
        : false;

    redirect('/students/dashboard');
}
