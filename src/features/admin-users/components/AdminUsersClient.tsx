'use client';

import {
    createAdminUser,
    deleteAdminUser,
    updateAdminUser,
} from '@/features/admin-users/actions/mutations';
import type { AdminUserRow } from '@/features/admin-users/actions/queries';
import {
    adminUserCreateSchema,
    adminUserUpdateSchema,
} from '@/features/admin-users/schemas/admin-user.schemas';
import type { InstitutionRow } from '@/features/institutions/actions/queries';
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
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
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
import { USER_ROLE } from '@/shared/lib/roles';
import type { PaginatedResult } from '@/shared/types/pagination';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Eye,
    EyeOff,
    Loader2,
    Pencil,
    Plus,
    Trash2,
    Search,
    Building2,
    MoreHorizontal,
    ShieldCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { cn } from '@/shared/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

type CreateInput = z.infer<typeof adminUserCreateSchema>;
type UpdateInput = z.infer<typeof adminUserUpdateSchema>;

interface Props {
    result: PaginatedResult<AdminUserRow>;
    institutions: Pick<InstitutionRow, 'id' | 'name'>[];
    q: string;
    institutionId: string;
}

const ROLE_LABEL: Record<string, string> = {
    [USER_ROLE.ADMIN]: 'Administrador',
    [USER_ROLE.SUPER_ADMIN]: 'SuperAdministrador',
};

const ROLE_OPTIONS = [
    { value: USER_ROLE.ADMIN, label: 'Administrador' },
    { value: USER_ROLE.SUPER_ADMIN, label: 'SuperAdministrador' },
];

function RoleSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <SearchableSelect
            value={value}
            onChange={onChange}
            options={ROLE_OPTIONS}
            placeholder="Seleccioná un rol"
        />
    );
}

function CreateAdminForm({
    institutions,
    onSubmit,
    isPending,
}: {
    institutions: Props['institutions'];
    onSubmit: (data: CreateInput) => void;
    isPending: boolean;
}) {
    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors },
    } = useForm<CreateInput>({
        resolver: zodResolver(adminUserCreateSchema),
        defaultValues: { role: USER_ROLE.ADMIN },
    });

    const selectedRole = watch('role');
    const isSuperAdmin = selectedRole === USER_ROLE.SUPER_ADMIN;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="create-name" className="text-ink text-[13px] font-bold">
                        Nombre
                    </label>
                    <Input
                        id="create-name"
                        {...register('name')}
                        className={cn(
                            'border-border h-11 rounded-[10px] bg-white',
                            errors.name && 'border-destructive',
                        )}
                    />
                    {errors.name && (
                        <p className="text-destructive text-xs font-medium">
                            {errors.name.message}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="create-lastname" className="text-ink text-[13px] font-bold">
                        Apellido
                    </label>
                    <Input
                        id="create-lastname"
                        {...register('lastname')}
                        className={cn(
                            'border-border h-11 rounded-[10px] bg-white',
                            errors.lastname && 'border-destructive',
                        )}
                    />
                    {errors.lastname && (
                        <p className="text-destructive text-xs font-medium">
                            {errors.lastname.message}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="create-email" className="text-ink text-[13px] font-bold">
                    Email
                </label>
                <Input
                    id="create-email"
                    type="email"
                    {...register('email')}
                    className={cn(
                        'border-border h-11 rounded-[10px] bg-white',
                        errors.email && 'border-destructive',
                    )}
                />
                {errors.email && (
                    <p className="text-destructive text-xs font-medium">{errors.email.message}</p>
                )}
            </div>
            <div className="flex flex-col gap-1.5">
                <span className="text-ink text-[13px] font-bold">RUT</span>
                <Controller
                    name="rut"
                    control={control}
                    render={({ field }) => (
                        <RutField
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            className="border-border h-11 rounded-[10px] bg-white"
                        />
                    )}
                />
                {errors.rut && (
                    <p className="text-destructive text-xs font-medium">{errors.rut.message}</p>
                )}
            </div>
            <div className="flex flex-col gap-1.5">
                <span className="text-ink text-[13px] font-bold">Rol de Acceso</span>
                <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                        <RoleSelect value={field.value} onChange={field.onChange} />
                    )}
                />
                {errors.role && (
                    <p className="text-destructive text-xs font-medium">{errors.role.message}</p>
                )}
            </div>
            {!isSuperAdmin && (
                <div className="flex flex-col gap-1.5">
                    <span className="text-ink text-[13px] font-bold">Institución</span>
                    <Controller
                        name="academicInstitutionId"
                        control={control}
                        render={({ field }) => (
                            <SearchableSelect
                                value={field.value ?? ''}
                                onChange={field.onChange}
                                options={institutions.map((i) => ({ value: i.id, label: i.name }))}
                                placeholder="Seleccioná una institución"
                            />
                        )}
                    />
                    {errors.academicInstitutionId && (
                        <p className="text-destructive text-xs font-medium">
                            {errors.academicInstitutionId.message}
                        </p>
                    )}
                </div>
            )}
            <div className="bg-paper-warm/50 border-border rounded-[12px] border p-4">
                <p className="text-mute text-[12px] leading-relaxed font-medium">
                    Se generará una contraseña temporal segura y se enviará automáticamente al email
                    del usuario para su primer acceso.
                </p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <Button type="submit" disabled={isPending} variant="ink" size="md">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear usuario administrador
                </Button>
            </div>
        </form>
    );
}

function UpdateAdminForm({
    defaultValues,
    institutions,
    onSubmit,
    isPending,
}: {
    defaultValues: AdminUserRow;
    institutions: Props['institutions'];
    onSubmit: (data: UpdateInput) => void;
    isPending: boolean;
}) {
    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors },
    } = useForm<UpdateInput>({
        resolver: zodResolver(adminUserUpdateSchema),
        defaultValues: {
            name: defaultValues.name,
            lastname: defaultValues.lastname,
            email: defaultValues.email,
            rut: formatRut(defaultValues.rut),
            role:
                defaultValues.role === USER_ROLE.SUPER_ADMIN
                    ? USER_ROLE.SUPER_ADMIN
                    : USER_ROLE.ADMIN,
            academicInstitutionId: defaultValues.institution?.id ?? undefined,
            password: '',
        },
    });

    const selectedRole = watch('role');
    const isSuperAdmin = selectedRole === USER_ROLE.SUPER_ADMIN;
    const [showPassword, setShowPassword] = useState(false);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="edit-name" className="text-ink text-[13px] font-bold">
                        Nombre
                    </label>
                    <Input
                        id="edit-name"
                        {...register('name')}
                        className={cn(
                            'border-border h-11 rounded-[10px] bg-white',
                            errors.name && 'border-destructive',
                        )}
                    />
                    {errors.name && (
                        <p className="text-destructive text-xs font-medium">
                            {errors.name.message}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="edit-lastname" className="text-ink text-[13px] font-bold">
                        Apellido
                    </label>
                    <Input
                        id="edit-lastname"
                        {...register('lastname')}
                        className={cn(
                            'border-border h-11 rounded-[10px] bg-white',
                            errors.lastname && 'border-destructive',
                        )}
                    />
                    {errors.lastname && (
                        <p className="text-destructive text-xs font-medium">
                            {errors.lastname.message}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-email" className="text-ink text-[13px] font-bold">
                    Email
                </label>
                <Input
                    id="edit-email"
                    type="email"
                    {...register('email')}
                    className={cn(
                        'border-border h-11 rounded-[10px] bg-white',
                        errors.email && 'border-destructive',
                    )}
                />
                {errors.email && (
                    <p className="text-destructive text-xs font-medium">{errors.email.message}</p>
                )}
            </div>
            <div className="flex flex-col gap-1.5">
                <span className="text-ink text-[13px] font-bold">RUT</span>
                <Controller
                    name="rut"
                    control={control}
                    render={({ field }) => (
                        <RutField
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            className="border-border h-11 rounded-[10px] bg-white"
                        />
                    )}
                />
                {errors.rut && (
                    <p className="text-destructive text-xs font-medium">{errors.rut.message}</p>
                )}
            </div>
            <div className="flex flex-col gap-1.5">
                <span className="text-ink text-[13px] font-bold">Rol</span>
                <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                        <RoleSelect value={field.value} onChange={field.onChange} />
                    )}
                />
                {errors.role && (
                    <p className="text-destructive text-xs font-medium">{errors.role.message}</p>
                )}
            </div>
            {!isSuperAdmin && (
                <div className="flex flex-col gap-1.5">
                    <span className="text-ink text-[13px] font-bold">Institución</span>
                    <Controller
                        name="academicInstitutionId"
                        control={control}
                        render={({ field }) => (
                            <SearchableSelect
                                value={field.value ?? ''}
                                onChange={field.onChange}
                                options={institutions.map((i) => ({ value: i.id, label: i.name }))}
                                placeholder="Seleccioná una institución"
                            />
                        )}
                    />
                    {errors.academicInstitutionId && (
                        <p className="text-destructive text-xs font-medium">
                            {errors.academicInstitutionId.message}
                        </p>
                    )}
                </div>
            )}
            <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-password" className="text-ink text-[13px] font-bold">
                    Nueva contraseña
                    <span className="text-mute ml-2 font-normal">
                        (dejá en blanco para no cambiarla)
                    </span>
                </label>
                <div className="relative">
                    <Input
                        id="edit-password"
                        type={showPassword ? 'text' : 'password'}
                        {...register('password')}
                        placeholder="Mínimo 8 caracteres"
                        className={cn(
                            'border-border h-11 rounded-[10px] bg-white pr-10',
                            errors.password && 'border-destructive',
                        )}
                        autoComplete="new-password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="text-mute hover:text-ink absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {errors.password && (
                    <p className="text-destructive text-xs font-medium">
                        {errors.password.message}
                    </p>
                )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <Button type="submit" disabled={isPending} variant="ink" size="md">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar cambios
                </Button>
            </div>
        </form>
    );
}

export function AdminUsersClient({
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
    const [editRow, setEditRow] = useState<AdminUserRow | null>(null);
    const [deleteRow, setDeleteRow] = useState<AdminUserRow | null>(null);

    function pushUrl(params: { q?: string; institutionId?: string; page?: number }): void {
        const sp = new URLSearchParams();
        const q = params.q ?? search;
        const iid = params.institutionId ?? institutionFilter;
        if (q) sp.set('q', q);
        if (iid) sp.set('institutionId', iid);
        if (params.page && params.page > 1) sp.set('page', String(params.page));
        router.push(`/config/admins?${sp.toString()}`);
    }

    function handleSearchSubmit(e: FormEvent): void {
        e.preventDefault();
        pushUrl({ q: search, page: 1 });
    }

    function handleCreate(data: CreateInput): void {
        startTransition(async () => {
            const res = await createAdminUser(data);
            if (res.error && !res.data) {
                toast.error(res.error);
                return;
            }
            if (res.data?.emailSent) {
                toast.success('Usuario creado. Se enviaron las credenciales por email.');
            } else {
                toast.warning(
                    `Usuario creado, pero no se pudo enviar el email: ${res.error ?? 'error desconocido'}`,
                );
            }
            setCreateOpen(false);
            router.refresh();
        });
    }

    function handleUpdate(data: UpdateInput): void {
        if (!editRow) return;
        startTransition(async () => {
            const res = await updateAdminUser(editRow.id, data);
            if (res.error) {
                toast.error(res.error);
                return;
            }
            toast.success('Usuario actualizado');
            setEditRow(null);
            router.refresh();
        });
    }

    function handleDelete(): void {
        if (!deleteRow) return;
        startTransition(async () => {
            const res = await deleteAdminUser(deleteRow.id);
            if (res.error) {
                toast.error(res.error);
                return;
            }
            toast.success('Usuario eliminado');
            setDeleteRow(null);
            router.refresh();
        });
    }

    return (
        <>
            {/* Filter bar */}
            <div className="border-border flex items-center gap-2 border-b bg-white px-8 py-4">
                <form onSubmit={handleSearchSubmit} className="relative max-w-sm flex-1">
                    <Search className="text-mute absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, email o RUT..."
                        className="border-border h-9 rounded-[10px] bg-white pl-9"
                    />
                </form>

                <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-mute ml-4" />
                    <SearchableSelect
                        size="sm"
                        value={institutionFilter || '__all__'}
                        onChange={(v) => {
                            const val = v === '__all__' ? '' : v;
                            setInstitutionFilter(val);
                            pushUrl({ institutionId: val, page: 1 });
                        }}
                        options={[
                            { value: '__all__', label: 'Todas las instituciones' },
                            ...institutions.map((i) => ({ value: i.id, label: i.name })),
                        ]}
                        className="w-52"
                    />
                </div>

                <div className="flex-1" />
                <span className="text-mute font-mono text-[11px] tracking-wider uppercase">
                    {result.total} registrados
                </span>
                <Button
                    variant="ink"
                    size="md"
                    onClick={() => setCreateOpen(true)}
                    className="gap-2"
                >
                    <Plus size={16} />
                    Nuevo usuario
                </Button>
            </div>

            <main className="flex-1 overflow-auto p-8">
                {result.items.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <ShieldCheck size={48} className="text-mute/20 mb-4" />
                        <p className="text-ink text-lg font-medium">
                            No hay administradores registrados
                        </p>
                        <p className="text-mute mt-1 text-sm">
                            Crea el primer usuario con acceso al panel de control.
                        </p>
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => setCreateOpen(true)}
                            className="mt-6"
                        >
                            <Plus size={16} />
                            Nuevo usuario
                        </Button>
                    </Card>
                ) : (
                    <Card className="border-border overflow-visible p-0 shadow-sm">
                        <Table>
                            <TableHeader className="bg-paper">
                                <TableRow className="border-border border-b hover:bg-transparent">
                                    <TableHead>Nombre / Email</TableHead>
                                    <TableHead className="w-[160px]">RUT</TableHead>
                                    <TableHead className="w-[140px]">Rol</TableHead>
                                    <TableHead>Institución</TableHead>
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
                                            <Tag
                                                tone={
                                                    row.role === USER_ROLE.SUPER_ADMIN
                                                        ? 'primary'
                                                        : 'default'
                                                }
                                                className="h-5 text-[10px] font-bold"
                                            >
                                                {ROLE_LABEL[row.role] ?? row.role}
                                            </Tag>
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
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck size={12} className="text-iris" />
                                                    <span className="text-iris text-[12px] font-bold tracking-widest uppercase italic">
                                                        Aulika Global
                                                    </span>
                                                </div>
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
                                                        <Pencil size={14} /> Editar acceso
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteRow(row)}
                                                        className="text-destructive focus:bg-danger-wash focus:text-destructive cursor-pointer gap-2 py-2.5"
                                                    >
                                                        <Trash2 size={14} /> Eliminar acceso
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
                            Nuevo Administrador
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulario para crear un nuevo administrador.
                        </DialogDescription>
                    </div>
                    <div className="px-6">
                        <CreateAdminForm
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
                            Editar Usuario
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulario para editar los datos del usuario.
                        </DialogDescription>
                    </div>
                    <div className="px-6">
                        {editRow && (
                            <UpdateAdminForm
                                defaultValues={editRow}
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
                            Eliminar acceso
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Confirmación para eliminar el acceso del usuario.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-ink-dim text-[14px] leading-relaxed">
                            ¿Estás seguro de eliminar el acceso de{' '}
                            <strong className="text-ink">
                                {deleteRow?.name} {deleteRow?.lastname}
                            </strong>
                            ? Esta acción revocará todos sus permisos.
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
