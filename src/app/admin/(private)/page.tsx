import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { BarChart3, BookOpen, GraduationCap, Users } from 'lucide-react';

async function getStats() {
    const [groups, students, exams, results] = await Promise.all([
        prisma.group.count(),
        prisma.user.count({ where: { role: Role.STUDENT } }),
        prisma.exam.count(),
        prisma.result.count(),
    ]);
    const activeExams = await prisma.exam.count({ where: { active: true } });
    return { groups, students, exams, results, activeExams };
}

const statCards = [
    { label: 'Grupos', color: 'bg-blue-50 text-blue-600', icon: Users, key: 'groups' },
    {
        label: 'Alumnos',
        color: 'bg-violet-50 text-violet-600',
        icon: GraduationCap,
        key: 'students',
    },
    { label: 'Exámenes', color: 'bg-amber-50 text-amber-600', icon: BookOpen, key: 'exams' },
    {
        label: 'Resultados',
        color: 'bg-emerald-50 text-emerald-600',
        icon: BarChart3,
        key: 'results',
    },
] as const;

export default async function AdminDashboardPage() {
    const session = await auth();
    const stats = await getStats();

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div>
                <h1 className="text-default-900 text-2xl font-bold">
                    Hola, {session?.user?.name?.split(' ')[0]} 👋
                </h1>
                <p className="text-default-500 mt-1">
                    Aquí está el resumen de tu plataforma de exámenes.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {statCards.map(({ label, color, icon: Icon, key }) => (
                    <div
                        key={key}
                        className="border-default-100 rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                        <div className={`mb-4 inline-flex rounded-xl p-3 ${color}`}>
                            <Icon size={22} />
                        </div>
                        <p className="text-default-900 text-3xl font-bold">{stats[key]}</p>
                        <p className="text-default-500 mt-1 text-sm">{label}</p>
                    </div>
                ))}
            </div>

            {/* Active exams banner */}
            {stats.activeExams > 0 && (
                <div className="border-success-200 bg-success-50 flex items-center gap-4 rounded-2xl border px-6 py-4">
                    <div className="bg-success h-3 w-3 shrink-0 animate-pulse rounded-full" />
                    <p className="text-success-800 text-sm font-medium">
                        {stats.activeExams} examen{stats.activeExams > 1 ? 'es' : ''} activo
                        {stats.activeExams > 1 ? 's' : ''} en este momento.
                    </p>
                </div>
            )}

            {/* Quick access */}
            <div>
                <h2 className="text-default-800 mb-4 text-lg font-semibold">Acceso rápido</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        {
                            href: '/admin/exams',
                            label: 'Gestionar exámenes',
                            desc: 'Crear, editar y activar exámenes',
                            color: 'border-l-amber-400',
                        },
                        {
                            href: '/admin/students',
                            label: 'Gestionar alumnos',
                            desc: 'Agregar o editar alumnos por grupo',
                            color: 'border-l-violet-400',
                        },
                        {
                            href: '/admin/results',
                            label: 'Ver resultados',
                            desc: 'Revisar calificaciones de todos los exámenes',
                            color: 'border-l-emerald-400',
                        },
                    ].map(({ href, label, desc, color }) => (
                        <a
                            key={href}
                            href={href}
                            className={`border-default-100 block rounded-2xl border border-l-4 ${color} bg-white p-5 shadow-sm transition-shadow hover:shadow-md`}
                        >
                            <p className="text-default-900 font-semibold">{label}</p>
                            <p className="text-default-500 mt-1 text-sm">{desc}</p>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
