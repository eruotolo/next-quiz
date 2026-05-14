import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { Building2, ScrollText, Settings, UserCog, Users } from 'lucide-react';
import Link from 'next/link';

export default async function ConfigPage() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [institutions, totalAdmins, totalStudents, recentAuditEvents] = await Promise.all([
        prisma.academicInstitution.count(),
        prisma.user.count({ where: { userRole: { name: USER_ROLE.ADMIN } } }),
        prisma.user.count({ where: { userRole: { name: USER_ROLE.STUDENT } } }),
        prisma.auditLog.count({ where: { createdAt: { gte: oneDayAgo } } }),
    ]);

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-foreground text-[24px] font-extrabold tracking-tight">
                    Panel de configuración
                </h1>
                <p className="text-muted-foreground mt-1 text-[14px]">
                    Administración global de la plataforma EduNext Quiz.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="border-border rounded-2xl border bg-white p-[22px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="mb-4 flex h-[44px] w-[44px] items-center justify-center rounded-xl bg-blue-100">
                        <Building2 size={20} className="text-blue-700" />
                    </div>
                    <p className="text-foreground text-[30px] leading-none font-extrabold tracking-tight">
                        {institutions}
                    </p>
                    <p className="text-muted-foreground mt-1 text-[13px] font-medium">
                        Instituciones
                    </p>
                </div>

                <div className="border-border rounded-2xl border bg-white p-[22px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="mb-4 flex h-[44px] w-[44px] items-center justify-center rounded-xl bg-indigo-100">
                        <UserCog size={20} className="text-indigo-700" />
                    </div>
                    <p className="text-foreground text-[30px] leading-none font-extrabold tracking-tight">
                        {totalAdmins}
                    </p>
                    <p className="text-muted-foreground mt-1 text-[13px] font-medium">
                        Administradores
                    </p>
                </div>

                <div className="border-border rounded-2xl border bg-white p-[22px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="mb-4 flex h-[44px] w-[44px] items-center justify-center rounded-xl bg-violet-100">
                        <Users size={20} className="text-violet-700" />
                    </div>
                    <p className="text-foreground text-[30px] leading-none font-extrabold tracking-tight">
                        {totalStudents}
                    </p>
                    <p className="text-muted-foreground mt-1 text-[13px] font-medium">
                        Alumnos
                    </p>
                </div>

                <div className="border-border rounded-2xl border bg-white p-[22px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="mb-4 flex h-[44px] w-[44px] items-center justify-center rounded-xl bg-amber-100">
                        <ScrollText size={20} className="text-amber-700" />
                    </div>
                    <p className="text-foreground text-[30px] leading-none font-extrabold tracking-tight">
                        {recentAuditEvents}
                    </p>
                    <p className="text-muted-foreground mt-1 text-[13px] font-medium">
                        Eventos (24 h)
                    </p>
                </div>
            </div>

            <div>
                <h2 className="text-foreground mb-3.5 text-[16px] font-bold">Acciones</h2>
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                    <Link
                        href="/config/institutions"
                        className="border-border flex items-center gap-4 rounded-2xl border bg-white p-[18px] text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md"
                        style={{ borderLeftWidth: 4, borderLeftColor: '#60a5fa' }}
                    >
                        <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[11px] bg-blue-100">
                            <Building2 size={18} className="text-blue-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-foreground text-[14px] font-semibold">
                                Gestionar instituciones
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-[12.5px]">
                                Crear, editar y activar instituciones académicas
                            </p>
                        </div>
                    </Link>

                    <Link
                        href="/config/admins"
                        className="border-border flex items-center gap-4 rounded-2xl border bg-white p-[18px] text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md"
                        style={{ borderLeftWidth: 4, borderLeftColor: '#818cf8' }}
                    >
                        <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[11px] bg-indigo-100">
                            <UserCog size={18} className="text-indigo-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-foreground text-[14px] font-semibold">
                                Gestionar administradores
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-[12.5px]">
                                Crear y gestionar administradores por institución
                            </p>
                        </div>
                    </Link>

                    <Link
                        href="/config/students"
                        className="border-border flex items-center gap-4 rounded-2xl border bg-white p-[18px] text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md"
                        style={{ borderLeftWidth: 4, borderLeftColor: '#a78bfa' }}
                    >
                        <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[11px] bg-violet-100">
                            <Users size={18} className="text-violet-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-foreground text-[14px] font-semibold">
                                Ver todos los alumnos
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-[12.5px]">
                                Gestión global de alumnos de la plataforma
                            </p>
                        </div>
                    </Link>

                    <Link
                        href="/config/auditoria"
                        className="border-border flex items-center gap-4 rounded-2xl border bg-white p-[18px] text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md"
                        style={{ borderLeftWidth: 4, borderLeftColor: '#f59e0b' }}
                    >
                        <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[11px] bg-amber-100">
                            <ScrollText size={18} className="text-amber-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-foreground text-[14px] font-semibold">
                                Ver auditoría
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-[12.5px]">
                                Bitácora global de actividad de la plataforma
                            </p>
                        </div>
                    </Link>

                    <Link
                        href="/config/settings"
                        className="border-border flex items-center gap-4 rounded-2xl border bg-white p-[18px] text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md"
                        style={{ borderLeftWidth: 4, borderLeftColor: '#94a3b8' }}
                    >
                        <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[11px] bg-slate-100">
                            <Settings size={18} className="text-slate-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-foreground text-[14px] font-semibold">
                                Configuración
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-[12.5px]">
                                API de Brevo y ajustes globales de la plataforma
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
