import { prisma } from '@/shared/lib/prisma';
import { uploadCertificatePdf } from '@/shared/lib/cloudinary';
import { generateCertificatePdfBuffer } from '@/features/lms/lib/certificate-pdf';

export interface IssueCertificateInput {
    userId: string;
    courseId: string;
    finalGrade?: number | null;
    slug?: string;
}

export interface IssueCertificateResult {
    ok: boolean;
    verificationCode?: string;
    pdfUrl?: string | null;
    error?: string;
}

function getVerificationBaseUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? 'https://aulika.cl';
}

function generateVerificationCode(): string {
    return `cert_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
}

export async function tryIssueCertificate(
    input: IssueCertificateInput,
): Promise<IssueCertificateResult> {
    try {
        const existing = await prisma.lmsCertificate.findUnique({
            where: { userId_courseId: { userId: input.userId, courseId: input.courseId } },
            select: { id: true, verificationCode: true, pdfUrl: true, revokedAt: true },
        });

        if (existing && existing.revokedAt === null && existing.pdfUrl) {
            return { ok: true, verificationCode: existing.verificationCode, pdfUrl: existing.pdfUrl };
        }

        const [student, course] = await Promise.all([
            prisma.user.findUnique({
                where: { id: input.userId },
                select: { name: true, lastname: true, rut: true },
            }),
            prisma.lmsCourse.findUnique({
                where: { id: input.courseId },
                select: {
                    title: true,
                    certificateEnabled: true,
                    academicInstitution: { select: { name: true } },
                },
            }),
        ]);

        if (!student || !course) {
            return { ok: false, error: 'Estudiante o curso no encontrado' };
        }
        if (!course.certificateEnabled) {
            return { ok: false, error: 'Certificados deshabilitados en este curso' };
        }
        const institutionName = course.academicInstitution?.name ?? 'Institución';

        const verificationCode = existing?.verificationCode ?? generateVerificationCode();
        const baseUrl = getVerificationBaseUrl();
        const verificationUrl = `${baseUrl}/certificado/${verificationCode}`;

        let pdfBuffer: Buffer | null = null;
        try {
            pdfBuffer = await generateCertificatePdfBuffer({
                studentFullName: `${student.name} ${student.lastname}`.trim(),
                studentRut: student.rut,
                courseTitle: course.title,
                institutionName,
                finalGrade: input.finalGrade ?? null,
                issuedAt: new Date(),
                verificationCode,
                verificationUrl,
            });
        } catch (pdfErr) {
            console.error('[certificate-issuer] PDF generation failed:', pdfErr);
        }

        let pdfUrl: string | null = existing?.pdfUrl ?? null;
        if (pdfBuffer) {
            const upload = await uploadCertificatePdf(pdfBuffer, verificationCode);
            if (upload.uploaded) {
                pdfUrl = upload.url ?? null;
            } else {
                console.warn('[certificate-issuer] Cloudinary upload skipped:', upload.error);
            }
        }

        await prisma.lmsCertificate.upsert({
            where: { userId_courseId: { userId: input.userId, courseId: input.courseId } },
            create: {
                userId: input.userId,
                courseId: input.courseId,
                verificationCode,
                finalGrade: input.finalGrade ?? null,
                pdfUrl,
                qrCodeUrl: verificationUrl,
                revokedAt: null,
            },
            update: {
                finalGrade: input.finalGrade ?? null,
                pdfUrl,
                qrCodeUrl: verificationUrl,
                revokedAt: null,
                issuedAt: new Date(),
            },
        });

        return { ok: true, verificationCode, pdfUrl };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        console.error('[certificate-issuer] failed:', message);
        return { ok: false, error: message };
    }
}
