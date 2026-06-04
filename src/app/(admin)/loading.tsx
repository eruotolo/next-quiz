import { Skeleton } from '@/shared/components/ui/skeleton';

export default function AdminLoading(): React.JSX.Element {
    return (
        <div className="bg-paper flex min-h-screen">
            <div className="w-60 shrink-0 border-r bg-white" />
            <main className="ml-60 flex-1 p-8">
                <div className="space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-40" />
                    <div className="mt-6 grid grid-cols-3 gap-4">
                        {['a', 'b', 'c'].map((id) => (
                            <Skeleton key={id} className="h-32 w-full" />
                        ))}
                    </div>
                    <Skeleton className="h-64 w-full" />
                </div>
            </main>
        </div>
    );
}
