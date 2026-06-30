import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { StudentSidebar } from '@/features/students/components/layout/StudentSidebar';
import { BadgeUnlockProvider } from '@/features/lms/components/BadgeUnlockProvider';
import { getUnseenBadges } from '@/features/lms/actions/gamification';
import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { prisma } from '@/shared/lib/prisma';
import { getNotificationsFeed } from '@/features/students/lib/dashboard-queries';

// Rutas de examen bajo /students/examen/ tienen su propia UI (fixed inset-0) — sin sidebar
const EXAM_FLOW_PREFIXES = ['/students/examen'];

export default async function StudentLayout({ children }: { children: ReactNode }) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') ?? '';

    // Las rutas de examen manejan su propia autenticación y UI — no agregar sidebar
    if (EXAM_FLOW_PREFIXES.some((p) => pathname.startsWith(p))) {
        return <>{children}</>;
    }

    const session = await getStudentAuthSession();
    if (!session) redirect('/students/examen/login');

    const [student, notifications, unseenBadges] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.studentId },
            select: {
                name: true,
                lastname: true,
                academicInstitution: { select: { name: true, plan: true } },
                group: { select: { name: true } },
            },
        }),
        getNotificationsFeed(session.studentId),
        getUnseenBadges(),
    ]);

    if (!student) redirect('/students/examen/login');

    const hasLms = student.academicInstitution?.plan !== 'FREE';
    const fullName = `${student.name ?? ''} ${student.lastname ?? ''}`.trim() || 'Estudiante';

    return (
        <BadgeUnlockProvider initialUnseenBadges={unseenBadges}>
            <div className="bg-paper flex min-h-screen">
                <StudentSidebar
                    studentName={fullName}
                    groupName={student.group?.name ?? null}
                    institutionName={student.academicInstitution?.name ?? 'Aulika'}
                    notificationCount={notifications.unreadCount}
                    hasLms={hasLms}
                />
                <main className="flex flex-1 flex-col overflow-y-auto pt-14 lg:ml-60 lg:pt-0 xl:ml-70">
                    {children}
                </main>
            </div>
        </BadgeUnlockProvider>
    );
}
