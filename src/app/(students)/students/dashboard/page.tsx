import { Suspense } from 'react';
import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/shared/lib/prisma';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { BookOpen, Flame, GraduationCap, Sparkles } from 'lucide-react';
import { StatTile } from '@/shared/components/ui/stat-tile';

export const metadata = {
    title: 'Dashboard · Aulika',
};

// ─── Componentes placeholder para widgets de MiniMax ─────────────────────────
// Cada <Suspense> delimita un widget asíncrono independiente.
// MiniMax reemplaza el contenido de cada función async con las queries reales.

async function WelcomeHeader({ studentId }: { studentId: string }) {
    const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: {
            name: true,
            lastname: true,
            group: { select: { name: true } },
            academicInstitution: { select: { name: true } },
        },
    });

    if (!student) return null;

    const firstName = student.name?.split(' ')[0] ?? 'Estudiante';
    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

    return (
        <div className="mb-8">
            <p className="text-mute mb-1 font-mono text-[11px] font-bold tracking-[0.1em] uppercase">
                {student.academicInstitution?.name ?? 'Aulika'}
                {student.group?.name ? ` · ${student.group.name}` : ''}
            </p>
            <h1 className="font-display text-ink text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[34px]">
                {greeting}, {firstName}
            </h1>
        </div>
    );
}

function WelcomeHeaderSkeleton() {
    return (
        <div className="mb-8">
            <Skeleton className="mb-2 h-3 w-40" />
            <Skeleton className="h-9 w-72" />
        </div>
    );
}

// Placeholder para StatTilesGrid — MiniMax implementa las queries reales
function StatTilesGridSkeleton() {
    return (
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div
                    key={i}
                    className="border-border animate-pulse rounded-[14px] border bg-white p-4"
                >
                    <Skeleton className="mb-2 h-3 w-20" />
                    <Skeleton className="mb-1 h-8 w-16" />
                    <Skeleton className="h-3 w-24" />
                </div>
            ))}
        </div>
    );
}

// Placeholder para UpcomingWidget — MiniMax implementa
function UpcomingWidgetSkeleton() {
    return (
        <div className="border-border mb-6 rounded-[14px] border bg-white p-5">
            <Skeleton className="mb-4 h-4 w-32" />
            <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="size-8 rounded-lg" />
                        <div className="flex-1">
                            <Skeleton className="mb-1 h-3.5 w-40" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Placeholder para RecentGradesWidget — MiniMax implementa
function RecentGradesWidgetSkeleton() {
    return (
        <div className="border-border rounded-[14px] border bg-white p-5">
            <Skeleton className="mb-4 h-4 w-32" />
            <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-1">
                        <Skeleton className="h-3.5 w-48" />
                        <Skeleton className="h-6 w-12 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Placeholder para RecentActivityWidget — MiniMax implementa (solo plan LMS)
function RecentActivityWidgetSkeleton() {
    return (
        <div className="border-border rounded-[14px] border bg-white p-5">
            <Skeleton className="mb-4 h-4 w-32" />
            <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="size-7 rounded-full" />
                        <div className="flex-1">
                            <Skeleton className="mb-1 h-3.5 w-36" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-3.5 w-10" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Placeholder para MyCoursesWidget — MiniMax implementa (solo plan LMS)
function MyCoursesWidgetSkeleton() {
    return (
        <div className="border-border mb-6 rounded-[14px] border bg-white p-5">
            <Skeleton className="mb-4 h-4 w-24" />
            <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border-border rounded-xl border p-4">
                        <Skeleton className="mb-2 h-4 w-32" />
                        <Skeleton className="mb-3 h-2 w-full rounded-full" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default async function DashboardPage() {
    const session = await getStudentAuthSession();
    if (!session) redirect('/students/examen/login');

    return (
        <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            {/* Welcome header */}
            <Suspense fallback={<WelcomeHeaderSkeleton />}>
                <WelcomeHeader studentId={session.studentId} />
            </Suspense>

            {/* KPI tiles — MiniMax agrega StatTilesGrid aquí */}
            <Suspense fallback={<StatTilesGridSkeleton />}>
                {/* TODO (MiniMax): reemplazar con <StatTilesGrid studentId={session.studentId} hasLms={hasLms} /> */}
                <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatTile
                        label="Promedio"
                        value="—"
                        sub="sin datos aún"
                        icon={<GraduationCap className="size-4" />}
                    />
                    <StatTile
                        label="Progreso LMS"
                        value="—"
                        sub="sin datos aún"
                        icon={<BookOpen className="size-4" />}
                    />
                    <StatTile
                        label="Racha"
                        value="—"
                        sub="días activos"
                        icon={<Flame className="size-4" />}
                    />
                    <StatTile
                        label="Puntos XP"
                        value="—"
                        sub="sin actividad"
                        icon={<Sparkles className="size-4" />}
                    />
                </div>
            </Suspense>

            {/* Grid principal: upcoming + recent grades */}
            <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_380px]">
                {/* Upcoming widget — MiniMax agrega <UpcomingWidget /> */}
                <Suspense fallback={<UpcomingWidgetSkeleton />}>
                    <div className="border-border rounded-[14px] border bg-white p-5">
                        <h2 className="text-ink mb-4 text-[14px] font-semibold">
                            Próximas actividades
                        </h2>
                        <p className="text-mute text-[13px]">
                            Sin pendientes por esta semana ✓
                        </p>
                    </div>
                </Suspense>

                {/* Recent grades — MiniMax agrega <RecentGradesWidget /> */}
                <Suspense fallback={<RecentGradesWidgetSkeleton />}>
                    <div className="border-border rounded-[14px] border bg-white p-5">
                        <h2 className="text-ink mb-4 text-[14px] font-semibold">
                            Últimas calificaciones
                        </h2>
                        <p className="text-mute text-[13px]">Sin calificaciones recientes.</p>
                    </div>
                </Suspense>
            </div>

            {/* Mis cursos (solo LMS) — MiniMax agrega <MyCoursesWidget /> */}
            <Suspense fallback={<MyCoursesWidgetSkeleton />}>
                {/* TODO (MiniMax): condicional según hasLms + <MyCoursesWidget /> */}
            </Suspense>

            {/* Actividad reciente (solo LMS) — MiniMax agrega <RecentActivityWidget /> */}
            <Suspense fallback={<RecentActivityWidgetSkeleton />}>
                {/* TODO (MiniMax): <RecentActivityWidget studentId={session.studentId} /> */}
            </Suspense>
        </div>
    );
}
