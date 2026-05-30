import { Skeleton } from '@/shared/components/ui/skeleton';

export default function ExamEditorLoading(): React.JSX.Element {
    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-40" />
                </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                <div className="space-y-4">
                    {['a', 'b', 'c', 'd'].map((id) => (
                        <Skeleton key={id} className="h-32 w-full rounded-[16px]" />
                    ))}
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-40 w-full rounded-[16px]" />
                    <Skeleton className="h-24 w-full rounded-[16px]" />
                </div>
            </div>
        </div>
    );
}
