import { Skeleton } from '@/shared/components/ui/skeleton';

export default function SlugLoading() {
    return (
        <div className="bg-paper flex min-h-screen">
            <div className="w-60 shrink-0 border-r bg-white p-4">
                <Skeleton className="mb-6 h-8 w-32" />
                <div className="space-y-2">
                    {['a', 'b', 'c', 'd', 'e', 'f'].map((id) => (
                        <Skeleton key={id} className="h-9 w-full" />
                    ))}
                </div>
            </div>
            <main className="ml-60 flex-1 p-8">
                <div className="space-y-4">
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-4 w-36" />
                    <div className="mt-6 grid grid-cols-3 gap-4">
                        {['a', 'b', 'c'].map((id) => (
                            <Skeleton key={id} className="h-32 w-full" />
                        ))}
                    </div>
                    <Skeleton className="h-72 w-full" />
                </div>
            </main>
        </div>
    );
}
