import { Skeleton } from '@/shared/components/ui/skeleton';

export function WelcomeHeaderSkeleton() {
    return (
        <div className="mb-8 flex flex-col gap-3" aria-hidden="true">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-48" />
        </div>
    );
}

export function StatTilesGridSkeleton() {
    return (
        <div
            className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
            aria-hidden="true"
        >
            <Skeleton className="h-28 w-full rounded-[14px]" />
            <Skeleton className="h-28 w-full rounded-[14px]" />
            <Skeleton className="h-28 w-full rounded-[14px]" />
            <Skeleton className="h-28 w-full rounded-[14px]" />
        </div>
    );
}

export function UpcomingWidgetSkeleton() {
    return (
        <div className="bg-surface border-border rounded-[16px] border p-5" aria-hidden="true">
            <Skeleton className="mb-4 h-4 w-40" />
            <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    );
}

export function MyCoursesWidgetSkeleton() {
    return (
        <div className="bg-surface border-border rounded-[16px] border p-5" aria-hidden="true">
            <Skeleton className="mb-4 h-4 w-32" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Skeleton className="h-32 w-full rounded-[12px]" />
                <Skeleton className="h-32 w-full rounded-[12px]" />
                <Skeleton className="h-32 w-full rounded-[12px]" />
            </div>
        </div>
    );
}

export function RecentGradesWidgetSkeleton() {
    return (
        <div className="bg-surface border-border rounded-[16px] border p-5" aria-hidden="true">
            <Skeleton className="mb-4 h-4 w-32" />
            <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    );
}

export function RecentActivityWidgetSkeleton() {
    return (
        <div className="bg-surface border-border rounded-[16px] border p-5" aria-hidden="true">
            <Skeleton className="mb-4 h-4 w-36" />
            <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
}