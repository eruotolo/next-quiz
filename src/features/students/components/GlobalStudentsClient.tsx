'use client';

import {
    createStudentGlobal,
    deleteStudentGlobal,
    updateStudentGlobal,
    type GlobalStudentRow,
} from '@/features/students/actions/global';
import type { InstitutionRow } from '@/features/institutions/actions/queries';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { RutField } from '@/shared/components/rut-field';
import { formatRut } from '@/shared/lib/rut';
import type { PaginatedResult } from '@/shared/types/pagination';
import { Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

interface StudentFormData {
    name: string;
    lastname: string;
    rut: string;
    email: string;
    academicInstitutionId: string;
    groupId?: string;
}

interface Props {
    result: PaginatedResult<GlobalStudentRow>;
    institutions: Pick<InstitutionRow, 'id' | 'name'>[];
    q: string;
    institutionId: string;
}

function StudentForm({
    defaultValues,
    institutions,
    onSubmit,
    isPending,
}: {
    defaultValues?: Partial<StudentFormData>;
    institutions: Props['institutions'];
    onSubmit: (data: StudentFormData) => void;
    isPending: boolean;
}): React.JSX.Element {
    const [form, setForm] = useState<StudentFormData>({
        name: defaultValues?.name ?? '',
        lastname: defaultValues?.lastname ?? '',
        rut: defaultValues?.rut ?? '',
        email: defaultValues?.email ?? '',
        academicInstitutionId: defaultValues?.academicInstitutionId ?? '',
        groupId: defaultValues?.groupId,
    });

    function handleChange(field: keyof StudentFormData, value: string): void {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    function handleSubmit(e: React.FormEvent): void {
        e.preventDefault();
        onSubmit(form);
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <Label>Nombre</Label>
                    <Input
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        required
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <Label>Apellido</Label>
                    <Input
                        value={form.lastname}
                        onChange={(e) => handleChange('lastname', e.target.value)}
                        required
                    />
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <Label>Email</Label>
                <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                />
            </div>
            <div className="flex flex-col gap-1">
                <Label>RUT</Label>
                <RutField
                    value={form.rut}
                    onChange={(v) => handleChange('rut', v)}
                />
            </div>
            <div className="flex flex-col gap-1">
                <Label>Institución</Label>
                <Select
                    value={form.academicInstitutionId}
                    onValueChange={(v) => handleChange('academicInstitutionId', v)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccioná una institución" />
                    </SelectTrigger>
                    <SelectContent>
                        {institutions.map((i) => (
                            <SelectItem key={i.id} value={i.id}>
                                {i.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button type="submit" disabled={isPending} className="self-end">
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Guardar
            </Button>
        </form>
    );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: CRUD table with institution filter
export function GlobalStudentsClient({ result, institutions, q: initialQ, institutionId: initialInstitutionId }: Props): React.JSX.Element {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [search, setSearch] = useState(initialQ);
    const [institutionFilter, setInstitutionFilter] = useState(initialInstitutionId);
    const [createOpen, setCreateOpen] = useState(false);
    const [editRow, setEditRow] = useState<GlobalStudentRow | null>(null);
    const [deleteRow, setDeleteRow] = useState<GlobalStudentRow | null>(null);

    function pushUrl(params: { q?: string; institutionId?: string; page?: number }): void {
        const sp = new URLSearchParams();
        const q = params.q ?? search;
        const iid = params.institutionId ?? institutionFilter;
        if (q) sp.set('q', q);
        if (iid) sp.set('institutionId', iid);
        if (params.page && params.page > 1) sp.set('page', String(params.page));
        router.push(`/config/students?${sp.toString()}`);
    }

    function handleSearchSubmit(e: React.FormEvent): void {
        e.preventDefault();
        pushUrl({ q: search, page: 1 });
    }

    function handleCreate(data: StudentFormData): void {
        startTransition(async () => {
            const res = await createStudentGlobal(data);
            if (res.error) {
                toast.error(res.error);
                return;
            }
            toast.success('Alumno creado');
            setCreateOpen(false);
            router.refresh();
        });
    }

    function handleUpdate(data: StudentFormData): void {
        if (!editRow) return;
        startTransition(async () => {
            const res = await updateStudentGlobal(editRow.id, data);
            if (res.error) {
                toast.error(res.error);
                return;
            }
            toast.success('Alumno actualizado');
            setEditRow(null);
            router.refresh();
        });
    }

    function handleDelete(): void {
        if (!deleteRow) return;
        startTransition(async () => {
            const res = await deleteStudentGlobal(deleteRow.id);
            if (res.error) {
                toast.error(res.error);
                return;
            }
            toast.success('Alumno eliminado');
            setDeleteRow(null);
            router.refresh();
        });
    }

    const columns: ColumnDef<GlobalStudentRow>[] = [
        {
            key: 'name',
            header: 'Nombre',
            render: (row) => (
                <span className="font-medium">{row.name} {row.lastname}</span>
            ),
        },
        {
            key: 'rut',
            header: 'RUT',
            render: (row) => <code className="text-xs">{formatRut(row.rut)}</code>,
        },
        {
            key: 'email',
            header: 'Email',
            render: (row) => row.email,
        },
        {
            key: 'institution',
            header: 'Institución',
            render: (row) => row.institution ? (
                <Badge variant="secondary">{row.institution.name}</Badge>
            ) : '—',
        },
        {
            key: 'group',
            header: 'Grupo',
            render: (row) => row.group?.name ?? '—',
        },
        {
            key: 'actions',
            header: '',
            render: (row) => (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditRow(row)}
                    >
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
                    <h1 className="text-2xl font-semibold">Alumnos</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {result.total} alumno{result.total !== 1 ? 's' : ''} registrado{result.total !== 1 ? 's' : ''} en la plataforma
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo alumno
                </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, RUT o email..."
                        className="w-72"
                    />
                    <Button type="submit" variant="secondary" size="sm">
                        Buscar
                    </Button>
                </form>
                <Select
                    value={institutionFilter || '__all__'}
                    onValueChange={(v) => {
                        const val = v === '__all__' ? '' : v;
                        setInstitutionFilter(val);
                        pushUrl({ institutionId: val, page: 1 });
                    }}
                >
                    <SelectTrigger className="w-52">
                        <SelectValue placeholder="Todas las instituciones" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Todas las instituciones</SelectItem>
                        {institutions.map((i) => (
                            <SelectItem key={i.id} value={i.id}>
                                {i.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {result.items.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                        <Users className="h-10 w-10 opacity-30" />
                        <p className="text-sm">No hay alumnos registrados.</p>
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
                    emptyMessage="No se encontraron alumnos."
                />
            )}

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Nuevo alumno</DialogTitle>
                    </DialogHeader>
                    <StudentForm
                        institutions={institutions}
                        onSubmit={handleCreate}
                        isPending={isPending}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar alumno</DialogTitle>
                    </DialogHeader>
                    {editRow && (
                        <StudentForm
                            defaultValues={{
                                name: editRow.name,
                                lastname: editRow.lastname,
                                rut: formatRut(editRow.rut),
                                email: editRow.email,
                                academicInstitutionId: editRow.institution?.id ?? '',
                                groupId: editRow.group?.id,
                            }}
                            institutions={institutions}
                            onSubmit={handleUpdate}
                            isPending={isPending}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Eliminar alumno</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        ¿Confirmás la eliminación de{' '}
                        <strong>{deleteRow?.name} {deleteRow?.lastname}</strong>? Esta acción no se puede deshacer.
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
