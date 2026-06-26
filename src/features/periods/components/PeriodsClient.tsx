'use client';

import {
    createPeriod,
    updatePeriod,
    deletePeriod,
    setActivePeriod,
} from '@/features/periods/actions/mutations';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { Tag } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { Edit2, Loader2, Plus, Trash2, CalendarDays, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { PERIOD_TYPES } from '../schemas/period.schemas';

import type { AcademicPeriod } from '@prisma/client';

interface Props {
    slug: string;
    periods: AcademicPeriod[];
    canMutate: boolean;
}

export function PeriodsClient({ slug, periods, canMutate }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isDelOpen, setIsDelOpen] = useState(false);
    const [editing, setEditing] = useState<AcademicPeriod | null>(null);
    const [toDelete, setToDelete] = useState<AcademicPeriod | null>(null);

    const [year, setYear] = useState<string>(new Date().getFullYear().toString());
    const [type, setType] = useState<string>('SEMESTRE');
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isActive, setIsActive] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const openCreate = (): void => {
        setEditing(null);
        setYear(new Date().getFullYear().toString());
        setType('SEMESTRE');
        setName(`${new Date().getFullYear()} - Semestre`);
        setStartDate('');
        setEndDate('');
        setIsActive(periods.length === 0);
        setError(null);
        setIsOpen(true);
    };

    const openEdit = (p: AcademicPeriod): void => {
        setEditing(p);
        setYear(p.year.toString());
        setType(p.type);
        setName(p.name);
        setStartDate(p.startDate ? (new Date(p.startDate).toISOString().split('T')[0] ?? '') : '');
        setEndDate(p.endDate ? (new Date(p.endDate).toISOString().split('T')[0] ?? '') : '');
        setIsActive(p.isActive);
        setError(null);
        setIsOpen(true);
    };

    const openDelete = (p: AcademicPeriod): void => {
        setToDelete(p);
        setDeleteError(null);
        setIsDelOpen(true);
    };

    const handleSave = (): void => {
        if (!name.trim()) {
            setError('El nombre es requerido.');
            return;
        }
        const payload = {
            name,
            year: Number.parseInt(year, 10),
            type,
            startDate: startDate ? startDate : null,
            endDate: endDate ? endDate : null,
            isActive,
        };

        startTransition(async () => {
            const result = editing
                ? await updatePeriod(slug, editing.id, payload)
                : await createPeriod(slug, payload);

            if (result.error) {
                setError(result.error);
                return;
            }
            setIsOpen(false);
            toast.success(editing ? 'Período actualizado' : 'Período creado');
            router.refresh();
        });
    };

    const handleDelete = (): void => {
        if (!toDelete) return;
        startTransition(async () => {
            const result = await deletePeriod(slug, toDelete.id);
            if (result.error) {
                setDeleteError(result.error);
                return;
            }
            setIsDelOpen(false);
            toast.success('Período eliminado');
            router.refresh();
        });
    };

    const handleSetActive = (p: AcademicPeriod): void => {
        startTransition(async () => {
            const result = await setActivePeriod(slug, p.id, p.year);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Período marcado como activo');
            router.refresh();
        });
    };

    const handleTypeChange = (newType: string) => {
        setType(newType);
        if (!editing) {
            const typeLabel = newType.charAt(0).toUpperCase() + newType.slice(1).toLowerCase();
            setName(`${year} - ${typeLabel}`);
        }
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newYear = e.target.value;
        setYear(newYear);
        if (!editing) {
            const typeLabel = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
            setName(`${newYear} - ${typeLabel}`);
        }
    };

    return (
        <>
            <main className="flex-1 overflow-auto p-8">
                {periods.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <CalendarDays size={48} className="text-mute/20 mb-4" />
                        <p className="text-ink text-lg font-medium">Todavía no hay períodos</p>
                        <p className="text-mute mt-1 text-sm">
                            Crea el primero para empezar a organizar los ciclos académicos.
                        </p>
                        {canMutate && (
                            <Button
                                variant="primary"
                                size="md"
                                onClick={openCreate}
                                className="mt-6"
                            >
                                <Plus size={16} />
                                Nuevo período
                            </Button>
                        )}
                    </Card>
                ) : (
                    <Card className="border-border overflow-hidden bg-white shadow-sm">
                        <div className="border-border flex items-center justify-between border-b px-6 py-4">
                            <h2 className="text-ink font-display text-xl font-bold">
                                Períodos Académicos
                            </h2>
                            {canMutate && (
                                <Button variant="primary" size="sm" onClick={openCreate}>
                                    <Plus size={14} className="mr-1" /> Nuevo período
                                </Button>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-paper border-border border-b">
                                    <tr>
                                        <th className="text-mute px-6 py-3 text-left font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                            Nombre
                                        </th>
                                        <th className="text-mute px-6 py-3 text-left font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                            Año
                                        </th>
                                        <th className="text-mute px-6 py-3 text-left font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                            Tipo
                                        </th>
                                        <th className="text-mute px-6 py-3 text-left font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                            Fechas
                                        </th>
                                        <th className="text-mute px-6 py-3 text-center font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                            Estado
                                        </th>
                                        {canMutate && <th className="px-6 py-3" />}
                                    </tr>
                                </thead>
                                <tbody className="divide-border divide-y">
                                    {periods.map((p) => (
                                        <tr
                                            key={p.id}
                                            className="hover:bg-paper-warm/30 transition-colors"
                                        >
                                            <td className="text-ink px-6 py-4 font-semibold">
                                                {p.name}
                                            </td>
                                            <td className="text-mute px-6 py-4">{p.year}</td>
                                            <td className="text-mute px-6 py-4">{p.type}</td>
                                            <td className="text-mute px-6 py-4 text-xs">
                                                {p.startDate
                                                    ? new Date(p.startDate).toLocaleDateString(
                                                          'es-CL',
                                                      )
                                                    : '—'}
                                                {' a '}
                                                {p.endDate
                                                    ? new Date(p.endDate).toLocaleDateString(
                                                          'es-CL',
                                                      )
                                                    : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {p.isActive ? (
                                                    <Tag tone="success" className="font-bold">
                                                        <CheckCircle2
                                                            size={12}
                                                            className="mr-1 inline"
                                                        />{' '}
                                                        Activo
                                                    </Tag>
                                                ) : (
                                                    <Tag tone="default">Inactivo</Tag>
                                                )}
                                            </td>
                                            {canMutate && (
                                                <td className="px-6 py-4 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-sm"
                                                                className="text-mute border-0"
                                                            >
                                                                <Edit2 size={14} />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {!p.isActive && (
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleSetActive(p)
                                                                    }
                                                                    className="cursor-pointer gap-2 py-2"
                                                                >
                                                                    <CheckCircle2 size={14} />{' '}
                                                                    Marcar como activo
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                onClick={() => openEdit(p)}
                                                                className="cursor-pointer gap-2 py-2"
                                                            >
                                                                <Edit2 size={14} /> Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => openDelete(p)}
                                                                className="text-destructive cursor-pointer gap-2 py-2"
                                                            >
                                                                <Trash2 size={14} /> Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </main>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="border-border rounded-[22px] shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl">
                            {editing ? 'Editar período' : 'Nuevo período'}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulario de período
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="period-form-year"
                                    className="text-ink text-[13px] font-bold"
                                >
                                    Año
                                </label>
                                <Input
                                    id="period-form-year"
                                    type="number"
                                    value={year}
                                    onChange={handleYearChange}
                                    className="border-border h-11 rounded-[10px] bg-white"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-ink text-[13px] font-bold">Tipo</span>
                                <Select value={type} onValueChange={handleTypeChange}>
                                    <SelectTrigger className="border-border h-11 rounded-[10px] bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PERIOD_TYPES.map((t) => (
                                            <SelectItem key={t} value={t}>
                                                {t}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="period-form-name"
                                className="text-ink text-[13px] font-bold"
                            >
                                Nombre del período
                            </label>
                            <Input
                                id="period-form-name"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setError(null);
                                }}
                                className={cn(
                                    'border-border h-11 rounded-[10px] bg-white',
                                    error && 'border-destructive',
                                )}
                            />
                            {error && (
                                <p className="text-destructive text-xs font-medium">{error}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="period-form-start"
                                    className="text-ink text-[13px] font-bold"
                                >
                                    Inicio (opcional)
                                </label>
                                <Input
                                    id="period-form-start"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="border-border h-11 rounded-[10px] bg-white"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="period-form-end"
                                    className="text-ink text-[13px] font-bold"
                                >
                                    Fin (opcional)
                                </label>
                                <Input
                                    id="period-form-end"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="border-border h-11 rounded-[10px] bg-white"
                                />
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is-active"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-[var(--g-accent)] focus:ring-[var(--g-accent)]"
                            />
                            <label htmlFor="is-active" className="text-ink text-[13px] font-medium">
                                Marcar como período activo
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            size="md"
                            onClick={() => setIsOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button variant="ink" size="md" disabled={isPending} onClick={handleSave}>
                            {isPending && <Loader2 className="mr-2 animate-spin" />}
                            {editing ? 'Guardar' : 'Crear'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDelOpen} onOpenChange={setIsDelOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">
                            Eliminar período
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de eliminar <strong>{toDelete?.name}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && (
                        <p className="bg-danger-wash text-destructive rounded-[10px] px-4 py-2 text-sm">
                            {deleteError}
                        </p>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isPending}
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isPending && <Loader2 className="mr-2 animate-spin" size={14} />}{' '}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
