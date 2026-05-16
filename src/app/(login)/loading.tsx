import { Skeleton } from '@/shared/components/ui/skeleton';

export default function LoginLoading(): React.JSX.Element {
    return (
        <div className="flex min-h-screen items-center justify-center bg-paper">
            <div className="w-full max-w-sm space-y-4 p-6">
                <Skeleton className="mx-auto h-10 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
}
