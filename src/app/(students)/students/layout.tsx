import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
    StudentSidebar,
    StudentSidebarProvider,
} from '@/features/students/components/layout/StudentSidebar';
import { StudentTopBar } from '@/shared/components/layout/StudentTopBar';
import { BadgeUnlockProvider } from '@/features/lms/components/BadgeUnlockProvider';
import { getUnseenBadges } from '@/features/lms/actions/gamification';
import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { prisma } from '@/shared/lib/prisma';
import { getNotificationsFeed } from '@/features/students/lib/dashboard-queries';
import { getInstitutionFlags } from '@/features/auth/lib/institution-flags';

export default async function StudentLayout({ children }: { children: ReactNode }) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') ?? '';

    // Las rutas de examen (login, intro, examen, resultado) manejan su propia UI fullscreen.
    // /students/examen/seleccion sí usa el layout estándar (header + sidebar).
    const isExamFullscreen =
        pathname.startsWith('/students/examen') &&
        !pathname.startsWith('/students/examen/seleccion');
    if (isExamFullscreen) {
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
                academicInstitution: { select: { id: true, name: true, plan: true } },
                group: { select: { name: true } },
            },
        }),
        getNotificationsFeed(session.studentId),
        getUnseenBadges(),
    ]);

    if (!student) redirect('/students/examen/login');

    // Gating LMS (Fase 3.4): lee el flag real de la institución con fallback
    // al heurístico por plan. Si LMS está deshabilitado, el sidebar no muestra
    // "Mis cursos" y la ruta /students/aula queda inaccesible desde el menú.
    const flags = student.academicInstitution?.id
        ? await getInstitutionFlags(
              student.academicInstitution.id,
              student.academicInstitution.plan,
          )
        : { examsEnabled: true, lmsEnabled: false, examsPlanCode: null, lmsPlanCode: null };
    const hasLms = flags.lmsEnabled;
    const fullName = `${student.name ?? ''} ${student.lastname ?? ''}`.trim() || 'Estudiante';

    return (
        <BadgeUnlockProvider initialUnseenBadges={unseenBadges}>
            <StudentSidebarProvider>
                <div className="bg-paper flex min-h-screen flex-col">
                    <StudentTopBar
                        institutionName={student.academicInstitution?.name ?? 'Aulika'}
                        studentName={fullName}
                        groupName={student.group?.name ?? null}
                        notificationCount={notifications.unreadCount}
                    />
                    <div className="flex flex-1">
                        <StudentSidebar
                            studentName={fullName}
                            groupName={student.group?.name ?? null}
                            institutionName={student.academicInstitution?.name ?? 'Aulika'}
                            notificationCount={notifications.unreadCount}
                            hasLms={hasLms}
                        />
                        <main className="flex min-w-0 flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                            {children}
                        </main>
                    </div>
                </div>
            </StudentSidebarProvider>
        </BadgeUnlockProvider>
    );
}
