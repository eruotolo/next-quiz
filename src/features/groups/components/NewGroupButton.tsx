'use client';

import { getGroupFormData, type GroupFormData } from '@/features/groups/actions/queries';
import { GroupForm } from '@/features/groups/components/GroupForm';
import { Button } from '@/shared/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { useState, useTransition } from 'react';

interface Props {
    slug: string;
}

export function NewGroupButton({ slug }: Props) {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState<GroupFormData | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleOpen = (): void => {
        startTransition(async () => {
            if (!data) {
                setData(await getGroupFormData(slug));
            }
            setOpen(true);
        });
    };

    return (
        <>
            <Button
                variant="ink"
                size="md"
                className="gap-2"
                disabled={isPending}
                onClick={handleOpen}
            >
                {isPending ? (
                    <Loader2 size={15} className="animate-spin" />
                ) : (
                    <Plus size={16} />
                )}
                Nuevo grupo
            </Button>

            {data && (
                <GroupForm
                    slug={slug}
                    open={open}
                    onOpenChange={setOpen}
                    editing={null}
                    professors={data.professors}
                    programs={data.programs}
                    periods={data.periods}
                    courseSections={data.courseSections}
                />
            )}
        </>
    );
}
