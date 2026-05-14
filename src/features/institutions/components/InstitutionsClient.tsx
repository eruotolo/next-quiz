'use client';

import {
    createInstitution,
    deleteInstitution,
    toggleInstitutionActive,
    updateInstitution,
} from '@/features/institutions/actions/mutations';
import type { InstitutionRow } from '@/features/institutions/actions/queries';
import { institutionSchema } from '@/features/institutions/schemas/institution.schemas';
import { DataTable, type ColumnDef } from '@/shared/components/data-table';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import type { PaginatedResult } from '@/shared/types/pagination';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, ExternalLink, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

type InstitutionInput = z.infer<typeof institutionSchema>;

interface Props {
    result: PaginatedResult<InstitutionRow>;
    q: string;
}

function InstitutionForm({
    defaultValues,
    onSubmit,
    isPending,
}: {
    defaultValues?: Partial<InstitutionInput>;
    onSubmit: (data: InstitutionInput) => void;
    isPending: boolean;
}): React.JSX.Element {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<InstitutionInput>({
        resolver: zodResolver(institutionSchema),
        defaultValues: {
            country: 'Chile',
            active: true,
            ...defaultValues,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="slug">Slug</Label>
                    <Input id="slug" {...register('slug')} placeholder="ej: univ-talca" />
                    {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input id="city" {...register('city')} />
                    {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="country">País</Label>
                    <Input id="country" {...register('country')} />
                    {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" {...register('address')} />
                {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" {...register('phone')} />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="campus">Campus (opcional)</Label>
                    <Input id="campus" {...register('campus')} />
                </div>
            </div>
            <Button type="submit" disabled={isPending} className="self-end">
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Guardar
            </Button>
        </form>
    );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: CRUD table with dialogs
export function InstitutionsClient({ result, q: initialQ }: Props): React.JSX.Element {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [search, setSearch] = useState(initialQ);
    const [createOpen, setCreateOpen] = useState(false);
    const [editRow, setEditRow] = useState<InstitutionRow | null>(null);
    const [deleteRow, setDeleteRow] = useState<InstitutionRow | null>(null);

    function pushUrl(params: { q?: string; page?: number }): void {
        const sp = new URLSearchParams();
        const q = params.q ?? search;
        if (q) sp.set('q', q);
        if (params.page && params.page > 1) sp.set('page', String(params.page));
        router.push(`/config/institutions?${sp.toString()}`);
    }

    function handleSearchSubmit(e: React.FormEvent): void {
        e.preventDefault();
        pushUrl({ q: search, page: 1 });
    }

    function handleCreate(data: InstitutionInput): void {
        startTransition(async () => {
            const result = await createInstitution(data);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Institución creada');
            setCreateOpen(false);
            router.refresh();
        });
    }

    function handleUpdate(data: InstitutionInput): void {
        if (!editRow) return;
        startTransition(async () => {
            const result = await updateInstitution(editRow.id, data);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Institución actualizada');
            setEditRow(null);
            router.refresh();
        });
    }

    function handleDelete(): void {
        if (!deleteRow) return;
        startTransition(async () => {
            const result = await deleteInstitution(deleteRow.id);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Institución eliminada');
            setDeleteRow(null);
            router.refresh();
        });
    }

    function handleToggleActive(row: InstitutionRow): void {
        startTransition(async () => {
            const result = await toggleInstitutionActive(row.id, !row.active);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            router.refresh();
        });
    }

    const columns: ColumnDef<InstitutionRow>[] = [
        {
            key: 'name',
            header: 'Nombre',
            render: (row) => <span className="font-medium">{row.name}</span>,
        },
        {
            key: 'slug',
            header: 'Slug',
            render: (row) => <code className="text-xs bg-muted px-1 py-0.5 rounded">{row.slug}</code>,
        },
        {
            key: 'city',
            header: 'Ciudad',
            render: (row) => row.city,
        },
        {
            key: 'users',
            header: 'Usuarios',
            render: (row) => (
                <Badge variant="secondary">{row._count.users}</Badge>
            ),
        },
        {
            key: 'active',
            header: 'Activo',
            render: (row) => (
                <Switch
                    checked={row.active}
                    onCheckedChange={() => handleToggleActive(row)}
                    disabled={isPending}
                />
            ),
        },
        {
            key: 'actions',
            header: '',
            render: (row) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" asChild title="Ir al panel de la institución">
                        <Link href={`/${row.slug}`}>
                            <ExternalLink className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditRow(row)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteRow(row)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Instituciones</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {result.total} institución{result.total !== 1 ? 'es' : ''} registrada{result.total !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva institución
                </Button>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-sm">
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar institución..."
                />
                <Button type="submit" variant="secondary" size="sm">
                    Buscar
                </Button>
            </form>

            {result.items.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                        <Building2 className="h-10 w-10 opacity-30" />
                        <p className="text-sm">No hay instituciones registradas.</p>
                    </CardContent>
                </Card>
            ) : (
                <DataTable
                    columns={columns}
                    rows={result.items}
                    total={result.total}
                    page={result.page}
                    perPage={result.perPage}
                    onPageChange={(p) => pushUrl({ page: p })}
                    keyExtractor={(row) => row.id}
                    emptyMessage="No se encontraron instituciones."
                />
            )}

            {/* Create dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Nueva institución</DialogTitle>
                    </DialogHeader>
                    <InstitutionForm onSubmit={handleCreate} isPending={isPending} />
                </DialogContent>
            </Dialog>

            {/* Edit dialog */}
            <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar institución</DialogTitle>
                    </DialogHeader>
                    {editRow && (
                        <InstitutionForm
                            defaultValues={{ ...editRow, campus: editRow.campus ?? undefined }}
                            onSubmit={handleUpdate}
                            isPending={isPending}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Eliminar institución</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        ¿Confirmás la eliminación de{' '}
                        <strong>{deleteRow?.name}</strong>? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDeleteRow(null)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Eliminar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
