import { Skeleton } from '@/shared/components/ui/skeleton';

export default function ExamLoading() {
    return (
        <div className="bg-paper flex min-h-screen flex-col">
            <div className="border-border border-b bg-white px-6 py-4">
                <div className="mx-auto flex max-w-3xl items-center justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-20" />
                </div>
            </div>
            <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-6">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <div className="space-y-3 pt-4">
                    {['a', 'b', 'c', 'd'].map((id) => (
                        <Skeleton key={id} className="h-14 w-full rounded-[12px]" />
                    ))}
                </div>
                <div className="flex justify-between pt-4">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </main>
        </div>
    );
}
