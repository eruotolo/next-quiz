import { Skeleton } from '@/shared/components/ui/skeleton';

export default function ConfigSettingsLoading(): React.JSX.Element {
    return (
        <div className="space-y-6 p-8">
            <div className="space-y-2">
                <Skeleton className="h-8 w-44" />
                <Skeleton className="h-4 w-64" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </div>
    );
}
