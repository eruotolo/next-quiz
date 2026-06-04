import { Skeleton } from '@/shared/components/ui/skeleton';

export default function InstitutionsLoading(): React.JSX.Element {
    return (
        <div className="space-y-6 p-8">
            <div className="space-y-2">
                <Skeleton className="h-8 w-52" />
                <Skeleton className="h-4 w-68" />
            </div>
            <Skeleton className="h-9 w-40" />
            <div className="grid grid-cols-2 gap-4">
                {['a', 'b', 'c', 'd', 'e', 'f'].map((id) => (
                    <Skeleton key={id} className="h-28 w-full" />
                ))}
            </div>
        </div>
    );
}
