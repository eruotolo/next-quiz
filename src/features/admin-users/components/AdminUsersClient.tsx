'use client';

import {
    createAdminUser,
    deleteAdminUser,
    updateAdminUser,
} from '@/features/admin-users/actions/mutations';
import type { AdminUserRow } from '@/features/admin-users/actions/queries';
import { adminUserCreateSchema, adminUserUpdateSchema } from '@/features/admin-users/schemas/admin-user.schemas';
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
import { USER_ROLE } from '@/shared/lib/roles';
import type { PaginatedResult } from '@/shared/types/pagination';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil, Plus, Trash2, UserCog } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

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

const ROLE_BADGE_CLASS: Record<string, string> = {
    [USER_ROLE.ADMIN]: 'bg-blue-100 text-blue-700',
    [USER_ROLE.SUPER_ADMIN]: 'bg-violet-100 text-violet-700',
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
            <SelectTrigger>
                <SelectValue placeholder="Seleccioná un rol" />
            </SelectTrigger>
            <SelectContent>
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <Label>Nombre</Label>
                    <Input {...register('name')} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="flex flex-col gap-1">
                    <Label>Apellido</Label>
                    <Input {...register('lastname')} />
                    {errors.lastname && <p className="text-xs text-destructive">{errors.lastname.message}</p>}
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <Label>Email</Label>
                <Input type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
                <Label>RUT</Label>
                <Controller
                    name="rut"
                    control={control}
                    render={({ field }) => (
                        <RutField id="create-rut" value={field.value ?? ''} onChange={field.onChange} />
                    )}
                />
                {errors.rut && <p className="text-xs text-destructive">{errors.rut.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
                <Label>Rol</Label>
                <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                        <RoleSelect value={field.value} onChange={field.onChange} />
                    )}
                />
                {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>
            {!isSuperAdmin && (
                <div className="flex flex-col gap-1">
                    <Label>Institución</Label>
                    <Controller
                        name="academicInstitutionId"
                        control={control}
                        render={({ field }) => (
                            <Select value={field.value ?? ''} onValueChange={field.onChange}>
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
                        )}
                    />
                    {errors.academicInstitutionId && (
                        <p className="text-xs text-destructive">{errors.academicInstitutionId.message}</p>
                    )}
                </div>
            )}
            <p className="text-xs text-muted-foreground">
                Se generará una contraseña aleatoria y se enviará al email del usuario.
            </p>
            <Button type="submit" disabled={isPending} className="self-end">
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Crear usuario
            </Button>
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <Label>Nombre</Label>
                    <Input {...register('name')} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="flex flex-col gap-1">
                    <Label>Apellido</Label>
                    <Input {...register('lastname')} />
                    {errors.lastname && <p className="text-xs text-destructive">{errors.lastname.message}</p>}
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <Label>Email</Label>
                <Input type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
                <Label>RUT</Label>
                <Controller
                    name="rut"
                    control={control}
                    render={({ field }) => (
                        <RutField id="edit-rut" value={field.value ?? ''} onChange={field.onChange} />
                    )}
                />
                {errors.rut && <p className="text-xs text-destructive">{errors.rut.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
                <Label>Rol</Label>
                <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                        <RoleSelect value={field.value} onChange={field.onChange} />
                    )}
                />
                {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>
            {!isSuperAdmin && (
                <div className="flex flex-col gap-1">
                    <Label>Institución</Label>
                    <Controller
                        name="academicInstitutionId"
                        control={control}
                        render={({ field }) => (
                            <Select value={field.value ?? ''} onValueChange={field.onChange}>
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
                        )}
                    />
                    {errors.academicInstitutionId && (
                        <p className="text-xs text-destructive">{errors.academicInstitutionId.message}</p>
                    )}
                </div>
            )}
            <Button type="submit" disabled={isPending} className="self-end">
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Guardar cambios
            </Button>
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

    const columns: ColumnDef<AdminUserRow>[] = [
        {
            key: 'name',
            header: 'Nombre',
            render: (row) => (
                <span className="font-medium">{row.name} {row.lastname}</span>
            ),
        },
        {
            key: 'email',
            header: 'Email',
            render: (row) => <span className="text-muted-foreground">{row.email}</span>,
        },
        {
            key: 'rut',
            header: 'RUT',
            render: (row) => <code className="text-xs">{formatRut(row.rut)}</code>,
        },
        {
            key: 'role',
            header: 'Rol',
            render: (row) => (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_BADGE_CLASS[row.role] ?? 'bg-muted text-muted-foreground'}`}>
                    {ROLE_LABEL[row.role] ?? row.role}
                </span>
            ),
        },
        {
            key: 'institution',
            header: 'Institución',
            render: (row) => row.institution ? (
                <Badge variant="secondary">{row.institution.name}</Badge>
            ) : <span className="text-muted-foreground">—</span>,
        },
        {
            key: 'actions',
            header: '',
            render: (row) => (
                <div className="flex items-center gap-1">
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
                    <h1 className="text-foreground text-[24px] font-extrabold tracking-tight">Administradores</h1>
                    <p className="text-muted-foreground text-[14px] mt-1">
                        {result.total} usuario{result.total !== 1 ? 's' : ''} con acceso administrativo
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo usuario
                </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, email o RUT..."
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
                        <UserCog className="h-10 w-10 opacity-30" />
                        <p className="text-sm">No hay usuarios administrativos registrados.</p>
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
                    emptyMessage="No se encontraron usuarios."
                    isPending={isPending}
                />
            )}

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Nuevo usuario administrativo</DialogTitle>
                    </DialogHeader>
                    <CreateAdminForm
                        institutions={institutions}
                        onSubmit={handleCreate}
                        isPending={isPending}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar usuario</DialogTitle>
                    </DialogHeader>
                    {editRow && (
                        <UpdateAdminForm
                            defaultValues={editRow}
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
                        <DialogTitle>Eliminar usuario</DialogTitle>
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
