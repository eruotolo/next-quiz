import { Skeleton } from '@/shared/components/ui/skeleton';

export default function MisMateriasLoading() {
    return (
        <div className="flex flex-col gap-8">
            <div>
                <Skeleton className="mb-2 h-3 w-32" />
                <Skeleton className="h-8 w-48" />
                <Skeleton className="mt-2 h-4 w-72" />
            </div>
            <div>
                <Skeleton className="mb-3 h-5 w-40" />
                <Skeleton className="h-40 w-full rounded-[16px]" />
            </div>
            <div>
                <Skeleton className="mb-3 h-5 w-32" />
                <Skeleton className="h-16 w-full rounded-[16px]" />
                <Skeleton className="mt-2 h-16 w-full rounded-[16px]" />
            </div>
        </div>
    );
}
