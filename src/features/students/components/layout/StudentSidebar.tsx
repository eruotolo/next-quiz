'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Bell,
    BookOpen,
    Calendar,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    Menu,
    MonitorPlay,
    Settings,
    X,
} from 'lucide-react';
import { Avatar } from '@/shared/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import { LogoLockup } from '@/shared/components/branding/logo';
import { logoutStudent } from '@/features/exam-session/actions/mutations';
import { cn } from '@/shared/lib/utils';

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

export interface StudentSidebarProps {
    studentName: string;
    groupName: string | null;
    institutionName: string;
    notificationCount: number;
    hasLms: boolean;
}

const BASE_NAV: NavItem[] = [
    { href: '/students/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/students/mis-materias', label: 'Mis materias', icon: BookOpen },
    { href: '/students/calendario', label: 'Calendario', icon: Calendar },
    { href: '/students/examen/seleccion', label: 'Exámenes', icon: GraduationCap },
    { href: '/students/configuracion', label: 'Configuración', icon: Settings },
];

const LMS_ITEM: NavItem = {
    href: '/students/aula',
    label: 'Mis cursos',
    icon: MonitorPlay,
};

function NavLink({
    item,
    isActive,
    onClick,
}: {
    item: NavItem;
    isActive: boolean;
    onClick?: () => void;
}) {
    const Icon = item.icon;
    return (
        <Link
            href={item.href as `/${string}`}
            onClick={onClick}
            className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors',
                isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-ink-dim hover:bg-paper-warm hover:text-ink',
            )}
        >
            <Icon className="size-4 shrink-0" />
            {item.label}
        </Link>
    );
}

function NotificationLink({
    count,
    pathname,
    onClick,
}: {
    count: number;
    pathname: string;
    onClick?: () => void;
}) {
    const isActive = pathname === '/students/notificaciones';
    return (
        <Link
            href="/students/notificaciones"
            onClick={onClick}
            className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors',
                isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-ink-dim hover:bg-paper-warm hover:text-ink',
            )}
        >
            <Bell className="size-4 shrink-0" />
            Notificaciones
            {count > 0 && (
                <span className="bg-coral ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-bold text-white">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </Link>
    );
}

function buildNavItems(hasLms: boolean): NavItem[] {
    if (!hasLms) return BASE_NAV;
    const first = BASE_NAV[0];
    if (!first) return BASE_NAV;
    return [first, LMS_ITEM, ...BASE_NAV.slice(1)];
}

function isItemActive(item: NavItem, pathname: string): boolean {
    if (item.href === '/students/dashboard') return pathname === '/students/dashboard';
    return pathname.startsWith(item.href);
}

function SidebarFooter({
    studentName,
    groupName,
}: {
    studentName: string;
    groupName: string | null;
}) {
    return (
        <div className="border-border border-t px-4 pt-4 pb-3">
            <div className="flex items-center gap-3">
                <Avatar name={studentName} size={34} />
                <div className="min-w-0 flex-1">
                    <p className="text-ink truncate text-[13px] font-semibold leading-tight">
                        {studentName}
                    </p>
                    {groupName && (
                        <p className="text-mute truncate text-[11px]">{groupName}</p>
                    )}
                </div>
                <form action={logoutStudent}>
                    <button
                        type="submit"
                        title="Cerrar sesión"
                        className="text-mute hover:text-destructive flex items-center justify-center rounded-lg p-1.5 transition-colors"
                    >
                        <LogOut className="size-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}

function SidebarInner({
    studentName,
    groupName,
    institutionName,
    notificationCount,
    hasLms,
    pathname,
    onNavClick,
}: StudentSidebarProps & { pathname: string; onNavClick?: () => void }) {
    const navItems = buildNavItems(hasLms);

    return (
        <div className="flex h-full flex-col">
            {/* Header: logo + institution */}
            <div className="border-border border-b px-4 py-4">
                <Link href="/students/dashboard" onClick={onNavClick} className="flex items-center gap-2">
                    <LogoLockup size={26} />
                </Link>
                <p className="text-mute mt-1.5 truncate font-mono text-[10px] font-bold tracking-widest uppercase">
                    {institutionName}
                </p>
            </div>

            {/* Nav */}
            <div className="flex-1 overflow-y-auto py-3">
                <nav className="flex flex-col gap-0.5 px-3">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            item={item}
                            isActive={isItemActive(item, pathname)}
                            onClick={onNavClick}
                        />
                    ))}
                    {hasLms && (
                        <NotificationLink
                            count={notificationCount}
                            pathname={pathname}
                            onClick={onNavClick}
                        />
                    )}
                </nav>
            </div>

            <SidebarFooter studentName={studentName} groupName={groupName} />
        </div>
    );
}

export function StudentSidebar(props: StudentSidebarProps) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* ── Desktop: fixed left panel ─────────────────────────── */}
            <aside className="border-border fixed top-0 left-0 hidden h-screen w-60 border-r bg-white xl:w-70 lg:flex lg:flex-col">
                <SidebarInner {...props} pathname={pathname} />
            </aside>

            {/* ── Mobile: top bar + Sheet drawer ───────────────────── */}
            <div className="border-border bg-white/95 fixed top-0 right-0 left-0 z-40 flex h-14 items-center justify-between border-b px-4 backdrop-blur-sm lg:hidden">
                {/* Hamburger */}
                <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="text-ink-dim hover:text-ink flex items-center justify-center rounded-lg p-2 transition-colors"
                    aria-label="Abrir menú"
                >
                    <Menu className="size-5" />
                </button>

                {/* Logo centrado */}
                <Link href="/students/dashboard">
                    <LogoLockup size={22} />
                </Link>

                {/* Bell con badge */}
                <Link
                    href="/students/notificaciones"
                    className="text-ink-dim hover:text-ink relative flex items-center justify-center rounded-lg p-2 transition-colors"
                    aria-label="Notificaciones"
                >
                    <Bell className="size-5" />
                    {props.notificationCount > 0 && (
                        <span className="bg-coral absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold text-white">
                            {props.notificationCount > 99 ? '99+' : props.notificationCount}
                        </span>
                    )}
                </Link>
            </div>

            {/* Sheet Drawer (mobile) */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="w-72 p-0">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Menú de navegación</SheetTitle>
                    </SheetHeader>
                    <SidebarInner
                        {...props}
                        pathname={pathname}
                        onNavClick={() => setMobileOpen(false)}
                    />
                </SheetContent>
            </Sheet>
        </>
    );
}
