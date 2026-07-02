import { prisma } from '@/shared/lib/prisma';
import { generateCertificatePdfBuffer } from '@/features/lms/lib/certificate-pdf';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface RouteParams {
    params: Promise<{ code: string }>;
}

function getVerificationBaseUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? 'https://aulika.cl';
}

export async function GET(_request: Request, { params }: RouteParams) {
    const { code } = await params;

    const cert = await prisma.lmsCertificate.findUnique({
        where: { verificationCode: code },
        select: {
            pdfUrl: true,
            revokedAt: true,
            finalGrade: true,
            issuedAt: true,
            user: { select: { name: true, lastname: true, rut: true } },
            course: {
                select: { title: true, academicInstitution: { select: { name: true } } },
            },
        },
    });

    if (!cert || cert.revokedAt) {
        return NextResponse.json({ error: 'Certificado no encontrado.' }, { status: 404 });
    }

    if (cert.pdfUrl) {
        return NextResponse.redirect(cert.pdfUrl);
    }

    const buffer = await generateCertificatePdfBuffer({
        studentFullName: `${cert.user.name} ${cert.user.lastname}`.trim(),
        studentRut: cert.user.rut,
        courseTitle: cert.course.title,
        institutionName: cert.course.academicInstitution?.name ?? 'Institución',
        finalGrade: cert.finalGrade ? Number(cert.finalGrade) : null,
        issuedAt: cert.issuedAt,
        verificationCode: code,
        verificationUrl: `${getVerificationBaseUrl()}/certificado/${code}`,
    });

    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="certificado-${code}.pdf"`,
        },
    });
}
