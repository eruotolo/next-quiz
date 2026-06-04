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
    CreditCard,
    Globe,
    HelpCircle,
    GraduationCap,
    Home,
    Layers,
    LogOut,
    Receipt,
    ScrollText,
    Search,
    Settings,
    Sparkles,
    UserCog,
    Users,
    Wallet,
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
    { path: '/groups', label: 'Grupos', icon: Users, countKey: 'groups' },
    { path: '/students', label: 'Estudiantes', icon: GraduationCap, countKey: 'students' },
    { path: '/professors', label: 'Profesores', icon: UserCog },
    { path: '/exams', label: 'Exámenes', icon: BookOpen, countKey: 'exams' },
    { path: '/results', label: 'Resultados', icon: BarChart3 },
    { path: '/liveresults', label: 'En vivo', icon: Activity, live: true },
    { path: '/settings', label: 'Ajustes', icon: Settings },
    { path: '/ayuda', label: 'Ayuda', icon: HelpCircle },
];

const SUPER_NAV: NavItem[] = [
    { path: '/config', label: 'Panel', icon: Home, exact: true },
    {
        path: '/config/institutions',
        label: 'Instituciones',
        icon: Building2,
        countKey: 'institutions',
    },
    { path: '/config/students', label: 'Alumnos', icon: GraduationCap, countKey: 'students' },
    { path: '/config/admins', label: 'Administradores', icon: UserCog, countKey: 'admins' },
    { path: '/config/plan-limits', label: 'Planes', icon: Layers },
    { path: '/config/subscriptions', label: 'Suscripciones', icon: Receipt },
    { path: '/config/billing', label: 'Facturación', icon: CreditCard },
    { path: '/config/payments', label: 'Pagos', icon: Wallet },
    { path: '/config/auditoria', label: 'Auditoría', icon: ScrollText },
    { path: '/config/settings', label: 'Sistema', icon: Settings },
];

// ── ⌘K Command Palette ────────────────────────────────────────────────────
function CommandPalette({
    open,
    onOpenChange,
    slug,
}: {
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
                open ? 'visible opacity-100' : 'pointer-events-none invisible opacity-0',
            )}
        >
            {/* Overlay */}
            <button
                type="button"
                aria-label="Cerrar buscador"
                className="bg-ink/30 absolute inset-0 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />

            {/* Dialog */}
            <div className="border-border relative z-10 w-full max-w-[520px] overflow-hidden rounded-[22px] border bg-white shadow-2xl">
                <Command className="[&_[cmdk-input-wrapper]]:border-0">
                    <div className="border-border flex items-center gap-3 border-b px-4 py-3">
                        <Search className="text-mute size-4 shrink-0" />
                        <Command.Input
                            placeholder="Buscar páginas, alumnos, exámenes…"
                            className="text-ink placeholder:text-mute flex-1 bg-transparent text-[14px] outline-none"
                            autoFocus
                        />
                        <kbd className="border-border bg-paper-warm text-mute inline-flex items-center rounded-[4px] border px-1.5 font-mono text-[10px]">
                            ESC
                        </kbd>
                    </div>

                    <Command.List className="max-h-[320px] overflow-y-auto p-2">
                        <Command.Empty className="text-mute py-8 text-center font-mono text-[12px]">
                            Sin resultados
                        </Command.Empty>

                        <Command.Group
                            heading={
                                <span className="text-mute px-2 py-1 font-mono text-[10px] tracking-[0.08em] uppercase">
                                    Navegación
                                </span>
                            }
                        >
                            {ROUTES.map((item) => (
                                <Command.Item
                                    key={item.path}
                                    value={item.label}
                                    onSelect={() => run(item.path)}
                                    className="text-ink aria-selected:bg-primary-wash aria-selected:text-primary flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5 text-[13px]"
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
    showPlanPromo?: boolean;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: sidebar con switcher de institución, command palette, nav por rol y banner promo en un solo componente
export function Sidebar({
    slug,
    isSuper = false,
    userName,
    userEmail: _userEmail,
    userRole,
    counts,
    institutionList,
    showPlanPromo = false,
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
            <CommandPalette
                open={cmdOpen}
                onOpenChange={setCmdOpen}
                slug={isSuper ? undefined : slug}
            />

            <aside className="border-border fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r bg-white">
                {/* Org switcher */}
                <div className="border-border border-b p-4">
                    <div ref={switcherRef} className="relative">
                        <div className="border-border bg-paper-warm flex items-center gap-2.5 rounded-[10px] border p-2 shadow-sm">
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
                                    <p className="text-ink truncate text-[12.5px] leading-tight font-bold">
                                        {orgLabel}
                                    </p>
                                    <p className="text-mute font-mono text-[10px] leading-none">
                                        {orgSub}
                                    </p>
                                </div>
                                <ChevronDown
                                    size={14}
                                    className={cn(
                                        'text-mute shrink-0 transition-transform duration-200',
                                        switcherOpen && 'rotate-180',
                                    )}
                                />
                            </button>
                        </div>

                        {switcherOpen && canSwitch && (
                            <div className="border-border absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-[10px] border bg-white shadow-lg">
                                {!isSuper && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                router.push('/config');
                                                setSwitcherOpen(false);
                                            }}
                                            className="text-ink-dim hover:bg-primary-wash hover:text-primary flex w-full items-center gap-2 px-3 py-2.5 text-left text-[12.5px] font-medium transition-colors"
                                        >
                                            <Settings size={14} className="shrink-0" />
                                            Panel de Configuración
                                        </button>
                                        <div className="border-border border-t" />
                                    </>
                                )}
                                <div className="max-h-[220px] overflow-y-auto py-1">
                                    {institutionList.map((inst) => (
                                        <button
                                            key={inst.slug}
                                            type="button"
                                            onClick={() => {
                                                router.push(`/${inst.slug}`);
                                                setSwitcherOpen(false);
                                            }}
                                            className={cn(
                                                'flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] transition-colors',
                                                inst.slug === slug
                                                    ? 'bg-primary-wash text-primary font-semibold'
                                                    : 'text-ink-dim hover:bg-paper-warm hover:text-ink',
                                            )}
                                        >
                                            <span className="flex-1 truncate">{inst.name}</span>
                                            {inst.slug === slug && (
                                                <span className="text-primary font-mono text-[10px]">
                                                    ✓
                                                </span>
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
                        className="bg-paper-warm hover:bg-border mt-3 flex w-full items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-left transition-colors"
                    >
                        <Search className="text-mute size-3.5 shrink-0" />
                        <span className="text-mute flex-1 font-sans text-[12px]">Buscar…</span>
                        <kbd className="border-border text-mute inline-flex items-center rounded-[4px] border bg-white px-1.5 font-mono text-[9px]">
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
                                                isActive
                                                    ? 'text-primary'
                                                    : 'text-mute group-hover:text-ink-dim',
                                            )}
                                        />
                                        <span className="flex-1">{label}</span>
                                        {badge != null && (
                                            <span
                                                className={cn(
                                                    'font-mono text-[10px] font-bold',
                                                    isActive ? 'text-primary' : 'text-mute',
                                                )}
                                            >
                                                {badge}
                                            </span>
                                        )}
                                        {live && (
                                            <span className="relative flex size-2">
                                                <span className="bg-coral absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                                                <span className="bg-coral relative inline-flex size-2 rounded-full shadow-[0_0_0_3px_rgba(255,90,77,0.2)]" />
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Banner promocional de upgrade (Free/Docente) */}
                {showPlanPromo && slug && (
                    <div className="border-border border-t p-3">
                        <div
                            className="relative overflow-hidden rounded-[12px] p-4 text-white"
                            style={{
                                background:
                                    'radial-gradient(ellipse at 80% 0%, rgba(214,255,31,0.25) 0%, transparent 55%), #1f2eff',
                            }}
                        >
                            <p className="text-[12.5px] leading-tight font-bold">
                                Potenciá tu institución
                            </p>
                            <p className="mt-1 text-[11px] leading-snug text-white/70">
                                Más aulas, estudiantes y exámenes con un plan superior.
                            </p>
                            <Link
                                href={`/${slug}/upgrade`}
                                className="bg-lime text-ink mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold transition-opacity hover:opacity-90"
                            >
                                <Sparkles size={13} />
                                Mejorar plan
                            </Link>
                        </div>
                    </div>
                )}

                {/* User block */}
                <div className="border-border border-t p-3">
                    <div className="flex items-center gap-2.5 rounded-[12px] px-2 py-2">
                        <Link
                            href="/perfil"
                            className="hover:bg-paper-warm flex min-w-0 flex-1 items-center gap-2.5 rounded-[8px] transition-colors"
                        >
                            <Avatar
                                name={userName ?? 'Admin'}
                                size={34}
                                className="ring-border shrink-0 shadow-sm ring-1"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="text-ink truncate text-[12.5px] leading-tight font-bold">
                                    {userName ?? 'Admin'}
                                </p>
                                <p className="text-mute truncate font-sans text-[10.5px] leading-none">
                                    {userRole ?? ''}
                                </p>
                            </div>
                        </Link>
                        <Link
                            href="/"
                            title="Ir al sitio web"
                            className="text-mute hover:text-ink flex shrink-0 items-center justify-center transition-colors"
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
