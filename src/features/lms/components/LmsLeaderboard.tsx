'use client';

import { useState, useTransition } from 'react';
import { cn } from '@/shared/lib/utils';
import type { LeaderboardData, LeaderboardEntry } from '@/features/lms/actions/gamification';
import { toggleLeaderboardOptOut } from '@/features/lms/actions/gamification';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Trophy, Medal, EyeOff, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const RANK_ICONS = [
    <Trophy key={1} size={16} className="text-amber-500" />,
    <Medal key={2} size={16} className="text-slate-400" />,
    <Medal key={3} size={16} className="text-amber-700" />,
];

function initials(name: string, lastname: string): string {
    return `${name[0] ?? ''}${lastname[0] ?? ''}`.toUpperCase();
}

interface EntryRowProps {
    entry: LeaderboardEntry;
    isLast: boolean;
}

function EntryRow({ entry, isLast }: EntryRowProps) {
    const rankIcon = entry.rank <= 3 ? RANK_ICONS[entry.rank - 1] : null;

    return (
        <div
            className={cn(
                'flex items-center gap-3 px-5 py-3.5',
                !isLast && 'border-b border-border',
                entry.isCurrentUser && 'bg-primary/5',
            )}
        >
            <div className="flex w-7 shrink-0 items-center justify-center">
                {rankIcon ?? (
                    <span className="text-mute font-mono text-sm font-bold">{entry.rank}</span>
                )}
            </div>

            <div
                className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    entry.isCurrentUser ? 'bg-primary text-white' : 'bg-paper text-ink-dim',
                )}
            >
                {entry.isAnonymous ? '?' : initials(entry.name, entry.lastname)}
            </div>

            <div className="min-w-0 flex-1">
                <p
                    className={cn(
                        'text-sm font-semibold',
                        entry.isCurrentUser ? 'text-primary' : 'text-ink',
                        entry.isAnonymous && 'text-mute italic',
                    )}
                >
                    {entry.isAnonymous ? 'Estudiante anónimo' : `${entry.name} ${entry.lastname}`}
                    {entry.isCurrentUser && (
                        <span className="text-mute ml-1 text-xs font-normal">(tú)</span>
                    )}
                </p>
            </div>

            <div className="shrink-0 text-right">
                <span className="text-ink font-bold">{entry.totalPoints}</span>
                <span className="text-mute ml-1 text-xs">pts</span>
            </div>
        </div>
    );
}

interface Props {
    courseId: string;
    data: LeaderboardData;
}

export function LmsLeaderboard({ courseId, data }: Props) {
    const router = useRouter();
    const [optedOut, setOptedOut] = useState(data.currentUserOptedOut);
    const [isPending, startTransition] = useTransition();

    const handleTogglePrivacy = () => {
        startTransition(async () => {
            const result = await toggleLeaderboardOptOut(courseId);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            setOptedOut(result.data?.optedOut ?? false);
            router.refresh();
            toast.success(
                result.data?.optedOut
                    ? 'Tu nombre ya no aparece en el ranking'
                    : 'Ahora apareces en el ranking',
            );
        });
    };

    if (data.entries.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center border-dashed py-16">
                <Trophy size={40} className="text-mute/30 mb-4" />
                <p className="text-ink font-medium">Sin participantes todavía</p>
                <p className="text-mute mt-1 text-sm">
                    El ranking aparecerá cuando haya puntos registrados.
                </p>
            </Card>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <p className="text-mute text-sm">
                    {data.currentUserRank !== null ? (
                        <>
                            Tu posición:{' '}
                            <span className="text-ink font-bold">#{data.currentUserRank}</span>
                        </>
                    ) : (
                        'No apareces en el ranking'
                    )}
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTogglePrivacy}
                    disabled={isPending}
                    className="gap-1.5 text-xs"
                >
                    {isPending ? (
                        <Loader2 size={13} className="animate-spin" />
                    ) : optedOut ? (
                        <Eye size={13} />
                    ) : (
                        <EyeOff size={13} />
                    )}
                    {optedOut ? 'Mostrar mi nombre' : 'Ocultar mi nombre'}
                </Button>
            </div>

            <Card className="overflow-hidden">
                {data.entries.map((entry, idx) => (
                    <EntryRow
                        key={entry.userId}
                        entry={entry}
                        isLast={idx === data.entries.length - 1}
                    />
                ))}
            </Card>
        </div>
    );
}
