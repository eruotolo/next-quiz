import { Skeleton } from '@/shared/components/ui/skeleton';

export default function ConfiguracionLoading() {
    return (
        <div className="mx-auto flex max-w-xl flex-col gap-6">
            <div>
                <Skeleton className="mb-2 h-3 w-24" />
                <Skeleton className="h-8 w-48" />
                <Skeleton className="mt-2 h-4 w-72" />
            </div>
            <Skeleton className="h-24 w-full rounded-[16px]" />
            <Skeleton className="h-72 w-full rounded-[16px]" />
            <Skeleton className="h-12 w-full rounded-[12px]" />
        </div>
    );
}
