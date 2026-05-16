import { Skeleton } from '@/shared/components/ui/skeleton';

export default function ExamsLoading(): React.JSX.Element {
    return (
        <div className="p-8 space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-3">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-32" />
            </div>
            <div className="space-y-3">
                {['a', 'b', 'c', 'd', 'e'].map((id) => (
                    <Skeleton key={id} className="h-24 w-full" />
                ))}
            </div>
        </div>
    );
}
