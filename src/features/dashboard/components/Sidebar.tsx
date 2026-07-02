'use client';

import type { ComponentType, CSSProperties } from 'react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { cn } from '@/shared/lib/utils';
import {
    Activity,
    BarChart3,
    BookMarked,
    BookOpen,
    Building2,
    CalendarDays,
    CalendarRange,
    ChevronDown,
    ClipboardList,
    CreditCard,
    FolderKanban,
    Globe,
    GraduationCap,
    HelpCircle,
    Home,
    Layers,
    Library,
    LogOut,
    Menu,
    MonitorPlay,
    Receipt,
    ScrollText,
    Search,
    Settings,
    Sparkles,
    UserCog,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/shared/components/ui/sheet';
import { LogoMark } from '@/shared/components/branding/logo';
import { Avatar } from '@/shared/components/ui/avatar';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { USER_ROLE } from '@/shared/lib/roles';
import { searchGlobal, type SearchResult } from '@/shared/lib/search';
import { academicLabel } from '@/shared/lib/academic-labels';
import type { InstitutionType } from '@/shared/lib/academic-labels';
import { isItemActiveInGroup } from '@/features/dashboard/lib/nav-active';

// ── Nav items ─────────────────────────────────────────────────────────────
type NavSection = 'principal' | 'academic' | 'sistema';

interface NavItem {
    path: string;
    label: string;
    /** Icono opcional: los hijos dentro de un NavGroup suelen no llevarlo
     *  porque el icono del padre ya marca la sección. */
    icon?: ComponentType<{ size?: number; className?: string }>;
    exact?: boolean;
    live?: boolean;
    countKey?: keyof SidebarCounts;
    /** Sección de agrupación visual. Por defecto 'principal' (sin heading). */
    section?: NavSection;
}

export type { NavItem };

interface NavGroup {
    id: string;
    label: string;
    icon: ComponentType<{ size?: number; className?: string }>;
    /** Si true, el grupo solo se muestra cuando la institución tiene lmsEnabled. */
    requiresLms?: boolean;
    /** Sección de agrupación visual. Por defecto 'principal'. */
    section?: NavSection;
    children: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
    return 'children' in entry;
}

/** Etiquetas legibles de cada sección del menú. */
const SECTION_LABELS: Record<NavSection, string> = {
    principal: 'General',
    academic: 'Académico',
    sistema: 'Sistema',
};

const NAV_SECTION_ORDER: NavSection[] = ['principal', 'academic', 'sistema'];

const ADMIN_NAV: NavEntry[] = [
    { path: '', label: 'Inicio', icon: Home, exact: true },
    { path: '/groups', label: 'Grupos', icon: Users, countKey: 'groups' },
    { path: '/students', label: 'Estudiantes', icon: GraduationCap, countKey: 'students' },
    { path: '/professors', label: 'Profesores', icon: UserCog },
    { path: '/exams', label: 'Exámenes', icon: BookOpen, countKey: 'exams' },
    { path: '/questions', label: 'Banco', icon: Library },
    { path: '/results', label: 'Resultados', icon: BarChart3 },
    { path: '/liveresults', label: 'En vivo', icon: Activity, live: true },
    {
        id: 'lms',
        label: 'Aula Virtual',
        icon: MonitorPlay,
        requiresLms: true,
        children: [
            { path: '/aula', label: 'Aula' },
            { path: '/aula/categorias', label: 'Categoría' },
        ],
    },
    { path: '/programs', label: 'Programas', icon: Layers, section: 'academic' },
    { path: '/periods', label: 'Períodos', icon: CalendarRange, section: 'academic' },
    { path: '/courses', label: 'Materias', icon: BookMarked, section: 'academic' },
    { path: '/settings', label: 'Ajustes', icon: Settings, section: 'sistema' },
    { path: '/ayuda', label: 'Ayuda', icon: HelpCircle, section: 'sistema' },
];

// Menú reducido del Profesor: sus materias, exámenes, resultados y seguimiento
// en vivo. Los profesores no gestionan programas, períodos, grupos ni ajustes.
const PROFESOR_NAV: NavEntry[] = [
    { path: '/courses', label: 'Mis Materias', icon: BookMarked },
    { path: '/exams', label: 'Exámenes', icon: BookOpen },
    { path: '/results', label: 'Resultados', icon: BarChart3 },
    { path: '/liveresults', label: 'En vivo', icon: Activity, live: true },
    {
        id: 'lms',
        label: 'Aula Virtual',
        icon: MonitorPlay,
        requiresLms: true,
        children: [{ path: '/aula', label: 'Aula' }],
    },
    { path: '/ayuda', label: 'Ayuda', icon: HelpCircle, section: 'sistema' },
];

const SUPER_NAV: NavEntry[] = [
    { path: '/config', label: 'Panel', icon: Home, exact: true },
    {
        path: '/config/institutions',
        label: 'Instituciones',
        icon: Building2,
        countKey: 'institutions',
    },
    { path: '/config/students', label: 'Alumnos', icon: GraduationCap, countKey: 'students' },
    { path: '/config/admins', label: 'Administradores', icon: UserCog, countKey: 'admins' },
    { path: '/config/programs', label: 'Programas', icon: FolderKanban, section: 'academic' },
    { path: '/config/periods', label: 'Períodos', icon: CalendarDays, section: 'academic' },
    { path: '/config/groups', label: 'Grupos', icon: Users, section: 'academic' },
    { path: '/config/exams', label: 'Exámenes', icon: ClipboardList, section: 'academic' },
    { path: '/config/plan-limits', label: 'Planes', icon: Layers, section: 'sistema' },
    { path: '/config/subscriptions', label: 'Suscripciones', icon: Receipt, section: 'sistema' },
    { path: '/config/billing', label: 'Facturación', icon: CreditCard, section: 'sistema' },
    { path: '/config/payments', label: 'Pagos', icon: Wallet, section: 'sistema' },
    { path: '/config/auditoria', label: 'Auditoría', icon: ScrollText, section: 'sistema' },
    { path: '/config/settings', label: 'Sistema', icon: Settings, section: 'sistema' },
];

// ── ⌘K Command Palette ────────────────────────────────────────────────────
function CommandPalette({
    open,
    onOpenChange,
    slug,
    items,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    slug?: string;
    items: NavEntry[];
}) {
    const router = useRouter();
    const base = slug ? `/${slug}` : '';

    // Aplana grupos e items para el buscador ⌘K: los hijos se listan como
    // "Aula Virtual → Clases en vivo" para mantener la jerarquía visible.
    const ROUTES: { label: string; path: string }[] = items.flatMap((entry) =>
        isGroup(entry)
            ? entry.children.map((child) => ({
                  label: `${entry.label} → ${child.label}`,
                  path: slug ? `${base}${child.path}` : child.path,
              }))
            : [
                  {
                      label: entry.label,
                      path: slug ? `${base}${entry.path}` : entry.path,
                  },
              ],
    );

    function run(path: string): void {
        router.push(path);
        onOpenChange(false);
    }

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, startSearchTransition] = useTransition();

    useEffect(() => {
        if (!slug) {
            setResults([]);
            return;
        }
        const q = query.trim();
        if (q.length < 2) {
            setResults([]);
            return;
        }
        const t = setTimeout(() => {
            startSearchTransition(async () => {
                const res = await searchGlobal(q, slug);
                setResults(res.data);
            });
        }, 250);
        return () => clearTimeout(t);
    }, [query, slug]);

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
                            value={query}
                            onValueChange={setQuery}
                            placeholder={
                                slug ? 'Buscar páginas, alumnos, exámenes…' : 'Buscar páginas…'
                            }
                            className="text-ink placeholder:text-mute flex-1 bg-transparent text-[14px] outline-none"
                            autoFocus
                        />
                        <kbd className="border-border bg-paper-warm text-mute inline-flex items-center rounded-[4px] border px-1.5 font-mono text-[10px]">
                            ESC
                        </kbd>
                    </div>

                    <Command.List className="max-h-[320px] overflow-y-auto p-2">
                        <Command.Empty className="text-mute py-8 text-center font-mono text-[12px]">
                            {isSearching ? 'Buscando…' : 'Sin resultados'}
                        </Command.Empty>

                        {slug && query.trim().length >= 2 ? (
                            results.length > 0 && (
                                <Command.Group
                                    heading={
                                        <span className="text-mute px-2 py-1 font-mono text-[10px] tracking-[0.08em] uppercase">
                                            Resultados
                                        </span>
                                    }
                                >
                                    {results.map((r) => (
                                        <Command.Item
                                            key={`${r.type}-${r.id}`}
                                            value={`${r.label} ${r.sub ?? ''}`}
                                            onSelect={() => run(r.href)}
                                            className="text-ink aria-selected:bg-primary-wash aria-selected:text-primary flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5 text-[13px]"
                                        >
                                            {r.type === 'student' ? (
                                                <GraduationCap className="text-mute size-4 shrink-0" />
                                            ) : (
                                                <BookOpen className="text-mute size-4 shrink-0" />
                                            )}
                                            <span className="flex-1 truncate">{r.label}</span>
                                            {r.sub && (
                                                <span className="text-mute shrink-0 text-[11px]">
                                                    {r.sub}
                                                </span>
                                            )}
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                            )
                        ) : (
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
                        )}
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}

// Acordeón: renderiza un NavGroup como header desplegable con sus hijos
// indentados debajo. El padre se ilumina cuando algún hijo está activo y
// arranca auto-abierto si el pathname actual matchea un hijo.
function NavGroupRow({
    group,
    base,
    pathname,
    counts,
    open,
    onToggle,
}: {
    group: NavGroup;
    base: string;
    pathname: string;
    counts?: SidebarCounts;
    open: boolean;
    onToggle: () => void;
}) {
    const hasActiveChild = group.children.some((child) => {
        const href = base ? `${base}${child.path}` : child.path;
        return child.exact ? pathname === href : pathname.startsWith(href);
    });
    return (
        <li>
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                className={cn(
                    'group flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13px] font-medium transition-colors',
                    hasActiveChild
                        ? 'bg-primary-wash text-primary font-bold'
                        : 'text-ink-dim hover:bg-paper-warm hover:text-ink',
                )}
            >
                <group.icon
                    size={18}
                    className={cn(
                        'shrink-0',
                        hasActiveChild
                            ? 'text-primary'
                            : 'text-mute group-hover:text-ink-dim',
                    )}
                />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown
                    size={14}
                    className={cn(
                        'text-mute shrink-0 transition-transform duration-200',
                        open && 'rotate-180',
                    )}
                />
            </button>
            <div
                className={cn(
                    'grid transition-all duration-200 ease-out',
                    open
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0',
                )}
                aria-hidden={!open}
            >
                <div className="overflow-hidden">
                    <ul className="mt-0.5 ml-4 space-y-0.5 border-l border-border pl-2">
                        {group.children.map((child) => (
                            <NavItemRow
                                key={child.path}
                                item={child}
                                base={base}
                                pathname={pathname}
                                counts={counts}
                                siblings={group.children}
                            />
                        ))}
                    </ul>
                </div>
            </div>
        </li>
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

    userRole?: string | null;
    counts?: SidebarCounts;
    institutionList?: InstitutionOption[];
    showPlanPromo?: boolean;
    /** Programas que coordina el usuario (Jefe de Carrera). Solo relevante para
     *  Profesores: habilita el indicador de coordinación en la UI y, cuando exista
     *  la ruta `/programs`, el acceso a su programa. */
    coordinatedProgramIds?: string[];
    /** Tipo de institución: determina las etiquetas de la sección Académico
     *  (Programas → Carreras/Niveles/Especialidades; Materias → Ramos/Asignaturas). */
    institutionType?: InstitutionType;
    /** Habilitación de LMS (Aula Virtual) para la institución del usuario. */
    lmsEnabled?: boolean;
}

// Fila de navegación: estado activo, badge de contador y punto "en vivo".
function NavItemRow({
    item,
    base,
    pathname,
    counts,
    siblings,
}: {
    item: NavItem;
    base: string;
    pathname: string;
    counts?: SidebarCounts;
    /** Otros items al mismo nivel. Si se pasan, se aplica detección activa
     *  con awareness de hermanos (evita doble highlight dentro de un grupo). */
    siblings?: NavItem[];
}) {
    const { path, label, icon: Icon, exact, live, countKey } = item;
    const href = base ? `${base}${path}` : path;
    const isActive = siblings
        ? isItemActiveInGroup(item, siblings, pathname, base)
        : exact
          ? pathname === href
          : pathname.startsWith(href);
    const badge = countKey != null ? counts?.[countKey] : undefined;
    return (
        <li>
            <Link
                href={href}
                className={cn(
                    'group flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13px] font-medium transition-colors',
                    isActive
                        ? 'bg-primary-wash text-primary font-bold'
                        : 'text-ink-dim hover:bg-paper-warm hover:text-ink',
                )}
            >
                {Icon ? (
                    <Icon
                        size={18}
                        className={cn(
                            'shrink-0',
                            isActive ? 'text-primary' : 'text-mute group-hover:text-ink-dim',
                        )}
                    />
                ) : (
                    <span className="size-[18px] shrink-0" aria-hidden="true" />
                )}
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
}

export function Sidebar({
    slug,
    isSuper = false,
    userName,
    userRole,
    counts,
    institutionList,
    showPlanPromo = false,
    coordinatedProgramIds,
    institutionType,
    lmsEnabled = false,
}: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [cmdOpen, setCmdOpen] = useState(false);
    const [switcherOpen, setSwitcherOpen] = useState(false);
    const [switcherQuery, setSwitcherQuery] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);
    const switcherRef = useRef<HTMLDivElement>(null);
    const switcherSearchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent): void {
            if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
                setSwitcherOpen(false);
            }
        }
        if (switcherOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [switcherOpen]);

    useEffect(() => {
        if (switcherOpen) {
            setSwitcherQuery('');
            setTimeout(() => switcherSearchRef.current?.focus(), 10);
        }
    }, [switcherOpen]);

    const filteredInstitutions = switcherQuery.trim()
        ? (institutionList ?? []).filter((inst) =>
              inst.name.toLowerCase().includes(switcherQuery.toLowerCase()),
          )
        : (institutionList ?? []);

    const canSwitch = institutionList && institutionList.length > 0;

    const base = slug ? `/${slug}` : '';
    // Bifurcación por rol (D8/Fase 5): Admin ve todo; Profesor ve menú reducido.
    // El Jefe de Carrera (isCoordinator) hoy comparte el menú del Profesor: la
    // distinción operativa vive en el scoping de las Server Actions. Queda el
    // flag disponible para sumar el acceso a su programa cuando exista /programs.
    const isProfesor = !isSuper && userRole === USER_ROLE.PROFESOR;
    const isCoordinator = isProfesor && (coordinatedProgramIds?.length ?? 0) > 0;
    const labels = academicLabel(institutionType ?? 'OTRO');
    const adminNav: NavEntry[] = ADMIN_NAV.map((entry) => {
        if (isGroup(entry)) return entry;
        if (entry.path === '/programs') return { ...entry, label: labels.programPlural };
        if (entry.path === '/periods') return { ...entry, label: labels.periodPlural };
        if (entry.path === '/courses') return { ...entry, label: labels.coursePlural };
        return entry;
    });
    const profesorBaseNav: NavEntry[] = PROFESOR_NAV.map((entry) => {
        if (isGroup(entry)) return entry;
        if (entry.path === '/courses') return { ...entry, label: `Mis ${labels.coursePlural}` };
        return entry;
    });
    const profesorNav: NavEntry[] = isCoordinator
        ? [{ path: '/programs', label: `Mi ${labels.program}`, icon: Layers }, ...profesorBaseNav]
        : profesorBaseNav;
    // Filtrar los grupos marcados con `requiresLms` cuando la institución no
    // tiene LMS activo. Aplica por igual a SuperAdmin, Admin y Profesor: la UI
    // no debe ofrecer lo que la página va a bloquear.
    const visibleLmsFilter = (entry: NavEntry): boolean => {
        if (isGroup(entry)) return !entry.requiresLms || lmsEnabled;
        return true;
    };
    const baseNav = isSuper ? SUPER_NAV : isProfesor ? profesorNav : adminNav;
    const navEntries = baseNav.filter(visibleLmsFilter);

    // Auto-abrir el acordeón del LMS si el usuario ya está navegando una ruta
    // hija (ej. entrar directo a /aula/categorias). Después lo maneja el usuario.
    const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        for (const entry of navEntries) {
            if (!isGroup(entry)) continue;
            const hasActive = entry.children.some((child) => {
                const href = base ? `${base}${child.path}` : child.path;
                return child.exact ? pathname === href : pathname.startsWith(href);
            });
            if (hasActive) initial.add(entry.id);
        }
        return initial;
    });
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

    // Close mobile sheet on route change — pathname in deps is intentional: triggers on navigation
    // biome-ignore lint/correctness/useExhaustiveDependencies: pathname triggers close, not read in body
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Inner content rendered in both desktop aside and mobile Sheet
    function SidebarInner({ onClose }: { onClose?: () => void }) {
        return (
            <>
                {/* Mobile header — full-screen drawer close button */}
                {onClose && (
                    <div className="border-border flex items-center justify-between border-b px-4 py-3 lg:hidden">
                        <span className="font-display text-ink text-[15px] font-bold tracking-tight">
                            Menú
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Cerrar menú"
                            className="bg-paper-warm hover:bg-border focus-visible:ring-ring flex size-9 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
                        >
                            <X size={18} className="text-ink-dim" />
                        </button>
                    </div>
                )}

                {/* Org switcher */}
                <div className="border-border border-b p-4 lg:flex lg:h-31.25 lg:flex-col lg:justify-center">
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
                            <div className="border-border absolute top-full right-0 left-0 z-50 mt-1 min-w-[280px] overflow-hidden rounded-[12px] border bg-white shadow-xl">
                                {/* Search */}
                                <div className="border-border relative border-b p-2">
                                    <Search
                                        size={13}
                                        className="text-mute pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
                                    />
                                    <input
                                        ref={switcherSearchRef}
                                        value={switcherQuery}
                                        onChange={(e) => setSwitcherQuery(e.target.value)}
                                        placeholder="Buscar institución..."
                                        className="placeholder:text-mute text-ink bg-paper w-full rounded-[8px] py-1.5 pr-3 pl-7 text-[12.5px] outline-none"
                                    />
                                </div>

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
                                <div className="max-h-[320px] overflow-y-auto py-1">
                                    {filteredInstitutions.length === 0 ? (
                                        <p className="text-mute px-3 py-5 text-center text-[12.5px]">
                                            Sin resultados
                                        </p>
                                    ) : (
                                        filteredInstitutions.map((inst) => (
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
                                        ))
                                    )}
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
                    {NAV_SECTION_ORDER.map((section) => {
                        const sectionEntries = navEntries.filter(
                            (e) => (e.section ?? 'principal') === section,
                        );
                        if (sectionEntries.length === 0) return null;
                        return (
                            <div key={section} className={section !== 'principal' ? 'mt-4' : ''}>
                                {section !== 'principal' && (
                                    <p className="text-mute px-3 pb-1 font-mono text-[10px] tracking-[0.08em] uppercase">
                                        {SECTION_LABELS[section]}
                                    </p>
                                )}
                                <ul className="space-y-0.5">
                                    {sectionEntries.map((entry) =>
                                        isGroup(entry) ? (
                                            <NavGroupRow
                                                key={entry.id}
                                                group={entry}
                                                base={base}
                                                pathname={pathname}
                                                counts={counts}
                                                open={openGroups.has(entry.id)}
                                                onToggle={() =>
                                                    setOpenGroups((prev) => {
                                                        const next = new Set(prev);
                                                        if (next.has(entry.id)) {
                                                            next.delete(entry.id);
                                                        } else {
                                                            next.add(entry.id);
                                                        }
                                                        return next;
                                                    })
                                                }
                                            />
                                        ) : (
                                            <NavItemRow
                                                key={entry.path || 'home'}
                                                item={entry}
                                                base={base}
                                                pathname={pathname}
                                                counts={counts}
                                            />
                                        ),
                                    )}
                                    {section === 'sistema' && !isSuper && slug && (
                                        <li>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    localStorage.removeItem('aulika-tour-seen-v1');
                                                    window.dispatchEvent(
                                                        new CustomEvent('aulika:start-tour'),
                                                    );
                                                }}
                                                className="group text-ink-dim hover:bg-paper-warm hover:text-ink flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13px] font-medium transition-colors"
                                            >
                                                <Sparkles
                                                    size={18}
                                                    className="text-mute group-hover:text-ink-dim shrink-0"
                                                />
                                                <span>Tour de bienvenida</span>
                                            </button>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        );
                    })}
                </nav>

                {/* Banner promocional de upgrade (Free/Docente) */}
                {showPlanPromo && slug && (
                    <div className="border-border border-t p-3">
                        <div
                            className="relative overflow-hidden rounded-[12px] p-4 text-white [background:var(--promo-bg)]"
                            style={
                                {
                                    '--promo-bg':
                                        'radial-gradient(ellipse at 80% 0%, rgba(214,255,31,0.25) 0%, transparent 55%), #1f2eff',
                                } as CSSProperties
                            }
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
                                    {userRole}
                                    {isCoordinator ? ' · Coordinador' : ''}
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
            </>
        );
    }

    return (
        <>
            <CommandPalette
                open={cmdOpen}
                onOpenChange={setCmdOpen}
                slug={isSuper ? undefined : slug}
                items={navEntries}
            />

            {/* Hamburger — mobile only */}
            <button
                type="button"
                aria-label="Abrir menú"
                aria-hidden={mobileOpen}
                onClick={() => setMobileOpen(true)}
                className={cn(
                    'border-border fixed top-3 left-3 z-[60] flex size-9 items-center justify-center rounded-[8px] border bg-white shadow-sm transition-opacity lg:hidden',
                    mobileOpen ? 'pointer-events-none opacity-0' : 'opacity-100',
                )}
            >
                <Menu size={18} className="text-ink-dim" />
            </button>

            {/* Desktop sidebar */}
            <aside
                data-tour="sidebar"
                className="border-border fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r bg-white lg:flex"
            >
                <SidebarInner />
            </aside>

            {/* Mobile Sheet — full-screen drawer */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent
                    side="left"
                    showClose={false}
                    className="w-full max-w-none gap-0 border-r-0 p-0"
                >
                    <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                    <SidebarInner onClose={() => setMobileOpen(false)} />
                </SheetContent>
            </Sheet>
        </>
    );
}
