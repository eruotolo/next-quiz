'use client';

import { cn } from '@/lib/utils';
import {
    BarChart3,
    BookOpen,
    ClipboardList,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    Users,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/groups', label: 'Grupos', icon: Users },
    { href: '/admin/students', label: 'Alumnos', icon: GraduationCap },
    { href: '/admin/exams', label: 'Exámenes', icon: BookOpen },
    { href: '/admin/results', label: 'Resultados', icon: BarChart3 },
];

interface SidebarProps {
    userName?: string | null;
    userEmail?: string | null;
}

export function Sidebar({ userName, userEmail }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="border-default-100 fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white">
            {/* Logo */}
            <div className="border-default-100 flex items-center gap-3 border-b px-6 py-5">
                <div className="bg-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                    <ClipboardList size={18} className="text-white" />
                </div>
                <div>
                    <p className="text-default-900 leading-none font-bold">EduNext Quiz</p>
                    <p className="text-default-400 text-xs leading-snug">Panel administrativo</p>
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
                                        'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary text-white'
                                            : 'text-default-600 hover:bg-default-100 hover:text-default-900',
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
            <div className="border-default-100 space-y-1 border-t px-3 py-4">
                <div className="bg-default-50 rounded-xl px-4 py-3">
                    <p className="text-default-800 truncate text-sm font-semibold">
                        {userName ?? 'Admin'}
                    </p>
                    <p className="text-default-400 truncate text-xs">{userEmail}</p>
                </div>
                <button
                    type="button"
                    onClick={() => void signOut({ callbackUrl: '/admin/login' })}
                    className="text-danger-600 hover:bg-danger-50 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
                >
                    <LogOut size={18} className="shrink-0" />
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}
