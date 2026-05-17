import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
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
} from 'lucide-react';
import Link from 'next/link';

export default async function ConfigPage() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [institutions, totalAdmins, totalStudents, totalProfessors, recentAuditEvents, activeInstitutions] = await Promise.all([
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
            href: '/config/subscriptions',
            label: 'Suscripciones',
            sub: 'Registro de pagos, pagadores e instituciones por plan',
            icon: CreditCard,
            color: '#0F7C4A',
            wash: '#E6F4ED',
        },
        {
            href: '/config/plan-limits',
            label: 'Límites de planes',
            sub: 'Configurar recursos máximos por plan FREE, Docente y Colegio',
            icon: Sliders,
            color: '#1F2EFF',
            wash: '#E8EAFF',
        },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-paper">
            <AdminTopBar
                breadcrumb={['Aulika · Plataforma', 'Panel Global']}
                title="Panel SuperAdmin"
                subtitle={`${activeInstitutions} instituciones activas · ${totalStudents} estudiantes · ${totalAdmins + totalProfessors} docentes`}
                actions={
                    <Button variant="ink" size="md" asChild className="gap-2">
                        <Link href="/config/institutions">
                            <Building2 size={16} />
                            Crear institución
                        </Link>
                    </Button>
                }
            />

            <main className="flex-1 p-8 space-y-8 overflow-auto">
                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((s) => (
                        <Card key={s.label} className="bg-white border-border shadow-sm p-6">
                            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[12px] bg-primary-wash border border-primary/10 text-primary">
                                <s.icon size={20} />
                            </div>
                            <p className="font-display text-[40px] font-bold leading-none tracking-[-0.03em] text-ink">
                                {s.value}
                            </p>
                            <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-mute">
                                {s.label}
                            </p>
                            <p className="mt-1 text-[12px] text-ink-dim">{s.sub}</p>
                        </Card>
                    ))}
                </div>

                {/* Navigation cards */}
                <div>
                    <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-mute mb-4">
                        Módulos del sistema
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {navLinks.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="group flex items-center gap-4 rounded-[18px] border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md"
                                style={{ borderLeftWidth: 4, borderLeftColor: item.color }}
                            >
                                <div
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-border/50"
                                    style={{ backgroundColor: item.wash, color: item.color }}
                                >
                                    <item.icon size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[14px] font-bold text-ink">
                                        {item.label}
                                    </p>
                                    <p className="mt-0.5 text-[12px] text-mute leading-snug">
                                        {item.sub}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* System health + audit */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="bg-white border-border shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <Zap size={15} className="text-primary" />
                            <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-mute">
                                Salud del sistema · últimas 24h
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'API latencia', value: '< 120ms', ok: true },
                                { label: 'Sesiones activas', value: '—', ok: true },
                                { label: 'Errores 5xx', value: '0', ok: true },
                                { label: 'Eventos audit', value: String(recentAuditEvents), ok: recentAuditEvents < 100 },
                            ].map((item) => (
                                <div key={item.label} className="flex flex-col gap-1">
                                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-mute">{item.label}</span>
                                    <span className={`font-display text-[22px] font-bold leading-none ${item.ok ? 'text-success' : 'text-destructive'}`}>
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="bg-white border-border shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <ScrollText size={15} className="text-primary" />
                            <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-mute">
                                Auditoría · últimos cambios
                            </h3>
                        </div>
                        <div className="flex flex-col items-center justify-center h-[100px] gap-3">
                            <Tag tone="outline" className="font-mono text-[11px] h-7 px-3">
                                {recentAuditEvents} evento{recentAuditEvents !== 1 ? 's' : ''} en las últimas 24h
                            </Tag>
                            <Button variant="ghost" size="sm" asChild className="font-mono text-[11px] uppercase tracking-widest text-mute">
                                <Link href="/config/auditoria">Ver bitácora completa →</Link>
                            </Button>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
