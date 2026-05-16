'use client';

import {
    createAdminUser,
    deleteAdminUser,
    updateAdminUser,
} from '@/features/admin-users/actions/mutations';
import type { AdminUserRow } from '@/features/admin-users/actions/queries';
import { adminUserCreateSchema, adminUserUpdateSchema } from '@/features/admin-users/schemas/admin-user.schemas';
import type { InstitutionRow } from '@/features/institutions/actions/queries';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import {
    Dialog,
    DialogContent,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { TablePaginator } from '@/shared/components/ui/table-paginator';
import { Avatar } from '@/shared/components/ui/avatar';
import { Tag } from '@/shared/components/ui/badge';
import { RutField } from '@/shared/components/rut-field';
import { formatRut } from '@/shared/lib/rut';
import { USER_ROLE } from '@/shared/lib/roles';
import type { PaginatedResult } from '@/shared/types/pagination';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil, Plus, Trash2, Search, Building2, MoreHorizontal, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
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

function RoleSelect({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: typeof USER_ROLE.ADMIN | typeof USER_ROLE.SUPER_ADMIN) => void;
}): React.JSX.Element {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="h-11 rounded-[10px] bg-white border-border">
                <SelectValue placeholder="Seleccioná un rol" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border shadow-xl">
                <SelectItem value={USER_ROLE.ADMIN}>Administrador</SelectItem>
                <SelectItem value={USER_ROLE.SUPER_ADMIN}>SuperAdministrador</SelectItem>
            </SelectContent>
        </Select>
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
}): React.JSX.Element {
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
                    <label htmlFor="create-name" className="text-[13px] font-bold text-ink">Nombre</label>
                    <Input id="create-name" {...register('name')} className={cn("h-11 rounded-[10px] bg-white border-border", errors.name && 'border-destructive')} />
                    {errors.name && <p className="text-xs text-destructive font-medium">{errors.name.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="create-lastname" className="text-[13px] font-bold text-ink">Apellido</label>
                    <Input id="create-lastname" {...register('lastname')} className={cn("h-11 rounded-[10px] bg-white border-border", errors.lastname && 'border-destructive')} />
                    {errors.lastname && <p className="text-xs text-destructive font-medium">{errors.lastname.message}</p>}
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="create-email" className="text-[13px] font-bold text-ink">Email</label>
                <Input id="create-email" type="email" {...register('email')} className={cn("h-11 rounded-[10px] bg-white border-border", errors.email && 'border-destructive')} />
                {errors.email && <p className="text-xs text-destructive font-medium">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold text-ink">RUT</span>
                <Controller
                    name="rut"
                    control={control}
                    render={({ field }) => (
                        <RutField value={field.value ?? ''} onChange={field.onChange} className="h-11 rounded-[10px] bg-white border-border" />
                    )}
                />
                {errors.rut && <p className="text-xs text-destructive font-medium">{errors.rut.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold text-ink">Rol de Acceso</span>
                <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                        <RoleSelect value={field.value} onChange={field.onChange} />
                    )}
                />
                {errors.role && <p className="text-xs text-destructive font-medium">{errors.role.message}</p>}
            </div>
            {!isSuperAdmin && (
                <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-bold text-ink">Institución</span>
                    <Controller
                        name="academicInstitutionId"
                        control={control}
                        render={({ field }) => (
                            <Select value={field.value ?? ''} onValueChange={field.onChange}>
                                <SelectTrigger className="h-11 rounded-[10px] bg-white border-border">
                                    <SelectValue placeholder="Seleccioná una institución" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border shadow-xl">
                                    {institutions.map((i) => (
                                        <SelectItem key={i.id} value={i.id}>
                                            {i.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.academicInstitutionId && (
                        <p className="text-xs text-destructive font-medium">{errors.academicInstitutionId.message}</p>
                    )}
                </div>
            )}
            <div className="bg-paper-warm/50 rounded-[12px] p-4 border border-border">
                <p className="text-[12px] text-mute leading-relaxed font-medium">
                    Se generará una contraseña temporal segura y se enviará automáticamente al email del usuario para su primer acceso.
                </p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <Button type="submit" disabled={isPending} variant="ink" size="md">
                    {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
}): React.JSX.Element {
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
        },
    });

    const selectedRole = watch('role');
    const isSuperAdmin = selectedRole === USER_ROLE.SUPER_ADMIN;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="edit-name" className="text-[13px] font-bold text-ink">Nombre</label>
                    <Input id="edit-name" {...register('name')} className={cn("h-11 rounded-[10px] bg-white border-border", errors.name && 'border-destructive')} />
                    {errors.name && <p className="text-xs text-destructive font-medium">{errors.name.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="edit-lastname" className="text-[13px] font-bold text-ink">Apellido</label>
                    <Input id="edit-lastname" {...register('lastname')} className={cn("h-11 rounded-[10px] bg-white border-border", errors.lastname && 'border-destructive')} />
                    {errors.lastname && <p className="text-xs text-destructive font-medium">{errors.lastname.message}</p>}
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-email" className="text-[13px] font-bold text-ink">Email</label>
                <Input id="edit-email" type="email" {...register('email')} className={cn("h-11 rounded-[10px] bg-white border-border", errors.email && 'border-destructive')} />
                {errors.email && <p className="text-xs text-destructive font-medium">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold text-ink">RUT</span>
                <Controller
                    name="rut"
                    control={control}
                    render={({ field }) => (
                        <RutField value={field.value ?? ''} onChange={field.onChange} className="h-11 rounded-[10px] bg-white border-border" />
                    )}
                />
                {errors.rut && <p className="text-xs text-destructive font-medium">{errors.rut.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold text-ink">Rol</span>
                <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                        <RoleSelect value={field.value} onChange={field.onChange} />
                    )}
                />
                {errors.role && <p className="text-xs text-destructive font-medium">{errors.role.message}</p>}
            </div>
            {!isSuperAdmin && (
                <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-bold text-ink">Institución</span>
                    <Controller
                        name="academicInstitutionId"
                        control={control}
                        render={({ field }) => (
                            <Select value={field.value ?? ''} onValueChange={field.onChange}>
                                <SelectTrigger className="h-11 rounded-[10px] bg-white border-border">
                                    <SelectValue placeholder="Seleccioná una institución" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border shadow-xl">
                                    {institutions.map((i) => (
                                        <SelectItem key={i.id} value={i.id}>
                                            {i.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.academicInstitutionId && (
                        <p className="text-xs text-destructive font-medium">{errors.academicInstitutionId.message}</p>
                    )}
                </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
                <Button type="submit" disabled={isPending} variant="ink" size="md">
                    {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Guardar cambios
                </Button>
            </div>
        </form>
    );
}

export function AdminUsersClient({ result, institutions, q: initialQ, institutionId: initialInstitutionId }: Props): React.JSX.Element {
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

    function handleSearchSubmit(e: React.FormEvent): void {
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
                toast.warning(`Usuario creado, pero no se pudo enviar el email: ${res.error ?? 'error desconocido'}`);
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
        <div className="flex flex-col min-h-screen bg-paper">
            {/* Header */}
            <AdminTopBar
                breadcrumb={['Sistema', 'Administradores']}
                title="Gestión de Accesos"
                subtitle={`${result.total} usuarios con privilegios de gestión en la plataforma`}
                actions={
                    <Button variant="ink" size="md" onClick={() => setCreateOpen(true)} className="gap-2">
                        <Plus size={16} />
                        Nuevo usuario
                    </Button>
                }
            />

            {/* Filter bar */}
            <div className="flex items-center gap-2 border-b border-border bg-white px-8 py-4">
                <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mute" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, email o RUT..."
                        className="pl-9 h-[38px] border-border bg-white"
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
                        <SelectTrigger className="h-[38px] w-52 border-border bg-white">
                            <SelectValue placeholder="Todas las instituciones" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border shadow-xl">
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
                <span className="font-mono text-[11px] text-mute uppercase tracking-wider">
                    {result.total} registrados
                </span>
            </div>

            <main className="flex-1 p-8 overflow-auto">
                {result.items.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <ShieldCheck size={48} className="mb-4 text-mute/20" />
                        <p className="text-lg font-medium text-ink">No hay administradores registrados</p>
                        <p className="mt-1 text-sm text-mute">Crea el primer usuario con acceso al panel de control.</p>
                        <Button variant="primary" size="md" onClick={() => setCreateOpen(true)} className="mt-6">
                            <Plus size={16} />
                            Nuevo usuario
                        </Button>
                    </Card>
                ) : (
                    <Card className="p-0 overflow-visible border-border shadow-sm">
                        <Table>
                            <TableHeader className="bg-paper">
                                <TableRow className="hover:bg-transparent border-b border-border">
                                    <TableHead>Nombre / Email</TableHead>
                                    <TableHead className="w-[160px]">RUT</TableHead>
                                    <TableHead className="w-[140px]">Rol</TableHead>
                                    <TableHead>Institución</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {result.items.map((row) => (
                                    <TableRow key={row.id} className="group h-16 border-b border-border last:border-0">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={`${row.name} ${row.lastname}`}
                                                    size={32}
                                                    className="ring-1 ring-border shadow-sm"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-[13.5px] font-bold text-ink leading-tight">{row.name} {row.lastname}</span>
                                                    <span className="text-[11.5px] text-mute">{row.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-[12px] text-mute">
                                            {formatRut(row.rut)}
                                        </TableCell>
                                        <TableCell>
                                            <Tag
                                                tone={row.role === USER_ROLE.SUPER_ADMIN ? "primary" : "default"}
                                                className="font-bold text-[10px] h-5"
                                            >
                                                {ROLE_LABEL[row.role] ?? row.role}
                                            </Tag>
                                        </TableCell>
                                        <TableCell>
                                            {row.institution ? (
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={12} className="text-primary/60" />
                                                    <span className="text-[12.5px] font-medium text-ink-dim">{row.institution.name}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck size={12} className="text-iris" />
                                                    <span className="text-[12px] font-bold text-iris uppercase tracking-widest italic">Aulika Global</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon-sm" className="h-9 w-9">
                                                        <MoreHorizontal size={18} className="text-mute" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl border-border shadow-xl w-44">
                                                    <DropdownMenuItem onClick={() => setEditRow(row)} className="gap-2 py-2.5 cursor-pointer">
                                                        <Pencil size={14} /> Editar acceso
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setDeleteRow(row)} className="text-destructive gap-2 py-2.5 cursor-pointer focus:bg-danger-wash focus:text-destructive">
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
                <DialogContent className="max-w-lg rounded-[22px] border-border shadow-2xl overflow-hidden p-0">
                    <div className="px-6 py-5 border-b border-border bg-paper">
                        <DialogTitle className="font-display text-2xl text-ink">Nuevo Administrador</DialogTitle>
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
                <DialogContent className="max-w-lg rounded-[22px] border-border shadow-2xl overflow-hidden p-0">
                    <div className="px-6 py-5 border-b border-border bg-paper">
                        <DialogTitle className="font-display text-2xl text-ink">Editar Usuario</DialogTitle>
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
                <DialogContent className="sm:max-w-sm rounded-[22px] border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl text-destructive">Eliminar acceso</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-[14px] leading-relaxed text-ink-dim">
                            ¿Estás seguro de eliminar el acceso de <strong className="text-ink">{deleteRow?.name} {deleteRow?.lastname}</strong>? Esta acción revocará todos sus permisos.
                        </p>
                    </div>
                    <DialogFooter className="gap-2 sm:justify-end mt-2">
                        <Button variant="ghost" size="md" onClick={() => setDeleteRow(null)} disabled={isPending}>Cancelar</Button>
                        <Button variant="danger" size="md" onClick={handleDelete} disabled={isPending}>
                            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
