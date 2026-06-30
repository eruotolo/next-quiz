import { redirect, notFound } from 'next/navigation';
import { Card } from '@/shared/components/ui/card';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { LiveSessionForm } from '@/features/lms/components/live/LiveSessionForm';

interface PageProps {
    params: Promise<{ slug: string; id: string }>;
}

export default async function NewLiveSessionPage({ params }: PageProps) {
    const { slug, id } = await params;
    const access = await requireInstitutionPageAccess(slug);
    const { userId, userRole } = access;

    const course = await prisma.lmsCourse.findUnique({
        where: { id },
        select: { id: true, title: true, academicInstitutionId: true, createdById: true },
    });
    if (!course) notFound();

    const canCreate =
        userRole === USER_ROLE.SUPER_ADMIN ||
        userRole === USER_ROLE.ADMIN ||
        (userRole === USER_ROLE.PROFESOR && course.createdById === userId);
    if (!canCreate) redirect(`/${slug}/aula/${id}/clases`);

    return (
        <div className="flex flex-col gap-6 p-6">
            <header>
                <h1 className="text-2xl font-semibold">Nueva sesión en vivo</h1>
                <p className="text-sm text-muted-foreground">
                    Curso: <strong>{course.title}</strong>
                </p>
            </header>
            <Card className="p-6">
                <LiveSessionForm slug={slug} courseId={id} />
            </Card>
        </div>
    );
}
