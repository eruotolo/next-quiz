import { Skeleton } from '@/shared/components/ui/skeleton';

export default function ResultsLoading() {
    return (
        <div className="space-y-6 p-8">
            <div className="space-y-2">
                <Skeleton className="h-8 w-44" />
                <Skeleton className="h-4 w-56" />
            </div>
            <div className="grid grid-cols-4 gap-4">
                {['a', 'b', 'c', 'd'].map((id) => (
                    <Skeleton key={id} className="h-24 w-full" />
                ))}
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
    );
}
