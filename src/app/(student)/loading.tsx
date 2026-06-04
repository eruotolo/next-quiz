import { Skeleton } from '@/shared/components/ui/skeleton';

export default function StudentLoading(): React.JSX.Element {
    return (
        <div className="bg-paper flex min-h-screen items-center justify-center">
            <div className="w-full max-w-lg space-y-4 p-6">
                <Skeleton className="mx-auto h-10 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="mt-4 h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
}
