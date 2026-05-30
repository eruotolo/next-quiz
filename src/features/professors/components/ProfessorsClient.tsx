'use client';

import {
    createProfessor,
    deleteProfessor,
    updateProfessor,
} from '@/features/professors/actions/mutations';
import { RutInput } from '@/features/students/components/RutInput';
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
import { formatRut, isValidRut, normalizeRut } from '@/shared/lib/rut';
import type { Group, Prisma } from '@prisma/client';
import { Edit2, Loader2, Plus, Trash2, UserCog, MoreHorizontal, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cn } from '@/shared/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

export type ProfessorWithRelations = Prisma.UserGetPayload<{
    include: { userRole: true; professorGroups: true };
}>;

interface Props {
    professors: ProfessorWithRelations[];
    groups: Group[];
    slug: string;
}

interface FormState {
    name: string;
    lastname: string;
    email: string;
    rut: string;
    password: string;
    phone: string;
    roleName: 'Profesor' | 'Administrador';
    groupIds: string[];
}

const emptyForm: FormState = {
    name: '',
    lastname: '',
    email: '',
    rut: '',
    password: '',
    phone: '',
    roleName: 'Profesor',
    groupIds: [],
};

export function ProfessorsClient({ professors, groups, slug }: Props): React.ReactElement {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;
    const [isOpen, setIsOpen] = useState(false);
    const [isDelOpen, setIsDelOpen] = useState(false);
    const [editing, setEditing] = useState<ProfessorWithRelations | null>(null);
    const [toDelete, setToDelete] = useState<ProfessorWithRelations | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'general', string>>>({});
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const setField = <K extends keyof FormState>(field: K, value: FormState[K]): void => {
        setForm((f) => ({ ...f, [field]: value }));
        setErrors((e) => ({ ...e, [field]: undefined }));
    };

    const toggleGroup = (groupId: string): void => {
        setForm((f) => ({
            ...f,
            groupIds: f.groupIds.includes(groupId)
                ? f.groupIds.filter((id) => id !== groupId)
                : [...f.groupIds, groupId],
        }));
    };

    const openCreate = (): void => {
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
        setIsOpen(true);
    };

    const openEdit = (p: ProfessorWithRelations): void => {
        setEditing(p);
        setForm({
            name: p.name,
            lastname: p.lastname,
            email: p.email,
            rut: formatRut(p.rut),
            password: '',
            phone: p.phone ?? '',
            roleName: (p.userRole?.name as 'Profesor' | 'Administrador') ?? 'Profesor',
            groupIds: p.professorGroups.map((g) => g.id),
        });
        setErrors({});
        setIsOpen(true);
    };

    const openDelete = (p: ProfessorWithRelations): void => {
        setToDelete(p);
        setDeleteError(null);
        setIsDelOpen(true);
    };

    const validate = (): boolean => {
        const next: Partial<Record<keyof FormState, string>> = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!form.name.trim()) next.name = 'Nombre requerido';
        if (!form.lastname.trim()) next.lastname = 'Apellido requerido';
        if (!emailRegex.test(form.email)) next.email = 'Email inválido';
        if (!form.rut.trim()) {
            next.rut = 'RUT requerido';
        } else if (!isValidRut(normalizeRut(form.rut))) {
            next.rut = 'RUT inválido';
        }
        if (!editing) {
            if (!form.password) next.password = 'Contraseña requerida';
            else if (form.password.length < 8) next.password = 'Mínimo 8 caracteres';
        } else if (form.password && form.password.length < 8) {
            next.password = 'Mínimo 8 caracteres';
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSave = (): void => {
        if (!validate()) return;
        startTransition(async () => {
            const result = editing
                ? await updateProfessor(slug, editing.id, form)
                : await createProfessor(slug, form);
            if (result.error) {
                setErrors({ general: result.error });
                return;
            }
            setIsOpen(false);
            router.refresh();
        });
    };

    const handleDelete = (): void => {
        if (!toDelete) return;
        startTransition(async () => {
            const result = await deleteProfessor(slug, toDelete.id);
            if (result.error) {
                setDeleteError(result.error);
                return;
            }
            setIsDelOpen(false);
            router.refresh();
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-paper">
            {/* Header */}
            <AdminTopBar
                breadcrumb={['Colegio Antártica', 'Profesores']}
                title="Cuerpo Docente"
                subtitle={`${professors.length} profesionales registrados en el equipo`}
                actions={
                    <Button variant="ink" size="md" onClick={openCreate} className="gap-2">
                        <Plus size={16} />
                        Nuevo profesor
                    </Button>
                }
            />

            {/* Filter bar */}
            <div className="flex items-center gap-2 border-b border-border bg-white px-8 py-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mute" />
                    <Input
                        placeholder="Buscar por nombre o RUT…"
                        className="pl-9 h-[38px] border-border bg-white"
                    />
                </div>
                <div className="flex-1" />
                <span className="font-mono text-[11px] text-mute uppercase tracking-wider">
                    {professors.length} registrados
                </span>
            </div>

            <main className="flex-1 p-8 overflow-auto">
                {professors.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <UserCog size={48} className="mb-4 text-mute/20" />
                        <p className="text-lg font-medium text-ink">No hay profesores registrados</p>
                        <p className="mt-1 text-sm text-mute">Agregá el primero para comenzar a gestionar grupos.</p>
                        <Button variant="primary" size="md" onClick={openCreate} className="mt-6">
                            <Plus size={16} />
                            Agregar profesor
                        </Button>
                    </Card>
                ) : (
                    <Card className="p-0 overflow-visible border-border shadow-sm">
                        <Table>
                            <TableHeader className="bg-paper">
                                <TableRow className="hover:bg-transparent border-b border-border">
                                    <TableHead>Profesor / Administrador</TableHead>
                                    <TableHead className="w-[160px]">RUT</TableHead>
                                    <TableHead className="w-[140px]">Rol</TableHead>
                                    <TableHead>Grupos Asignados</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {professors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((p) => (
                                    <TableRow key={p.id} className="group h-16 border-b border-border last:border-0">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={`${p.name} ${p.lastname}`}
                                                    size={32}
                                                    className="ring-1 ring-border shadow-sm"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-[13.5px] font-bold text-ink leading-tight">{p.name} {p.lastname}</span>
                                                    <span className="text-[11.5px] text-mute">{p.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-[12px] text-mute">
                                            {formatRut(p.rut)}
                                        </TableCell>
                                        <TableCell>
                                            <Tag
                                                tone={p.userRole?.name === 'Administrador' ? "primary" : "default"}
                                                className="font-bold text-[10px] h-5"
                                            >
                                                {p.userRole?.name ?? 'Profesor'}
                                            </Tag>
                                        </TableCell>
                                        <TableCell>
                                            {p.professorGroups.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {p.professorGroups.map((g) => (
                                                        <Tag key={g.id} tone="outline" className="font-mono text-[10px] h-5 bg-paper-warm/50 border-border">
                                                            {g.name}
                                                        </Tag>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[11.5px] text-mute">—</span>
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
                                                    <DropdownMenuItem onClick={() => openEdit(p)} className="gap-2 py-2.5 cursor-pointer">
                                                        <Edit2 size={14} /> Editar datos
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openDelete(p)} className="text-destructive gap-2 py-2.5 cursor-pointer focus:bg-danger-wash focus:text-destructive">
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
                            page={page}
                            perPage={PAGE_SIZE}
                            total={professors.length}
                            onPageChange={setPage}
                        />
                    </Card>
                )}
            </main>

            {/* Create/Edit dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-lg rounded-[22px] border-border shadow-2xl overflow-hidden p-0">
                    <div className="px-6 py-5 border-b border-border bg-paper">
                        <DialogTitle className="font-display text-2xl text-ink">{editing ? 'Ajustes del perfil' : 'Nuevo profesor'}</DialogTitle>
                    </div>
                    
                    <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
                        {errors.general && (
                            <p className="rounded-[10px] bg-danger-wash px-4 py-3 text-sm text-destructive font-bold border border-destructive/10">
                                {errors.general}
                            </p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="prof-name" className="text-[13px] font-bold text-ink">Nombre</label>
                                <Input
                                    id="prof-name"
                                    value={form.name}
                                    onChange={(e) => setField('name', e.target.value)}
                                    className={cn("h-11 rounded-[10px] bg-white border-border", errors.name && 'border-destructive')}
                                    autoFocus
                                />
                                {errors.name && <p className="text-xs text-destructive font-medium">{errors.name}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="prof-lastname" className="text-[13px] font-bold text-ink">Apellido</label>
                                <Input
                                    id="prof-lastname"
                                    value={form.lastname}
                                    onChange={(e) => setField('lastname', e.target.value)}
                                    className={cn("h-11 rounded-[10px] bg-white border-border", errors.lastname && 'border-destructive')}
                                />
                                {errors.lastname && <p className="text-xs text-destructive font-medium">{errors.lastname}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="prof-email" className="text-[13px] font-bold text-ink">Email</label>
                                <Input
                                    id="prof-email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setField('email', e.target.value)}
                                    className={cn("h-11 rounded-[10px] bg-white border-border", errors.email && 'border-destructive')}
                                />
                                {errors.email && <p className="text-xs text-destructive font-medium">{errors.email}</p>}
                            </div>
                            <RutInput
                                label="RUT"
                                value={form.rut}
                                onChange={(v) => setField('rut', v)}
                                error={errors.rut}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="prof-password" className="text-[13px] font-bold text-ink">Contraseña</label>
                                <Input
                                    id="prof-password"
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setField('password', e.target.value)}
                                    placeholder={editing ? '••••••••' : undefined}
                                    className={cn("h-11 rounded-[10px] bg-white border-border", errors.password && 'border-destructive')}
                                />
                                {errors.password && <p className="text-xs text-destructive font-medium">{errors.password}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="prof-phone" className="text-[13px] font-bold text-ink">Teléfono</label>
                                <Input
                                    id="prof-phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setField('phone', e.target.value)}
                                    placeholder="+56 9..."
                                    className="h-11 rounded-[10px] bg-white border-border"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-[13px] font-bold text-ink">Rol en el sistema</span>
                            <Select
                                value={form.roleName}
                                onValueChange={(v) => setField('roleName', v as 'Profesor' | 'Administrador')}
                            >
                                <SelectTrigger className="h-11 rounded-[10px] bg-white border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border shadow-xl">
                                    <SelectItem value="Profesor">Profesor (Solo sus grupos)</SelectItem>
                                    <SelectItem value="Administrador">Administrador (Toda la institución)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {groups.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <span className="text-[13px] font-bold text-ink">Grupos asociados</span>
                                <div className="max-h-[140px] overflow-y-auto rounded-[12px] border border-border bg-paper-warm/20 p-2">
                                    <div className="grid grid-cols-1 gap-1">
                                        {groups.map((g) => (
                                            <label
                                                key={g.id}
                                                className="flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2 transition-colors hover:bg-white"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={form.groupIds.includes(g.id)}
                                                    onChange={() => toggleGroup(g.id)}
                                                    className="accent-primary h-4 w-4 rounded border-border"
                                                />
                                                <span className="text-[13.5px] font-medium text-ink">{g.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="px-6 py-4 border-t border-border flex justify-end gap-2 bg-white">
                        <Button variant="ghost" size="md" onClick={() => setIsOpen(false)} disabled={isPending}>Cancelar</Button>
                        <Button variant="ink" size="md" disabled={isPending} onClick={handleSave} className="min-w-[140px]">
                            {isPending && <Loader2 className="animate-spin mr-2" />}
                            {editing ? 'Guardar cambios' : 'Crear profesor'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete dialog */}
            <Dialog open={isDelOpen} onOpenChange={setIsDelOpen}>
                <DialogContent className="sm:max-w-sm rounded-[22px] border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl text-destructive">Eliminar acceso</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-[14px] leading-relaxed text-ink-dim">
                            ¿Estás seguro de eliminar el acceso de <strong className="text-ink">{toDelete?.name} {toDelete?.lastname}</strong>? No podrá volver a ingresar al sistema.
                        </p>
                    </div>
                    {deleteError && (
                        <p className="bg-danger-wash text-destructive rounded-[10px] px-4 py-2 text-sm font-medium">
                            {deleteError}
                        </p>
                    )}
                    <DialogFooter className="gap-2 sm:justify-end mt-2">
                        <Button variant="ghost" size="md" onClick={() => setIsDelOpen(false)} disabled={isPending}>Cancelar</Button>
                        <Button variant="danger" size="md" disabled={isPending} onClick={handleDelete}>
                            {isPending && <Loader2 className="animate-spin mr-2" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
