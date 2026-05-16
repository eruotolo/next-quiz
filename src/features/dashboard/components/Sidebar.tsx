'use client';

import type * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/lib/utils';
import {
    Activity,
    BarChart3,
    BookOpen,
    Building2,
    ChevronDown,
    Globe,
    GraduationCap,
    Home,
    LogOut,
    ScrollText,
    Search,
    Settings,
    UserCog,
    Users,
} from 'lucide-react';
import { LogoMark } from '@/shared/components/branding/logo';
import { Avatar } from '@/shared/components/ui/avatar';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Command } from 'cmdk';

// ── Nav items ─────────────────────────────────────────────────────────────
interface NavItem {
    path: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    exact?: boolean;
    live?: boolean;
    countKey?: keyof SidebarCounts;
}

const ADMIN_NAV: NavItem[] = [
    { path: '', label: 'Inicio', icon: Home, exact: true },
    { path: '/students', label: 'Estudiantes', icon: GraduationCap, countKey: 'students' },
    { path: '/groups', label: 'Grupos', icon: Users, countKey: 'groups' },
    { path: '/exams', label: 'Exámenes', icon: BookOpen, countKey: 'exams' },
    { path: '/results', label: 'Resultados', icon: BarChart3 },
    { path: '/liveresults', label: 'En vivo', icon: Activity, live: true },
    { path: '/settings', label: 'Ajustes', icon: Settings },
];

const SUPER_NAV: NavItem[] = [
    { path: '/config', label: 'Panel', icon: Home, exact: true },
    { path: '/config/institutions', label: 'Instituciones', icon: Building2, countKey: 'institutions' },
    { path: '/config/admins', label: 'Administradores', icon: UserCog, countKey: 'admins' },
    { path: '/config/students', label: 'Alumnos', icon: GraduationCap, countKey: 'students' },
    { path: '/config/auditoria', label: 'Auditoría', icon: ScrollText },
    { path: '/config/settings', label: 'Sistema', icon: Settings },
];

// ── ⌘K Command Palette ────────────────────────────────────────────────────
function CommandPalette({ open, onOpenChange, slug }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    slug?: string;
}): React.JSX.Element {
    const router = useRouter();
    const base = slug ? `/${slug}` : '';

    const ROUTES = slug
        ? ADMIN_NAV.map((item) => ({ label: item.label, path: `${base}${item.path}` }))
        : SUPER_NAV.map((item) => ({ label: item.label, path: item.path }));

    function run(path: string): void {
        router.push(path);
        onOpenChange(false);
    }

    return (
        <div
            className={cn(
                'fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] transition-all',
                open ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none',
            )}
        >
            {/* Overlay */}
            <button
                type="button"
                aria-label="Cerrar buscador"
                className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />

            {/* Dialog */}
            <div className="relative z-10 w-full max-w-[520px] rounded-[22px] border border-border bg-white shadow-2xl overflow-hidden">
                <Command className="[&_[cmdk-input-wrapper]]:border-0">
                    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                        <Search className="size-4 shrink-0 text-mute" />
                        <Command.Input
                            placeholder="Buscar páginas, alumnos, exámenes…"
                            className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-mute outline-none"
                            autoFocus
                        />
                        <kbd className="inline-flex items-center rounded-[4px] border border-border bg-paper-warm px-1.5 font-mono text-[10px] text-mute">
                            ESC
                        </kbd>
                    </div>

                    <Command.List className="max-h-[320px] overflow-y-auto p-2">
                        <Command.Empty className="py-8 text-center font-mono text-[12px] text-mute">
                            Sin resultados
                        </Command.Empty>

                        <Command.Group
                            heading={
                                <span className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-mute">
                                    Navegación
                                </span>
                            }
                        >
                            {ROUTES.map((item) => (
                                <Command.Item
                                    key={item.path}
                                    value={item.label}
                                    onSelect={() => run(item.path)}
                                    className="flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5 text-[13px] text-ink aria-selected:bg-primary-wash aria-selected:text-primary"
                                >
                                    {item.label}
                                </Command.Item>
                            ))}
                        </Command.Group>
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
export interface SidebarCounts {
    students?: number;
    groups?: number;
    exams?: number;
    institutions?: number;
    admins?: number;
}

export interface InstitutionOption {
    name: string;
    slug: string;
}

interface SidebarProps {
    slug?: string;
    isSuper?: boolean;
    userName?: string | null;
    userEmail?: string | null;
    userRole?: string | null;
    counts?: SidebarCounts;
    institutionList?: InstitutionOption[];
}

export function Sidebar({
    slug,
    isSuper = false,
    userName,
    userEmail: _userEmail,
    userRole,
    counts,
    institutionList,
}: SidebarProps): React.JSX.Element {
    const pathname = usePathname();
    const router = useRouter();
    const [cmdOpen, setCmdOpen] = useState(false);
    const [switcherOpen, setSwitcherOpen] = useState(false);
    const switcherRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent): void {
            if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
                setSwitcherOpen(false);
            }
        }
        if (switcherOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [switcherOpen]);

    const canSwitch = institutionList && institutionList.length > 0;

    const base = slug ? `/${slug}` : '';
    const navItems = isSuper ? SUPER_NAV : ADMIN_NAV;
    const orgLabel = isSuper
        ? 'Aulika · Plataforma'
        : (slug ?? '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const orgSub = isSuper ? '/config' : `/${slug ?? ''}`;

    // ⌘K global hotkey
    useEffect(() => {
        function handler(e: KeyboardEvent): void {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCmdOpen((prev) => !prev);
            }
            if (e.key === 'Escape') {
                setCmdOpen(false);
            }
        }
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    return (
        <>
            <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} slug={isSuper ? undefined : slug} />

            <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-white">
                {/* Org switcher */}
                <div className="border-b border-border p-4">
                    <div ref={switcherRef} className="relative">
                        <div className="flex items-center gap-2.5 rounded-[10px] border border-border bg-paper-warm p-2 shadow-sm">
                            <Link href="/" className="shrink-0 transition-opacity hover:opacity-70">
                                <LogoMark size={32} radius={8} className="shadow-sm" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => canSwitch && setSwitcherOpen((v) => !v)}
                                className={cn(
                                    'flex min-w-0 flex-1 items-center gap-1.5 transition-colors',
                                    canSwitch && 'cursor-pointer',
                                )}
                            >
                                <div className="min-w-0 flex-1 text-left">
                                    <p className="truncate text-[12.5px] font-bold leading-tight text-ink">
                                        {orgLabel}
                                    </p>
                                    <p className="font-mono text-[10px] leading-none text-mute">
                                        {orgSub}
                                    </p>
                                </div>
                                <ChevronDown
                                    size={14}
                                    className={cn(
                                        'shrink-0 text-mute transition-transform duration-200',
                                        switcherOpen && 'rotate-180',
                                    )}
                                />
                            </button>
                        </div>

                        {switcherOpen && canSwitch && (
                            <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-[10px] border border-border bg-white shadow-lg">
                                {!isSuper && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => { router.push('/config'); setSwitcherOpen(false); }}
                                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[12.5px] font-medium text-ink-dim transition-colors hover:bg-primary-wash hover:text-primary"
                                        >
                                            <Settings size={14} className="shrink-0" />
                                            Panel de Configuración
                                        </button>
                                        <div className="border-t border-border" />
                                    </>
                                )}
                                <div className="max-h-[220px] overflow-y-auto py-1">
                                    {institutionList.map((inst) => (
                                        <button
                                            key={inst.slug}
                                            type="button"
                                            onClick={() => { router.push(`/${inst.slug}`); setSwitcherOpen(false); }}
                                            className={cn(
                                                'flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] transition-colors',
                                                inst.slug === slug
                                                    ? 'bg-primary-wash font-semibold text-primary'
                                                    : 'text-ink-dim hover:bg-paper-warm hover:text-ink',
                                            )}
                                        >
                                            <span className="flex-1 truncate">{inst.name}</span>
                                            {inst.slug === slug && (
                                                <span className="font-mono text-[10px] text-primary">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ⌘K Search */}
                    <button
                        type="button"
                        onClick={() => setCmdOpen(true)}
                        className="mt-3 flex w-full items-center gap-2 rounded-[8px] bg-paper-warm px-2.5 py-1.5 text-left transition-colors hover:bg-border"
                    >
                        <Search className="size-3.5 shrink-0 text-mute" />
                        <span className="flex-1 font-sans text-[12px] text-mute">Buscar…</span>
                        <kbd className="inline-flex items-center rounded-[4px] border border-border bg-white px-1.5 font-mono text-[9px] text-mute">
                            ⌘K
                        </kbd>
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-3 py-2">
                    <ul className="space-y-0.5">
                        {navItems.map(({ path, label, icon: Icon, exact, live, countKey }) => {
                            const href = isSuper ? path : `${base}${path}`;
                            const isActive = exact ? pathname === href : pathname.startsWith(href);
                            const badge = countKey != null ? counts?.[countKey] : undefined;
                            return (
                                <li key={href}>
                                    <Link
                                        href={href}
                                        className={cn(
                                            'group flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13px] font-medium transition-colors',
                                            isActive
                                                ? 'bg-primary-wash text-primary font-bold'
                                                : 'text-ink-dim hover:bg-paper-warm hover:text-ink',
                                        )}
                                    >
                                        <Icon
                                            size={18}
                                            className={cn(
                                                'shrink-0',
                                                isActive ? 'text-primary' : 'text-mute group-hover:text-ink-dim',
                                            )}
                                        />
                                        <span className="flex-1">{label}</span>
                                        {badge != null && (
                                            <span className={cn(
                                                "font-mono text-[10px] font-bold",
                                                isActive ? "text-primary" : "text-mute"
                                            )}>
                                                {badge}
                                            </span>
                                        )}
                                        {live && (
                                            <span className="relative flex size-2">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-75" />
                                                <span className="relative inline-flex size-2 rounded-full bg-coral shadow-[0_0_0_3px_rgba(255,90,77,0.2)]" />
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User block */}
                <div className="border-t border-border p-3">
                    <div className="flex items-center gap-2.5 rounded-[12px] px-2 py-2">
                        <Avatar
                            name={userName ?? 'Admin'}
                            size={34}
                            className="shrink-0 ring-1 ring-border shadow-sm"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-bold leading-tight text-ink">
                                {userName ?? 'Mariela Saavedra'}
                            </p>
                            <p className="truncate font-sans text-[10.5px] leading-none text-mute">
                                {userRole ?? 'Jefa UTP · Profesora'}
                            </p>
                        </div>
                        <Link
                            href="/"
                            title="Ir al sitio web"
                            className="flex shrink-0 items-center justify-center text-mute transition-colors hover:text-ink"
                        >
                            <Globe size={16} />
                        </Link>
                        <button
                            type="button"
                            onClick={() => void signOut({ callbackUrl: '/login' })}
                            className="text-mute hover:text-destructive flex shrink-0 items-center justify-center transition-colors"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
