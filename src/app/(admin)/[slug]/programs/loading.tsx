import { Skeleton } from '@/shared/components/ui/skeleton';

export default function ProgramsLoading() {
    return (
        <div className="space-y-4 p-8">
            <Skeleton className="h-10 w-full" />
            {['a', 'b', 'c', 'd', 'e'].map((id) => (
                <Skeleton key={id} className="h-14 w-full" />
            ))}
        </div>
    );
}
