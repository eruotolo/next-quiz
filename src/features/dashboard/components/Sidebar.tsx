'use client';

import { cn } from '@/shared/lib/utils';
import {
    Activity,
    BarChart3,
    BookOpen,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    Users,
} from 'lucide-react';
import { LogoMark } from '@/shared/components/branding/logo';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
    { path: '', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/groups', label: 'Grupos', icon: Users },
    { path: '/students', label: 'Alumnos', icon: GraduationCap },
    { path: '/exams', label: 'Exámenes', icon: BookOpen },
    { path: '/results', label: 'Resultados', icon: BarChart3 },
    { path: '/liveresults', label: 'En vivo', icon: Activity },
];

interface SidebarProps {
    slug: string;
    userName?: string | null;
    userEmail?: string | null;
}

export function Sidebar({ slug, userName, userEmail }: SidebarProps) {
    const pathname = usePathname();
    const base = `/${slug}`;

    return (
        <aside className="border-border fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white">
            {/* Logo */}
            <div className="border-border flex items-center gap-3 border-b px-6 py-5">
                <LogoMark size={36} className="shrink-0 shadow-sm" />
                <div>
                    <p className="text-foreground text-[15px] leading-none font-bold">
                        EduNext Quiz
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs leading-none">
                        Panel administrativo
                    </p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-1">
                    {NAV_ITEMS.map(({ path, label, icon: Icon, exact }) => {
                        const href = `${base}${path}`;
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
            <div className="border-border space-y-1 border-t px-3 py-4">
                <div className="bg-muted/50 rounded-xl px-4 py-3">
                    <p className="text-foreground truncate text-sm font-bold">
                        {userName ?? 'Admin'}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">{userEmail}</p>
                </div>
                <button
                    type="button"
                    onClick={() => void signOut({ callbackUrl: '/login' })}
                    className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
                >
                    <LogOut size={18} className="shrink-0" />
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}
