import { Skeleton } from '@/shared/components/ui/skeleton';

export default function ConfigGroupsLoading() {
    return (
        <div className="space-y-6 p-8">
            <div className="space-y-2">
                <Skeleton className="h-8 w-52" />
                <Skeleton className="h-4 w-68" />
            </div>
            <Skeleton className="h-9 w-64" />
            <div className="space-y-2">
                {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => (
                    <Skeleton key={id} className="h-12 w-full" />
                ))}
            </div>
        </div>
    );
}
