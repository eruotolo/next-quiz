import type { CSSProperties } from 'react';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Tag } from '@/shared/components/ui/badge';
import {
    Building2,
    ScrollText,
    Settings,
    UserCog,
    Users,
    Activity,
    Zap,
    CreditCard,
    Sliders,
    FolderKanban,
    CalendarDays,
    GraduationCap,
    ClipboardList,
} from 'lucide-react';
import Link from 'next/link';

export default async function ConfigPage() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [
        institutions,
        totalAdmins,
        totalStudents,
        totalProfessors,
        recentAuditEvents,
        activeInstitutions,
    ] = await Promise.all([
        prisma.academicInstitution.count(),
        prisma.user.count({ where: { userRole: { name: USER_ROLE.ADMIN } } }),
        prisma.user.count({ where: { userRole: { name: USER_ROLE.STUDENT } } }),
        prisma.user.count({ where: { userRole: { name: USER_ROLE.PROFESOR } } }),
        prisma.auditLog.count({ where: { createdAt: { gte: oneDayAgo } } }),
        prisma.academicInstitution.count({ where: { active: true } }),
    ]);

    const stats = [
        {
            label: 'Instituciones',
            value: institutions,
            sub: `${activeInstitutions} activas`,
            icon: Building2,
        },
        {
            label: 'Estudiantes',
            value: totalStudents,
            sub: 'en la plataforma',
            icon: Users,
        },
        {
            label: 'Docentes',
            value: totalAdmins + totalProfessors,
            sub: `${totalAdmins} admin · ${totalProfessors} prof.`,
            icon: UserCog,
        },
        {
            label: 'Eventos 24h',
            value: recentAuditEvents,
            sub: 'auditoría reciente',
            icon: Activity,
        },
    ];

    const navLinks = [
        {
            href: '/config/institutions',
            label: 'Gestionar instituciones',
            sub: 'Crear, editar y activar instituciones académicas',
            icon: Building2,
            color: '#1F2EFF',
            wash: '#E8EAFF',
        },
        {
            href: '/config/admins',
            label: 'Administradores',
            sub: 'Crear y gestionar administradores por institución',
            icon: UserCog,
            color: '#7C5CFF',
            wash: '#EDE9FF',
        },
        {
            href: '/config/students',
            label: 'Todos los alumnos',
            sub: 'Gestión global de estudiantes de la plataforma',
            icon: Users,
            color: '#0F7C4A',
            wash: '#E6F4ED',
        },
        {
            href: '/config/auditoria',
            label: 'Auditoría',
            sub: 'Bitácora global de actividad de la plataforma',
            icon: ScrollText,
            color: '#B7791F',
            wash: '#FFF2D4',
        },
        {
            href: '/config/settings',
            label: 'Configuración',
            sub: 'API de Brevo y ajustes globales del sistema',
            icon: Settings,
            color: '#75716B',
            wash: '#EFEBE0',
        },
        {
            href: '/config/billing',
            label: 'Facturación',
            sub: 'Dashboard de MRR, ingresos y métricas de suscripciones',
            icon: CreditCard,
            color: '#1F2EFF',
            wash: '#E8EAFF',
        },
        {
            href: '/config/subscriptions',
            label: 'Suscripciones',
            sub: 'Registro de pagos, pagadores e instituciones por plan',
            icon: Sliders,
            color: '#0F7C4A',
            wash: '#E6F4ED',
        },
        {
            href: '/config/plan-limits',
            label: 'Límites de planes',
            sub: 'Configurar recursos máximos por plan FREE, Docente y Colegio',
            icon: Zap,
            color: '#B7791F',
            wash: '#FFF2D4',
        },
        {
            href: '/config/programs',
            label: 'Programas / Carreras',
            sub: 'Vista global de carreras, niveles y especialidades por institución',
            icon: FolderKanban,
            color: '#6D28D9',
            wash: '#EDE9FF',
        },
        {
            href: '/config/periods',
            label: 'Períodos Académicos',
            sub: 'Años escolares, semestres y módulos de todas las instituciones',
            icon: CalendarDays,
            color: '#0369A1',
            wash: '#E0F2FE',
        },
        {
            href: '/config/groups',
            label: 'Grupos / Cursos',
            sub: 'Vista global de cursos y grupos de alumnos por institución',
            icon: GraduationCap,
            color: '#0F7C4A',
            wash: '#E6F4ED',
        },
        {
            href: '/config/exams',
            label: 'Exámenes / Evaluaciones',
            sub: 'Listado global de evaluaciones creadas en la plataforma',
            icon: ClipboardList,
            color: '#B7791F',
            wash: '#FFF2D4',
        },
    ];

    return (
        <main className="flex-1 space-y-8 overflow-auto p-8">
            <div className="flex justify-end">
                <Button variant="ink" size="md" asChild className="gap-2">
                    <Link href="/config/institutions">
                        <Building2 size={16} />
                        Crear institución
                    </Link>
                </Button>
            </div>

            {/* Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((s) => (
                        <Card key={s.label} className="border-border bg-white p-6 shadow-sm">
                            <div className="bg-primary-wash border-primary/10 text-primary mb-5 flex h-11 w-11 items-center justify-center rounded-[12px] border">
                                <s.icon size={20} />
                            </div>
                            <p className="font-display text-ink text-[40px] leading-none font-bold tracking-[-0.03em]">
                                {s.value}
                            </p>
                            <p className="text-mute mt-2 font-mono text-[11px] font-bold tracking-[0.1em] uppercase">
                                {s.label}
                            </p>
                            <p className="text-ink-dim mt-1 text-[12px]">{s.sub}</p>
                        </Card>
                    ))}
                </div>

                {/* Navigation cards */}
                <div>
                    <h2 className="text-mute mb-4 font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
                        Módulos del sistema
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {navLinks.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="group border-border flex items-center gap-4 rounded-[18px] border border-l-[4px] [border-left-color:var(--cfg-c)] bg-white p-5 shadow-sm transition-all hover:shadow-md"
                                style={
                                    {
                                        '--cfg-c': item.color,
                                        '--cfg-wash': item.wash,
                                    } as CSSProperties
                                }
                            >
                                <div className="border-border/50 flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border [background-color:var(--cfg-wash)] [color:var(--cfg-c)]">
                                    <item.icon size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-ink text-[14px] font-bold">{item.label}</p>
                                    <p className="text-mute mt-0.5 text-[12px] leading-snug">
                                        {item.sub}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* System health + audit */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="border-border bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center gap-2">
                            <Zap size={15} className="text-primary" />
                            <h3 className="text-mute font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
                                Salud del sistema · últimas 24h
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'API latencia', value: '< 120ms', ok: true },
                                { label: 'Sesiones activas', value: '—', ok: true },
                                { label: 'Errores 5xx', value: '0', ok: true },
                                {
                                    label: 'Eventos audit',
                                    value: String(recentAuditEvents),
                                    ok: recentAuditEvents < 100,
                                },
                            ].map((item) => (
                                <div key={item.label} className="flex flex-col gap-1">
                                    <span className="text-mute font-mono text-[10px] font-bold tracking-widest uppercase">
                                        {item.label}
                                    </span>
                                    <span
                                        className={`font-display text-[22px] leading-none font-bold ${item.ok ? 'text-success' : 'text-destructive'}`}
                                    >
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="border-border bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center gap-2">
                            <ScrollText size={15} className="text-primary" />
                            <h3 className="text-mute font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
                                Auditoría · últimos cambios
                            </h3>
                        </div>
                        <div className="flex h-[100px] flex-col items-center justify-center gap-3">
                            <Tag tone="outline" className="h-7 px-3 font-mono text-[11px]">
                                {recentAuditEvents} evento{recentAuditEvents !== 1 ? 's' : ''} en
                                las últimas 24h
                            </Tag>
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="text-mute font-mono text-[11px] tracking-widest uppercase"
                            >
                                <Link href="/config/auditoria">Ver bitácora completa →</Link>
                            </Button>
                        </div>
                    </Card>
                </div>
        </main>
    );
}
