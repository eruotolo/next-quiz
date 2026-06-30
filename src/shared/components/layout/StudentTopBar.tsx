'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Menu } from 'lucide-react';
import { LogoMark, LogoWordmark } from '@/shared/components/branding/logo';
import { Avatar } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { logoutStudent } from '@/features/exam-session/actions/mutations';
import { useStudentSidebar } from '@/features/students/components/layout/StudentSidebar';

interface Props {
    institutionName: string;
    studentName: string;
    groupName: string | null;
    notificationCount: number;
}

function resolvePageTitle(pathname: string): string {
    if (pathname === '/students/dashboard') return 'Panel principal';
    if (pathname === '/students/mis-materias') return 'Mis materias';
    if (pathname === '/students/calendario') return 'Calendario';
    if (pathname === '/students/configuracion') return 'Configuración';
    if (pathname === '/students/notificaciones') return 'Notificaciones';
    if (pathname.startsWith('/students/aula/logros')) return 'Mis logros';
    if (pathname.startsWith('/students/aula/clases/')) return 'Clase en vivo';
    if (pathname.startsWith('/students/aula/cursos/')) {
        if (pathname.includes('/leccion/')) return 'Lección';
        if (pathname.includes('/foro')) return 'Foro';
        if (pathname.includes('/logros')) return 'Ranking';
        if (pathname.includes('/clases')) return 'Clases en vivo';
        return 'Detalle del curso';
    }
    if (pathname.startsWith('/students/aula')) return 'Aula Virtual';
    return 'Panel Estudiante';
}

export function StudentTopBar({
    institutionName,
    studentName,
    groupName,
    notificationCount,
}: Props) {
    const pathname = usePathname();
    const { openMobile } = useStudentSidebar();
    const pageTitle = resolvePageTitle(pathname);
    const topbarLabel = `${institutionName} · ${pageTitle}`;

    return (
        <header className="border-border sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white px-4 lg:px-8">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={openMobile}
                    className="text-ink-dim hover:text-ink -ml-2 flex items-center justify-center rounded-lg p-2 transition-colors lg:hidden"
                    aria-label="Abrir menú"
                >
                    <Menu className="size-5" />
                </button>
                <LogoMark size={28} />
                <LogoWordmark size={16} color="#0b0b11" />
                <div className="bg-border ml-1 h-4 w-px" />
                <span className="text-mute hidden max-w-[420px] truncate font-mono text-[11px] tracking-[0.08em] uppercase sm:block">
                    {topbarLabel}
                </span>
            </div>
            <div className="flex items-center gap-4 lg:gap-6">
                <Link
                    href="/students/notificaciones"
                    className="text-ink-dim hover:text-ink relative flex items-center justify-center rounded-lg p-2 transition-colors lg:hidden"
                    aria-label="Notificaciones"
                >
                    <Bell className="size-5" />
                    {notificationCount > 0 && (
                        <span className="bg-coral absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold text-white">
                            {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                    )}
                </Link>
                <div className="flex items-center gap-3">
                    <Avatar name={studentName} size={36} />
                    <div className="hidden leading-tight sm:block">
                        <p className="text-ink text-[13px] font-semibold">{studentName}</p>
                        {groupName && <p className="text-mute text-[11px]">{groupName}</p>}
                    </div>
                </div>
                <form action={logoutStudent}>
                    <Button
                        variant="ghost"
                        size="sm"
                        type="submit"
                        className="text-mute hover:text-ink -ml-2"
                    >
                        Cerrar sesión
                    </Button>
                </form>
            </div>
        </header>
    );
}
