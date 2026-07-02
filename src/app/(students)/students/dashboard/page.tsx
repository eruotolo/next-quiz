import { Suspense } from 'react';
import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { redirect } from 'next/navigation';
import { getDashboardContext, getDashboardSummaryCounts } from '@/features/students/lib/dashboard-queries';
import { StatTilesGrid } from '@/features/students/components/dashboard/StatTilesGrid';
import { WelcomeHeader } from '@/features/students/components/dashboard/WelcomeHeader';
import { UpcomingWidget } from '@/features/students/components/dashboard/UpcomingWidget';
import { RecentGradesWidget } from '@/features/students/components/dashboard/RecentGradesWidget';
import { MyCoursesWidget } from '@/features/students/components/dashboard/MyCoursesWidget';
import { RecentActivityWidget } from '@/features/students/components/dashboard/RecentActivityWidget';
import { GradeTrendChart } from '@/features/students/components/dashboard/GradeTrendChart';
import { CourseProgressChart } from '@/features/students/components/dashboard/CourseProgressChart';
import { StreakHeatmap } from '@/features/students/components/dashboard/StreakHeatmap';
import {
    StatTilesGridSkeleton,
    UpcomingWidgetSkeleton,
    RecentGradesWidgetSkeleton,
    MyCoursesWidgetSkeleton,
    RecentActivityWidgetSkeleton,
} from '@/features/students/components/dashboard/DashboardSkeletons';

export const metadata = {
    title: 'Dashboard · Aulika',
};

function ChartSkeleton() {
    return (
        <div
            aria-hidden="true"
            className="border-border h-[240px] animate-pulse rounded-[16px] border bg-white"
        />
    );
}

export default async function DashboardPage() {
    const session = await getStudentAuthSession();
    if (!session) redirect('/students/examen/login');

    const ctx = await getDashboardContext();
    if (!ctx) redirect('/students/examen/login');

    const summary = await getDashboardSummaryCounts(ctx);
    const { studentId, hasLms } = ctx;

    return (
        <>
            <Suspense
                fallback={
                    <div className="mb-8 flex flex-col gap-3" aria-hidden="true">
                        <div className="bg-mute/20 h-3 w-40 animate-pulse rounded" />
                        <div className="bg-mute/20 h-9 w-72 animate-pulse rounded" />
                        <div className="bg-mute/20 h-4 w-96 animate-pulse rounded" />
                    </div>
                }
            >
                <WelcomeHeader studentId={studentId} summary={summary} />
            </Suspense>

            <Suspense fallback={<StatTilesGridSkeleton />}>
                <StatTilesGrid studentId={studentId} hasLms={hasLms} />
            </Suspense>

            <section className="mb-6">
                <Suspense fallback={<ChartSkeleton />}>
                    <GradeTrendChart studentId={studentId} />
                </Suspense>
            </section>

            <div className="mb-6 grid gap-6 lg:grid-cols-2">
                <Suspense fallback={<ChartSkeleton />}>
                    {hasLms ? (
                        <CourseProgressChart studentId={studentId} />
                    ) : (
                        <UpcomingWidget ctx={ctx} />
                    )}
                </Suspense>
                <Suspense fallback={<UpcomingWidgetSkeleton />}>
                    {hasLms ? (
                        <UpcomingWidget ctx={ctx} />
                    ) : (
                        <RecentGradesWidget studentId={studentId} />
                    )}
                </Suspense>
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-2">
                <Suspense fallback={<RecentGradesWidgetSkeleton />}>
                    {hasLms ? (
                        <RecentGradesWidget studentId={studentId} />
                    ) : (
                        <CourseProgressChart studentId={studentId} />
                    )}
                </Suspense>
                {hasLms && (
                    <Suspense fallback={<ChartSkeleton />}>
                        <StreakHeatmap studentId={studentId} />
                    </Suspense>
                )}
            </div>

            {hasLms && (
                <div className="mb-6">
                    <Suspense fallback={<MyCoursesWidgetSkeleton />}>
                        <MyCoursesWidget studentId={studentId} />
                    </Suspense>
                </div>
            )}

            {hasLms && (
                <div className="mb-6">
                    <Suspense fallback={<RecentActivityWidgetSkeleton />}>
                        <RecentActivityWidget studentId={studentId} />
                    </Suspense>
                </div>
            )}
        </>
    );
}
