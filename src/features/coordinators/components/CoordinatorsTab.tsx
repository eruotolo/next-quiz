'use client';

import { Loader2, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
    assignCoordinator,
    removeCoordinator,
} from '@/features/coordinators/actions/mutations';
import type { ProfessorOption } from '@/features/coordinators/actions/queries';
import { Button } from '@/shared/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/components/ui/table';

export interface CoordinatorRow {
    id: string;
    userId: string;
    name: string;
}

interface Props {
    slug: string;
    programId: string;
    coordinators: CoordinatorRow[];
    /** Profesores de la institución, elegibles como Jefes de Carrera. */
    professors: ProfessorOption[];
    canMutate: boolean;
}

export function CoordinatorsTab({ slug, programId, coordinators, professors, canMutate }: Props) {
    const router = useRouter();
    const [selected, setSelected] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const assignedIds = new Set(coordinators.map((c) => c.userId));
    const available = professors.filter((p) => !assignedIds.has(p.id));

    const handleAssign = (): void => {
        if (!selected) {
            setError('Selecciona un profesor.');
            return;
        }
        startTransition(async () => {
            const result = await assignCoordinator(slug, programId, { userId: selected });
            if (result.error) {
                setError(result.error);
                return;
            }
            setSelected('');
            setError(null);
            toast.success('Jefe de Carrera asignado');
            router.refresh();
        });
    };

    const handleRemove = (userId: string): void => {
        startTransition(async () => {
            const result = await removeCoordinator(slug, programId, userId);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Jefe de Carrera removido');
            router.refresh();
        });
    };

    return (
        <div className="flex flex-col gap-4">
            {canMutate && (
                <div className="border-border bg-paper-warm/40 flex flex-col gap-2 rounded-[14px] border p-4">
                    <span className="text-ink text-[13px] font-bold">Asignar Jefe de Carrera</span>
                    <div className="flex items-center gap-2">
                        <Select
                            value={selected}
                            onValueChange={(v) => {
                                setSelected(v);
                                setError(null);
                            }}
                        >
                            <SelectTrigger className="border-border h-11 flex-1 rounded-[10px] bg-white">
                                <SelectValue placeholder="Selecciona un profesor" />
                            </SelectTrigger>
                            <SelectContent className="border-border rounded-xl shadow-xl">
                                {available.length === 0 ? (
                                    <div className="text-mute px-3 py-2 text-[12px]">
                                        No hay profesores disponibles
                                    </div>
                                ) : (
                                    available.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name} {p.lastname}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="ink"
                            size="md"
                            disabled={isPending || !selected}
                            onClick={handleAssign}
                        >
                            {isPending ? (
                                <Loader2 size={15} className="animate-spin" />
                            ) : (
                                <Plus size={16} />
                            )}
                            Asignar
                        </Button>
                    </div>
                    {error && <p className="text-destructive text-xs font-medium">{error}</p>}
                </div>
            )}

            {coordinators.length === 0 ? (
                <div className="text-mute flex flex-col items-center gap-2 py-10 text-center">
                    <ShieldCheck size={36} className="text-mute/20" />
                    <p className="text-sm">Sin Jefes de Carrera asignados.</p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Profesor</TableHead>
                            {canMutate && <TableHead className="w-12" />}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {coordinators.map((c) => (
                            <TableRow key={c.id}>
                                <TableCell className="font-semibold text-ink">{c.name}</TableCell>
                                {canMutate && (
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="text-destructive h-8 w-8 border-0"
                                            disabled={isPending}
                                            onClick={() => handleRemove(c.userId)}
                                            aria-label="Quitar coordinador"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
