import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { listCourseCertificates } from '@/features/lms/actions/certificates';
import { LmsCertificatesClient } from '@/features/lms/components/LmsCertificatesClient';
import { prisma } from '@/shared/lib/prisma';
import { notFound } from 'next/navigation';
import { Award } from 'lucide-react';

interface Props {
    params: Promise<{ slug: string; id: string }>;
}

export default async function CertificadosPage({ params }: Props) {
    const { slug, id: courseId } = await params;
    const { institutionId, institutionName } = await requireInstitutionPageAccess(slug);

    const course = await prisma.lmsCourse.findFirst({
        where: { id: courseId, academicInstitutionId: institutionId },
        select: { title: true, certificateEnabled: true },
    });
    if (!course) notFound();

    const result = await listCourseCertificates(slug, courseId);
    const students = result.data ?? [];
    const issued = students.filter((s) => s.certificate && !s.certificate.revokedAt).length;

    return (
        <>
            <AdminTopBar
                title="Certificados"
                icon={<Award size={18} />}
                breadcrumb={[institutionName, 'Aula Virtual', course.title, 'Certificados']}
                subtitle={`${issued} emitidos · ${students.length} inscriptos`}
            />
            <LmsCertificatesClient
                slug={slug}
                courseId={courseId}
                students={students}
                certificateEnabled={course.certificateEnabled}
            />
        </>
    );
}
