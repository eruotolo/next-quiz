'use client';

import {
    createStudentGlobal,
    deleteStudentGlobal,
    updateStudentGlobal,
    type GlobalStudentRow,
} from '@/features/students/actions/global';
import type { InstitutionRow } from '@/features/institutions/actions/queries';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
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
import { Input } from '@/shared/components/ui/input';
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
import { TablePaginator } from '@/shared/components/ui/table-paginator';
import { Avatar } from '@/shared/components/ui/avatar';
import { Tag } from '@/shared/components/ui/badge';
import { RutField } from '@/shared/components/ui/rut-field';
import { formatRut } from '@/shared/lib/rut';
import type { PaginatedResult } from '@/shared/types/pagination';
import {
    Loader2,
    Pencil,
    Plus,
    Trash2,
    Users,
    Search,
    Building2,
    MoreHorizontal,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

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
}) {
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

    function handleSubmit(e: FormEvent): void {
        e.preventDefault();
        onSubmit(form);
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="gstu-name" className="text-ink text-[13px] font-bold">
                        Nombre
                    </label>
                    <Input
                        id="gstu-name"
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="border-border h-11 rounded-[10px] bg-white"
                        required
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="gstu-lastname" className="text-ink text-[13px] font-bold">
                        Apellido
                    </label>
                    <Input
                        id="gstu-lastname"
                        value={form.lastname}
                        onChange={(e) => handleChange('lastname', e.target.value)}
                        className="border-border h-11 rounded-[10px] bg-white"
                        required
                    />
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="gstu-email" className="text-ink text-[13px] font-bold">
                    Email
                </label>
                <Input
                    id="gstu-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="border-border h-11 rounded-[10px] bg-white"
                    required
                />
            </div>
            <div className="flex flex-col gap-1.5">
                <span className="text-ink text-[13px] font-bold">RUT</span>
                <RutField
                    value={form.rut}
                    onChange={(v) => handleChange('rut', v)}
                    className="border-border h-11 rounded-[10px] bg-white"
                />
            </div>
            <div className="flex flex-col gap-1.5">
                <span className="text-ink text-[13px] font-bold">Institución</span>
                <Select
                    value={form.academicInstitutionId}
                    onValueChange={(v) => handleChange('academicInstitutionId', v)}
                >
                    <SelectTrigger className="border-border h-11 rounded-[10px] bg-white">
                        <SelectValue placeholder="Seleccioná una institución" />
                    </SelectTrigger>
                    <SelectContent className="border-border rounded-xl shadow-xl">
                        {institutions.map((i) => (
                            <SelectItem key={i.id} value={i.id}>
                                {i.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <Button type="submit" disabled={isPending} variant="ink" size="md">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar alumno
                </Button>
            </div>
        </form>
    );
}

export function GlobalStudentsClient({
    result,
    institutions,
    q: initialQ,
    institutionId: initialInstitutionId,
}: Props) {
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

    function handleSearchSubmit(e: FormEvent): void {
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

    return (
        <>
            {/* Header */}
            <AdminTopBar
                breadcrumb={['Sistema', 'Base Global']}
                title="Todos los Estudiantes"
                subtitle={`${result.total} alumnos registrados en la red Aulika`}
                actions={
                    <Button
                        variant="ink"
                        size="md"
                        onClick={() => setCreateOpen(true)}
                        className="gap-2"
                    >
                        <Plus size={16} />
                        Nuevo alumno
                    </Button>
                }
            />

            {/* Filter bar */}
            <div className="border-border flex items-center gap-2 border-b bg-white px-8 py-4">
                <form onSubmit={handleSearchSubmit} className="relative max-w-sm flex-1">
                    <Search className="text-mute absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, RUT o email..."
                        className="border-border h-[38px] bg-white pl-9"
                    />
                </form>

                <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-mute ml-4" />
                    <Select
                        value={institutionFilter || '__all__'}
                        onValueChange={(v) => {
                            const val = v === '__all__' ? '' : v;
                            setInstitutionFilter(val);
                            pushUrl({ institutionId: val, page: 1 });
                        }}
                    >
                        <SelectTrigger className="border-border h-[38px] w-52 bg-white">
                            <SelectValue placeholder="Todas las instituciones" />
                        </SelectTrigger>
                        <SelectContent className="border-border rounded-xl shadow-xl">
                            <SelectItem value="__all__">Todas las instituciones</SelectItem>
                            {institutions.map((i) => (
                                <SelectItem key={i.id} value={i.id}>
                                    {i.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1" />
                <span className="text-mute font-mono text-[11px] tracking-wider uppercase">
                    {result.total} resultados
                </span>
            </div>

            <main className="flex-1 overflow-auto p-8">
                {result.items.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <Users size={48} className="text-mute/20 mb-4" />
                        <p className="text-ink text-lg font-medium">No hay alumnos encontrados</p>
                        <p className="text-mute mt-1 text-sm">
                            Ajusta los filtros o crea un nuevo registro.
                        </p>
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => setCreateOpen(true)}
                            className="mt-6"
                        >
                            <Plus size={16} />
                            Nuevo alumno
                        </Button>
                    </Card>
                ) : (
                    <Card className="border-border overflow-visible p-0 shadow-sm">
                        <Table>
                            <TableHeader className="bg-paper">
                                <TableRow className="border-border border-b hover:bg-transparent">
                                    <TableHead>Estudiante</TableHead>
                                    <TableHead className="w-[160px]">RUT</TableHead>
                                    <TableHead className="w-[200px]">Institución</TableHead>
                                    <TableHead className="w-[120px]">Grupo</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {result.items.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className="group border-border h-16 border-b last:border-0"
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={`${row.name} ${row.lastname}`}
                                                    size={32}
                                                    className="ring-border shadow-sm ring-1"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-ink text-[13.5px] leading-tight font-bold">
                                                        {row.name} {row.lastname}
                                                    </span>
                                                    <span className="text-mute text-[11.5px]">
                                                        {row.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-mute font-mono text-[12px]">
                                            {formatRut(row.rut)}
                                        </TableCell>
                                        <TableCell>
                                            {row.institution ? (
                                                <div className="flex items-center gap-2">
                                                    <Building2
                                                        size={12}
                                                        className="text-primary/60"
                                                    />
                                                    <span className="text-ink-dim text-[12.5px] font-medium">
                                                        {row.institution.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-mute text-[11.5px]">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {row.group ? (
                                                <Tag
                                                    tone="outline"
                                                    className="border-border bg-paper-warm/50 h-5 font-mono text-[10px]"
                                                >
                                                    {row.group.name}
                                                </Tag>
                                            ) : (
                                                <span className="text-mute text-[11.5px]">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="h-9 w-9"
                                                    >
                                                        <MoreHorizontal
                                                            size={18}
                                                            className="text-mute"
                                                        />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="border-border w-44 rounded-xl shadow-xl"
                                                >
                                                    <DropdownMenuItem
                                                        onClick={() => setEditRow(row)}
                                                        className="cursor-pointer gap-2 py-2.5"
                                                    >
                                                        <Pencil size={14} /> Editar datos
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteRow(row)}
                                                        className="text-destructive focus:bg-danger-wash focus:text-destructive cursor-pointer gap-2 py-2.5"
                                                    >
                                                        <Trash2 size={14} /> Eliminar registro
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <TablePaginator
                            page={result.page}
                            perPage={result.perPage}
                            total={result.total}
                            onPageChange={(p) => pushUrl({ page: p })}
                        />
                    </Card>
                )}
            </main>

            {/* Create dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="border-border max-w-lg overflow-hidden rounded-[22px] p-0 shadow-2xl">
                    <div className="border-border bg-paper border-b px-6 py-5">
                        <DialogTitle className="font-display text-ink text-2xl">
                            Nuevo alumno
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulario para registrar un nuevo alumno.
                        </DialogDescription>
                    </div>
                    <div className="px-6">
                        <StudentForm
                            institutions={institutions}
                            onSubmit={handleCreate}
                            isPending={isPending}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit dialog */}
            <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
                <DialogContent className="border-border max-w-lg overflow-hidden rounded-[22px] p-0 shadow-2xl">
                    <div className="border-border bg-paper border-b px-6 py-5">
                        <DialogTitle className="font-display text-ink text-2xl">
                            Editar alumno
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulario para editar los datos del alumno.
                        </DialogDescription>
                    </div>
                    <div className="px-6">
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
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
                <DialogContent className="border-border rounded-[22px] shadow-2xl sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="font-display text-destructive text-2xl">
                            Eliminar alumno
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Confirmación para eliminar el alumno de forma permanente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-ink-dim text-[14px] leading-relaxed">
                            ¿Estás seguro de eliminar a{' '}
                            <strong className="text-ink">
                                {deleteRow?.name} {deleteRow?.lastname}
                            </strong>
                            ? Esta acción es irreversible.
                        </p>
                    </div>
                    <DialogFooter className="mt-2 gap-2 sm:justify-end">
                        <Button
                            variant="ghost"
                            size="md"
                            onClick={() => setDeleteRow(null)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            size="md"
                            onClick={handleDelete}
                            disabled={isPending}
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
