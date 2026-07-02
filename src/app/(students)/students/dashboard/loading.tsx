import { Skeleton } from '@/shared/components/ui/skeleton';

export default function DashboardLoading() {
    return (
        <div>
            {/* Welcome header skeleton */}
            <div className="mb-8">
                <Skeleton className="mb-2 h-3 w-40" />
                <Skeleton className="h-9 w-72" />
            </div>

            {/* KPI tiles */}
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

            {/* Main grid */}
            <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_380px]">
                <div className="border-border rounded-[14px] border bg-white p-5">
                    <Skeleton className="mb-4 h-4 w-40" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="mb-3 flex items-center gap-3">
                            <Skeleton className="size-8 shrink-0 rounded-lg" />
                            <div className="flex-1">
                                <Skeleton className="mb-1 h-3.5 w-36" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="border-border rounded-[14px] border bg-white p-5">
                    <Skeleton className="mb-4 h-4 w-36" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="mb-2 flex items-center justify-between">
                            <Skeleton className="h-3.5 w-44" />
                            <Skeleton className="h-6 w-12 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Courses */}
            <div className="border-border rounded-[14px] border bg-white p-5">
                <Skeleton className="mb-4 h-4 w-24" />
                <div className="grid gap-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="border-border rounded-xl border p-4">
                            <Skeleton className="mb-2 h-4 w-32" />
                            <Skeleton className="mb-3 h-1.5 w-full rounded-full" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
