import { redirect } from 'next/navigation';
import { LogOut, Mail, School, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Avatar } from '@/shared/components/ui/avatar';
import {
    getDashboardContext,
    getDashboardIdentity,
} from '@/features/students/lib/dashboard-queries';
import { logoutStudent } from '@/features/exam-session/actions/mutations';
import { prisma } from '@/shared/lib/prisma';

export const metadata = {
    title: 'Configuración · Aulika',
};

function maskRut(rut: string | null): string {
    if (!rut) return '—';
    const body = rut.slice(0, -1);
    const dv = rut.slice(-1);
    if (body.length <= 4) return `${body}-${dv}`;
    return `${'*'.repeat(Math.max(0, body.length - 3))}${body.slice(-3)}-${dv}`;
}

export default async function ConfiguracionPage() {
    const ctx = await getDashboardContext();
    if (!ctx) redirect('/students/examen/login');

    const [identity, fullUser] = await Promise.all([
        getDashboardIdentity(ctx.studentId),
        prisma.user.findUnique({
            where: { id: ctx.studentId },
            select: { email: true, rut: true },
        }),
    ]);

    if (!identity) redirect('/students/examen/login');

    const fullName = `${identity.name ?? ''} ${identity.lastname ?? ''}`.trim() || 'Estudiante';

    return (
        <div className="mx-auto flex max-w-xl flex-col gap-6">
            <header>
                <p className="text-mute mb-2 font-mono text-[10px] font-bold tracking-[0.12em] uppercase">
                    Tu cuenta
                </p>
                <h1 className="font-display text-ink text-[28px] leading-tight font-medium tracking-[-0.02em] sm:text-[32px]">
                    Configuración
                </h1>
                <p className="text-ink-dim mt-2 text-[14px]">
                    Datos de tu cuenta de estudiante. Para modificar el nombre o el grupo, contactá
                    a tu profesor.
                </p>
            </header>

            <section className="bg-surface border-border rounded-[16px] border p-6">
                <div className="flex items-center gap-4">
                    <Avatar name={fullName} size={56} />
                    <div>
                        <p className="font-display text-ink text-[18px] font-semibold tracking-[-0.01em]">
                            {fullName}
                        </p>
                        <p className="text-mute font-mono text-[11px] tracking-wide uppercase">
                            Estudiante
                        </p>
                    </div>
                </div>
            </section>

            <dl className="bg-surface border-border divide-border divide-y rounded-[16px] border">
                <Row icon={UserIcon} label="Nombre completo" value={fullName} />
                <Row icon={ShieldCheck} label="RUT" value={maskRut(fullUser?.rut ?? null)} />
                <Row icon={Mail} label="Email" value={fullUser?.email ?? '—'} />
                <Row
                    icon={School}
                    label="Grupo"
                    value={identity.groupName ?? 'Sin grupo asignado'}
                />
                <Row icon={School} label="Institución" value={identity.institutionName} />
            </dl>

            <form action={logoutStudent} className="pt-2">
                <button
                    type="submit"
                    className="border-border hover:bg-paper-warm inline-flex w-full items-center justify-center gap-2 rounded-[12px] border-2 px-4 py-3 text-[14px] font-semibold"
                >
                    <LogOut className="size-4" aria-hidden="true" />
                    Cerrar sesión
                </button>
            </form>
        </div>
    );
}

function Row({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof UserIcon;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-3 px-5 py-4">
            <span className="bg-paper-warm text-ink-dim flex size-9 shrink-0 items-center justify-center rounded-full">
                <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
                <dt className="text-mute font-mono text-[10px] font-bold tracking-[0.08em] uppercase">
                    {label}
                </dt>
                <dd className="text-ink mt-0.5 truncate text-[14px]">{value}</dd>
            </div>
        </div>
    );
}
