'use client';

import { cn } from '@/lib/utils';
import {
    Activity,
    BarChart3,
    BookOpen,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    Users,
} from 'lucide-react';
import { LogoMark } from '@/components/ui/logo';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/groups', label: 'Grupos', icon: Users },
    { href: '/admin/students', label: 'Alumnos', icon: GraduationCap },
    { href: '/admin/exams', label: 'Exámenes', icon: BookOpen },
    { href: '/admin/results', label: 'Resultados', icon: BarChart3 },
    { href: '/admin/liveresults', label: 'En vivo', icon: Activity },
];

interface SidebarProps {
    userName?: string | null;
    userEmail?: string | null;
}

export function Sidebar({ userName, userEmail }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-white">
            {/* Logo */}
            <div className="flex items-center gap-3 border-b border-border px-6 py-5">
                <LogoMark size={36} className="shrink-0 shadow-sm" />
                <div>
                    <p className="text-[15px] font-bold leading-none text-foreground">
                        EduNext Quiz
                    </p>
                    <p className="mt-1 text-xs leading-none text-muted-foreground">
                        Panel administrativo
                    </p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-1">
                    {navItems.map(({ href, label, icon: Icon, exact }) => {
                        const isActive = exact ? pathname === href : pathname.startsWith(href);
                        return (
                            <li key={href}>
                                <Link
                                    href={href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
                                        isActive
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    <Icon size={18} className="shrink-0" />
                                    {label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User + Logout */}
            <div className="space-y-1 border-t border-border px-3 py-4">
                <div className="rounded-xl bg-muted/50 px-4 py-3">
                    <p className="truncate text-sm font-bold text-foreground">
                        {userName ?? 'Admin'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                </div>
                <button
                    type="button"
                    onClick={() => void signOut({ callbackUrl: '/admin/login' })}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                >
                    <LogOut size={18} className="shrink-0" />
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}
