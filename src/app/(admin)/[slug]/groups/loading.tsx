import { Skeleton } from '@/shared/components/ui/skeleton';

export default function GroupsLoading(): React.JSX.Element {
    return (
        <div className="p-8 space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-9 w-32" />
            <div className="grid grid-cols-2 gap-4">
                {['a', 'b', 'c', 'd'].map((id) => (
                    <Skeleton key={id} className="h-32 w-full" />
                ))}
            </div>
        </div>
    );
}
