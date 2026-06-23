import { Skeleton } from '@/shared/components/ui/skeleton';

export default function LiveResultsLoading(): React.JSX.Element {
    return (
        <div className="bg-paper flex min-h-screen flex-col">
            <div className="border-border border-b bg-white p-6">
                <Skeleton className="mb-2 h-7 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
            <main className="flex-1 space-y-6 p-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {['a', 'b', 'c'].map((id) => (
                        <Skeleton key={id} className="h-28 w-full" />
                    ))}
                </div>
                <Skeleton className="h-10 w-full" />
                <div className="space-y-3">
                    {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => (
                        <Skeleton key={id} className="h-14 w-full" />
                    ))}
                </div>
            </main>
        </div>
    );
}
