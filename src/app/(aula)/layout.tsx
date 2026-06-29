import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { redirect } from 'next/navigation';
import { LogoLockup } from '@/shared/components/branding/logo';
import { GraduationCap, Trophy } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { prisma } from '@/shared/lib/prisma';
import { NotificationBell } from '@/features/lms/components/NotificationBell';
import { BadgeUnlockProvider } from '@/features/lms/components/BadgeUnlockProvider';
import { getUnseenBadges } from '@/features/lms/actions/gamification';

export default async function AulaRootLayout({ children }: { children: ReactNode }) {
    const session = await getStudentAuthSession();
    if (!session) redirect('/examen/login');

    const [notifications, unreadCount, unseenBadges] = await Promise.all([
        prisma.lmsNotification.findMany({
            where: { userId: session.studentId, type: { not: 'BADGE_ACK' } },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: { id: true, type: true, message: true, link: true, read: true, createdAt: true },
        }),
        prisma.lmsNotification.count({
            where: { userId: session.studentId, read: false, type: { not: 'BADGE_ACK' } },
        }),
        getUnseenBadges(),
    ]);

    return (
        <BadgeUnlockProvider initialUnseenBadges={unseenBadges}>
            <div className="bg-paper min-h-screen">
                <header className="border-border bg-white">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
                        <Link href="/aula" className="flex items-center gap-2">
                            <LogoLockup size={28} />
                            <span className="text-mute font-mono text-xs tracking-wider uppercase">
                                Aula Virtual
                            </span>
                        </Link>
                        <nav className="flex items-center gap-4 text-sm">
                            <Link
                                href="/aula"
                                className="text-ink-dim hover:text-ink flex items-center gap-1.5"
                            >
                                <GraduationCap size={16} /> Mis cursos
                            </Link>
                            <Link
                                href="/aula/logros"
                                className="text-ink-dim hover:text-ink flex items-center gap-1.5"
                            >
                                <Trophy size={16} /> Mis logros
                            </Link>
                            <Link
                                href="/examen/seleccion"
                                className="text-mute hover:text-ink-dim text-xs"
                            >
                                Ir a exámenes
                            </Link>
                            <NotificationBell
                                initialNotifications={notifications}
                                initialUnreadCount={unreadCount}
                            />
                        </nav>
                    </div>
                </header>
                <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
            </div>
        </BadgeUnlockProvider>
    );
}
