import { Skeleton } from '@/shared/components/ui/skeleton';

export default function ConfigLoading(): React.JSX.Element {
    return (
        <div className="p-8 space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-4 w-72" />
            </div>
            <div className="grid grid-cols-3 gap-4">
                {['a', 'b', 'c', 'd', 'e', 'f'].map((id) => (
                    <Skeleton key={id} className="h-28 w-full" />
                ))}
            </div>
        </div>
    );
}
