import { requireLmsAccess } from '@/features/auth/lib/auth-guard';
import { LmsCourseTabs } from '@/features/lms/components/LmsCourseTabs';
import { prisma } from '@/shared/lib/prisma';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    params: Promise<{ slug: string; id: string }>;
}

export default async function AulaCourseLayout({ children, params }: Props) {
    const { slug, id } = await params;
    const { institutionId } = await requireLmsAccess(slug);

    const course = await prisma.lmsCourse.findFirst({
        where: { id, academicInstitutionId: institutionId },
        select: { id: true },
    });
    if (!course) notFound();

    return (
        <div className="flex flex-1 flex-col">
            <LmsCourseTabs slug={slug} courseId={id} />
            {children}
        </div>
    );
}
