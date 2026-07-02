'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BookOpen,
    Calendar,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    MonitorPlay,
    Settings,
} from 'lucide-react';
import { Avatar } from '@/shared/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
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
                    <p className="text-ink truncate text-[13px] leading-tight font-semibold">
                        {studentName}
                    </p>
                    {groupName && <p className="text-mute truncate text-[11px]">{groupName}</p>}
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
    hasLms,
    pathname,
    onNavClick,
}: StudentSidebarProps & { pathname: string; onNavClick?: () => void }) {
    const navItems = buildNavItems(hasLms);

    return (
        <div className="flex h-full flex-col">
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
                </nav>
            </div>

            <SidebarFooter studentName={studentName} groupName={groupName} />
        </div>
    );
}

interface StudentSidebarContextValue {
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
    openMobile: () => void;
}

const StudentSidebarContext = createContext<StudentSidebarContextValue | null>(null);

export function StudentSidebarProvider({ children }: { children: ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const value = useMemo<StudentSidebarContextValue>(
        () => ({ mobileOpen, setMobileOpen, openMobile: () => setMobileOpen(true) }),
        [mobileOpen],
    );
    return (
        <StudentSidebarContext.Provider value={value}>{children}</StudentSidebarContext.Provider>
    );
}

export function useStudentSidebar(): StudentSidebarContextValue {
    const ctx = useContext(StudentSidebarContext);
    if (!ctx) throw new Error('useStudentSidebar must be used within StudentSidebarProvider');
    return ctx;
}

export function StudentSidebar(props: StudentSidebarProps) {
    const pathname = usePathname();
    const { mobileOpen, setMobileOpen } = useStudentSidebar();

    return (
        <>
            <aside className="border-border sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 overflow-y-auto border-r bg-white lg:flex lg:flex-col xl:w-70">
                <SidebarInner {...props} pathname={pathname} />
            </aside>

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
