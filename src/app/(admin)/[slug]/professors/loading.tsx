import { Skeleton } from '@/shared/components/ui/skeleton';

export default function ProfessorsLoading(): React.JSX.Element {
    return (
        <div className="p-8 space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-44" />
                <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-9 w-36" />
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                {['a', 'b', 'c', 'd', 'e', 'f'].map((id) => (
                    <Skeleton key={id} className="h-14 w-full" />
                ))}
            </div>
        </div>
    );
}
