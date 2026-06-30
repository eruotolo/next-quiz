import { Skeleton } from '@/shared/components/ui/skeleton';

export default function CalendarioLoading() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <Skeleton className="mb-2 h-3 w-24" />
                <Skeleton className="h-8 w-40" />
                <Skeleton className="mt-2 h-4 w-72" />
            </div>
            <Skeleton className="h-[28rem] w-full rounded-[16px]" />
            <Skeleton className="h-40 w-full rounded-[16px]" />
        </div>
    );
}