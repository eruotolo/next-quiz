'use server';

import { prisma } from '@/shared/lib/prisma';
import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { ok, fail } from '@/shared/types/action';
import type { ActionResult } from '@/shared/types/action';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { tryIssueCertificate } from '@/features/lms/lib/certificate-issuer';

export interface CertificateStudent {
    userId: string;
    name: string;
    lastname: string;
    email: string;
    progressPct: number;
    completedAt: string | null;
    certificate: {
        id: string;
        verificationCode: string;
        finalGrade: number | null;
        issuedAt: string;
        revokedAt: string | null;
        pdfUrl: string | null;
        qrCodeUrl: string | null;
    } | null;
}

export interface PublicCertificate {
    id: string;
    verificationCode: string;
    finalGrade: number | null;
    issuedAt: string;
    revokedAt: string | null;
    pdfUrl: string | null;
    student: { name: string; lastname: string };
    course: { title: string; institution: string };
}

const issueSchema = z.object({
    courseId: z.string().uuid(),
    studentId: z.string().uuid(),
    finalGrade: z.number().min(1).max(7).nullable().optional(),
});

export async function issueLmsCertificate(
    slug: string,
    input: z.infer<typeof issueSchema>,
): Promise<ActionResult<{ verificationCode: string; pdfUrl: string | null }>> {
    try {
        const ctx = await requireInstitutionAccess(slug);
        const parsed = issueSchema.safeParse(input);
        if (!parsed.success) return fail('Datos inválidos.');

        const { courseId, studentId, finalGrade } = parsed.data;

        const course = await prisma.lmsCourse.findFirst({
            where: { id: courseId, academicInstitutionId: ctx.institutionId },
            select: { id: true },
        });
        if (!course) return fail('Curso no encontrado.');

        const enrollment = await prisma.lmsEnrollment.findUnique({
            where: { userId_courseId: { userId: studentId, courseId } },
            select: { id: true },
        });
        if (!enrollment) return fail('El estudiante no está inscripto en el curso.');

        const result = await tryIssueCertificate({
            userId: studentId,
            courseId,
            finalGrade: finalGrade ?? null,
            slug,
        });

        if (!result.ok) {
            return fail(result.error ?? 'Error al emitir el certificado.');
        }

        revalidatePath(`/${slug}/aula/${courseId}/certificados`);
        return ok({
            verificationCode: result.verificationCode ?? '',
            pdfUrl: result.pdfUrl ?? null,
        });
    } catch {
        return fail('Error al emitir el certificado.');
    }
}

export async function revokeLmsCertificate(
    slug: string,
    certificateId: string,
): Promise<ActionResult<void>> {
    try {
        const ctx = await requireInstitutionAccess(slug);

        const cert = await prisma.lmsCertificate.findUnique({
            where: { id: certificateId },
            select: { id: true, course: { select: { academicInstitutionId: true, id: true } } },
        });
        if (!cert || cert.course.academicInstitutionId !== ctx.institutionId) {
            return fail('Certificado no encontrado.');
        }

        await prisma.lmsCertificate.update({
            where: { id: certificateId },
            data: { revokedAt: new Date() },
        });

        revalidatePath(`/${slug}/aula/${cert.course.id}/certificados`);
        return ok(undefined);
    } catch {
        return fail('Error al revocar el certificado.');
    }
}

export async function listCourseCertificates(
    slug: string,
    courseId: string,
): Promise<ActionResult<CertificateStudent[]>> {
    try {
        const ctx = await requireInstitutionAccess(slug);

        const course = await prisma.lmsCourse.findFirst({
            where: { id: courseId, academicInstitutionId: ctx.institutionId },
            select: { id: true },
        });
        if (!course) return fail('Curso no encontrado.');

        const enrollments = await prisma.lmsEnrollment.findMany({
            where: { courseId, status: { not: 'RETIRADO' } },
            select: {
                progressPct: true,
                completedAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true,
                        lmsCertificates: {
                            where: { courseId },
                            select: {
                                id: true,
                                verificationCode: true,
                                finalGrade: true,
                                issuedAt: true,
                                revokedAt: true,
                                pdfUrl: true,
                                qrCodeUrl: true,
                            },
                            take: 1,
                        },
                    },
                },
            },
            orderBy: { progressPct: 'desc' },
        });

        const data: CertificateStudent[] = enrollments.map((e) => {
            const cert = e.user.lmsCertificates[0] ?? null;
            return {
                userId: e.user.id,
                name: e.user.name,
                lastname: e.user.lastname,
                email: e.user.email,
                progressPct: e.progressPct,
                completedAt: e.completedAt?.toISOString() ?? null,
                certificate: cert
                    ? {
                          id: cert.id,
                          verificationCode: cert.verificationCode,
                          finalGrade: cert.finalGrade ? Number(cert.finalGrade) : null,
                          issuedAt: cert.issuedAt.toISOString(),
                          revokedAt: cert.revokedAt?.toISOString() ?? null,
                          pdfUrl: cert.pdfUrl,
                          qrCodeUrl: cert.qrCodeUrl,
                      }
                    : null,
            };
        });

        return ok(data);
    } catch {
        return fail('Error al cargar los certificados.');
    }
}

export async function verifyCertificate(code: string): Promise<ActionResult<PublicCertificate>> {
    try {
        const cert = await prisma.lmsCertificate.findUnique({
            where: { verificationCode: code },
            select: {
                id: true,
                verificationCode: true,
                finalGrade: true,
                issuedAt: true,
                revokedAt: true,
                pdfUrl: true,
                user: { select: { name: true, lastname: true } },
                course: {
                    select: {
                        title: true,
                        academicInstitution: { select: { name: true } },
                    },
                },
            },
        });

        if (!cert) return fail('Certificado no encontrado.');

        return ok({
            id: cert.id,
            verificationCode: cert.verificationCode,
            finalGrade: cert.finalGrade ? Number(cert.finalGrade) : null,
            issuedAt: cert.issuedAt.toISOString(),
            revokedAt: cert.revokedAt?.toISOString() ?? null,
            pdfUrl: cert.pdfUrl,
            student: { name: cert.user.name, lastname: cert.user.lastname },
            course: {
                title: cert.course.title,
                institution: cert.course.academicInstitution?.name ?? 'Institución',
            },
        });
    } catch {
        return fail('Error al verificar el certificado.');
    }
}

export async function getMyCourseCertificate(
    courseId: string,
): Promise<ActionResult<PublicCertificate | null>> {
    try {
        const { getStudentAuthSession } = await import('@/features/exam-session/lib/session');
        const session = await getStudentAuthSession();
        if (!session) return fail('No autenticado.');

        const cert = await prisma.lmsCertificate.findUnique({
            where: { userId_courseId: { userId: session.studentId, courseId } },
            select: {
                id: true,
                verificationCode: true,
                finalGrade: true,
                issuedAt: true,
                revokedAt: true,
                pdfUrl: true,
                user: { select: { name: true, lastname: true } },
                course: {
                    select: {
                        title: true,
                        academicInstitution: { select: { name: true } },
                    },
                },
            },
        });

        if (!cert) return ok(null);

        return ok({
            id: cert.id,
            verificationCode: cert.verificationCode,
            finalGrade: cert.finalGrade ? Number(cert.finalGrade) : null,
            issuedAt: cert.issuedAt.toISOString(),
            revokedAt: cert.revokedAt?.toISOString() ?? null,
            pdfUrl: cert.pdfUrl,
            student: { name: cert.user.name, lastname: cert.user.lastname },
            course: {
                title: cert.course.title,
                institution: cert.course.academicInstitution?.name ?? 'Institución',
            },
        });
    } catch {
        return fail('Error al cargar tu certificado.');
    }
}
