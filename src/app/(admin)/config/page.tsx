import { prisma } from '@/shared/lib/prisma';
import { Building2, Users } from 'lucide-react';
import Link from 'next/link';

export default async function ConfigPage() {
    const [institutions, totalUsers] = await Promise.all([
        prisma.academicInstitution.count(),
        prisma.user.count(),
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
                    <div className="mb-4 flex h-[44px] w-[44px] items-center justify-center rounded-xl bg-violet-100">
                        <Users size={20} className="text-violet-700" />
                    </div>
                    <p className="text-foreground text-[30px] leading-none font-extrabold tracking-tight">
                        {totalUsers}
                    </p>
                    <p className="text-muted-foreground mt-1 text-[13px] font-medium">
                        Usuarios totales
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
                </div>
            </div>
        </div>
    );
}
