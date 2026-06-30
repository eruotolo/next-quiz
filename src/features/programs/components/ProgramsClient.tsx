'use client';

import { Edit2, FolderKanban, Loader2, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createProgram, deleteProgram, updateProgram } from '@/features/programs/actions/mutations';
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
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Input } from '@/shared/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/components/ui/table';
import { TablePaginator } from '@/shared/components/ui/table-paginator';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';

export interface ProgramRow {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    groupsCount: number;
    coursesCount: number;
    coordinatorsCount: number;
}

interface Props {
    slug: string;
    programs: ProgramRow[];
    canMutate: boolean;
    /** Label dinámico singular ("Carrera" / "Nivel" / "Área"…). */
    label: string;
    /** Label dinámico plural ("Carreras" / "Niveles"…). */
    labelPlural: string;
    isDemo?: boolean;
}

const PER_PAGE = 10;

export function ProgramsClient({ slug, programs, canMutate, label, labelPlural, isDemo }: Props) {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [isOpen, setIsOpen] = useState(false);
    const [isDelOpen, setIsDelOpen] = useState(false);
    const [editing, setEditing] = useState<ProgramRow | null>(null);
    const [toDelete, setToDelete] = useState<ProgramRow | null>(null);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const pageItems = useMemo(
        () => programs.slice((page - 1) * PER_PAGE, page * PER_PAGE),
        [programs, page],
    );

    const openCreate = (): void => {
        setEditing(null);
        setName('');
        setCode('');
        setDescription('');
        setError(null);
        setIsOpen(true);
    };
    const openEdit = (p: ProgramRow): void => {
        setEditing(p);
        setName(p.name);
        setCode(p.code ?? '');
        setDescription(p.description ?? '');
        setError(null);
        setIsOpen(true);
    };
    const openDelete = (p: ProgramRow): void => {
        setToDelete(p);
        setDeleteError(null);
        setIsDelOpen(true);
    };

    const handleSave = (): void => {
        if (!name.trim()) {
            setError('El nombre es requerido.');
            return;
        }
        const payload = { name: name.trim(), code: code.trim(), description: description.trim() };
        startTransition(async () => {
            const result = editing
                ? await updateProgram(slug, editing.id, payload)
                : await createProgram(slug, payload);
            if (result.error) {
                setError(result.error);
                return;
            }
            setIsOpen(false);
            toast.success(editing ? `${label} actualizada` : `${label} creada`);
            router.refresh();
        });
    };

    const handleDelete = (): void => {
        if (!toDelete) return;
        startTransition(async () => {
            const result = await deleteProgram(slug, toDelete.id);
            if (result.error) {
                setDeleteError(result.error);
                return;
            }
            setIsDelOpen(false);
            toast.success(`${label} eliminada`);
            router.refresh();
        });
    };

    return (
        <>
            {/* ── Subheader ── */}
            <div className="border-border flex items-center gap-3 border-b bg-white px-8 py-4">
                <span className="text-mute font-mono text-[11px] font-bold tracking-wider uppercase">
                    {programs.length} {labelPlural.toLowerCase()}
                </span>
                <div className="flex-1" />
                {canMutate && (
                    <Button variant="ink" size="md" onClick={openCreate} className="gap-2">
                        <Plus size={16} />
                        Crear {label.toLowerCase()}
                    </Button>
                )}
            </div>
            <main className="flex-1 overflow-auto p-8">
                {programs.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <FolderKanban size={48} className="text-mute/20 mb-4" />
                        <p className="text-ink text-lg font-medium">
                            Todavía no hay {labelPlural.toLowerCase()}
                        </p>
                        <p className="text-mute mt-1 text-sm">
                            Crea la primera para organizar la jerarquía académica.
                        </p>
                    </Card>
                ) : (
                    <Card
                        data-tour="programs-list"
                        className="border-border overflow-hidden bg-white p-0 shadow-sm"
                    >
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Código</TableHead>
                                    <TableHead className="text-center">Grupos</TableHead>
                                    <TableHead className="text-center">Materias</TableHead>
                                    <TableHead className="text-center">Coordinadores</TableHead>
                                    {canMutate && <TableHead className="w-12" />}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pageItems.map((p) => (
                                    <TableRow
                                        key={p.id}
                                        className="hover:bg-paper-warm/30 cursor-pointer transition-colors"
                                        onClick={() => router.push(`/${slug}/programs/${p.id}`)}
                                    >
                                        <TableCell className="text-ink font-semibold">
                                            {p.name}
                                            {p.description && (
                                                <span className="text-mute block max-w-md truncate text-[12px] font-normal">
                                                    {p.description}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-mute font-mono text-[12px]">
                                            {p.code ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {p.groupsCount}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {p.coursesCount}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {p.coordinatorsCount}
                                        </TableCell>
                                        {canMutate && (
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            className="text-mute h-8 w-8 border-0"
                                                        >
                                                            <MoreHorizontal size={16} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="border-border rounded-xl shadow-xl"
                                                    >
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
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <TablePaginator
                            page={page}
                            perPage={PER_PAGE}
                            total={programs.length}
                            onPageChange={setPage}
                        />
                    </Card>
                )}
            </main>

            {/* Create/Edit dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="border-border rounded-[22px] shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl">
                            {editing
                                ? `Editar ${label.toLowerCase()}`
                                : `Nueva ${label.toLowerCase()}`}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulario para crear o editar {label.toLowerCase()}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="prog-name" className="text-ink text-[13px] font-bold">
                                Nombre
                            </label>
                            <Input
                                id="prog-name"
                                placeholder="Ej: Ingeniería Civil Informática"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setError(null);
                                }}
                                className={cn(
                                    'border-border h-11 rounded-[10px] bg-white',
                                    error && 'border-destructive',
                                )}
                                autoFocus
                                disabled={isDemo}
                            />
                            {error && (
                                <p className="text-destructive text-xs font-medium">{error}</p>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="prog-code" className="text-ink text-[13px] font-bold">
                                Código (opcional)
                            </label>
                            <Input
                                id="prog-code"
                                placeholder="Ej: ICI"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="border-border h-11 rounded-[10px] bg-white"
                                disabled={isDemo}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="prog-desc" className="text-ink text-[13px] font-bold">
                                Descripción (opcional)
                            </label>
                            <Textarea
                                id="prog-desc"
                                placeholder="Breve descripción"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="border-border rounded-[10px] bg-white"
                                disabled={isDemo}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        {isDemo && (
                            <p className="text-muted-foreground mr-auto text-xs">
                                En modo demo no podés guardar cambios.
                            </p>
                        )}
                        <Button
                            variant="ghost"
                            size="md"
                            onClick={() => setIsOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="ink"
                            size="md"
                            disabled={isPending || isDemo}
                            onClick={handleSave}
                        >
                            {isPending && <Loader2 className="mr-2 animate-spin" />}
                            {editing ? 'Guardar cambios' : `Crear ${label.toLowerCase()}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirm */}
            <AlertDialog open={isDelOpen} onOpenChange={setIsDelOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">
                            Eliminar {label.toLowerCase()}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de eliminar{' '}
                            <strong className="text-ink">{toDelete?.name}</strong>? Las materias y
                            grupos vinculados quedarán sin {label.toLowerCase()} asignada.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && (
                        <p className="bg-danger-wash text-destructive rounded-[10px] px-4 py-2 text-sm font-medium">
                            {deleteError}
                        </p>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isPending || isDemo}
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isPending && <Loader2 className="mr-2 animate-spin" size={14} />}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
