'use client';

import {
    createProfessor,
    deleteProfessor,
    updateProfessor,
} from '@/features/professors/actions/mutations';
import { RutField } from '@/shared/components/ui/rut-field';
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
import { formatRut, isValidRut, normalizeRut } from '@/shared/lib/rut';
import type { Group, Prisma } from '@prisma/client';
import { Edit2, Loader2, Plus, Trash2, UserCog, MoreHorizontal, Search, X } from 'lucide-react';
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
    include: {
        userRole: true;
        professorGroups: true;
        _count: { select: { taughtSections: true } };
    };
}>;

interface Props {
    professors: ProfessorWithRelations[];
    groups: Group[];
    slug: string;
    isDemo?: boolean;
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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: componente CRUD con tabla, modal de formulario y validación integrada
export function ProfessorsClient({ professors, groups, slug, isDemo }: Props) {
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
    const [groupSearch, setGroupSearch] = useState('');

    const setField = <K extends keyof FormState>(field: K, value: FormState[K]): void => {
        setForm((f) => ({ ...f, [field]: value }));
        setErrors((e) => ({ ...e, [field]: undefined }));
    };

    const toggleGroup = (groupId: string): void => {
        if (isDemo) return;
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
        setGroupSearch('');
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
        setGroupSearch('');
        setIsOpen(true);
    };

    const openDelete = (p: ProfessorWithRelations): void => {
        setToDelete(p);
        setDeleteError(null);
        setIsDelOpen(true);
    };

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: valida varios campos del formulario antes de enviar
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
        <>
            {/* Filter bar */}
            <div
                data-tour="professors-header"
                className="border-border flex items-center gap-2 border-b bg-white px-8 py-4"
            >
                <div className="relative max-w-sm flex-1">
                    <Search className="text-mute absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        placeholder="Buscar por nombre o RUT…"
                        className="border-border h-[38px] bg-white pl-9"
                    />
                </div>
                <div className="flex-1" />
                <span className="text-mute font-mono text-[11px] tracking-wider uppercase">
                    {professors.length} registrados
                </span>
            </div>

            <main className="flex-1 overflow-auto p-8">
                {professors.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <UserCog size={48} className="text-mute/20 mb-4" />
                        <p className="text-ink text-lg font-medium">
                            No hay profesores registrados
                        </p>
                        <p className="text-mute mt-1 text-sm">
                            Agrega el primero para comenzar a gestionar grupos.
                        </p>
                        <Button variant="primary" size="md" onClick={openCreate} className="mt-6">
                            <Plus size={16} />
                            Agregar profesor
                        </Button>
                    </Card>
                ) : (
                    <Card
                        data-tour="professors-list"
                        className="border-border overflow-visible p-0 shadow-sm"
                    >
                        <Table>
                            <TableHeader className="bg-paper">
                                <TableRow className="border-border border-b hover:bg-transparent">
                                    <TableHead>Profesor / Administrador</TableHead>
                                    <TableHead className="w-[160px]">RUT</TableHead>
                                    <TableHead className="w-[140px]">Rol</TableHead>
                                    <TableHead>Grupos Asignados</TableHead>
                                    <TableHead className="w-[130px]">Materias</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {professors
                                    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                                    .map((p) => (
                                        <TableRow
                                            key={p.id}
                                            className="group border-border h-16 border-b last:border-0"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        name={`${p.name} ${p.lastname}`}
                                                        size={32}
                                                        className="ring-border shadow-sm ring-1"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-ink text-[13.5px] leading-tight font-bold">
                                                            {p.name} {p.lastname}
                                                        </span>
                                                        <span className="text-mute text-[11.5px]">
                                                            {p.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-mute font-mono text-[12px]">
                                                {formatRut(p.rut)}
                                            </TableCell>
                                            <TableCell>
                                                <Tag
                                                    tone={
                                                        p.userRole?.name === 'Administrador'
                                                            ? 'primary'
                                                            : 'default'
                                                    }
                                                    className="h-5 text-[10px] font-bold"
                                                >
                                                    {p.userRole?.name ?? 'Profesor'}
                                                </Tag>
                                            </TableCell>
                                            <TableCell>
                                                {p.professorGroups.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {p.professorGroups.map((g) => (
                                                            <Tag
                                                                key={g.id}
                                                                tone="outline"
                                                                className="bg-paper-warm/50 border-border h-5 font-mono text-[10px]"
                                                            >
                                                                {g.name}
                                                            </Tag>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-mute text-[11.5px]">
                                                        —
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-ink-dim text-[13px] font-medium">
                                                    {p._count.taughtSections > 0
                                                        ? `${p._count.taughtSections} materia${p._count.taughtSections !== 1 ? 's' : ''}`
                                                        : '—'}
                                                </span>
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
                                                            onClick={() => openEdit(p)}
                                                            className="cursor-pointer gap-2 py-2.5"
                                                        >
                                                            <Edit2 size={14} /> Editar datos
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => openDelete(p)}
                                                            className="text-destructive focus:bg-danger-wash focus:text-destructive cursor-pointer gap-2 py-2.5"
                                                            disabled={isDemo}
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
                <DialogContent className="border-border overflow-hidden rounded-[22px] p-0 shadow-2xl sm:max-w-lg">
                    <div className="border-border bg-paper border-b px-6 py-5">
                        <DialogTitle className="font-display text-ink text-2xl">
                            {editing ? 'Ajustes del perfil' : 'Nuevo profesor'}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulario para crear o editar un profesor.
                        </DialogDescription>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
                        {errors.general && (
                            <p className="bg-danger-wash text-destructive border-destructive/10 rounded-[10px] border px-4 py-3 text-sm font-bold">
                                {errors.general}
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="prof-name"
                                    className="text-ink text-[13px] font-bold"
                                >
                                    Nombre
                                </label>
                                <Input
                                    id="prof-name"
                                    value={form.name}
                                    onChange={(e) => setField('name', e.target.value)}
                                    className={cn(
                                        'border-border h-11 rounded-[10px] bg-white',
                                        errors.name && 'border-destructive',
                                    )}
                                    autoFocus
                                    disabled={isDemo}
                                />
                                {errors.name && (
                                    <p className="text-destructive text-xs font-medium">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="prof-lastname"
                                    className="text-ink text-[13px] font-bold"
                                >
                                    Apellido
                                </label>
                                <Input
                                    id="prof-lastname"
                                    value={form.lastname}
                                    onChange={(e) => setField('lastname', e.target.value)}
                                    className={cn(
                                        'border-border h-11 rounded-[10px] bg-white',
                                        errors.lastname && 'border-destructive',
                                    )}
                                    disabled={isDemo}
                                />
                                {errors.lastname && (
                                    <p className="text-destructive text-xs font-medium">
                                        {errors.lastname}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="prof-email"
                                    className="text-ink text-[13px] font-bold"
                                >
                                    Email
                                </label>
                                <Input
                                    id="prof-email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setField('email', e.target.value)}
                                    className={cn(
                                        'border-border h-11 rounded-[10px] bg-white',
                                        errors.email && 'border-destructive',
                                    )}
                                    disabled={isDemo}
                                />
                                {errors.email && (
                                    <p className="text-destructive text-xs font-medium">
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-ink text-[13px] font-bold">RUT</span>
                                <RutField
                                    value={form.rut}
                                    onChange={(v) => setField('rut', v)}
                                    className="border-border h-11 rounded-[10px] bg-white"
                                    disabled={isDemo}
                                />
                                {errors.rut && (
                                    <p className="text-destructive text-[12px]">{errors.rut}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="prof-password"
                                    className="text-ink text-[13px] font-bold"
                                >
                                    Contraseña
                                </label>
                                <Input
                                    id="prof-password"
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setField('password', e.target.value)}
                                    placeholder={editing ? '••••••••' : undefined}
                                    className={cn(
                                        'border-border h-11 rounded-[10px] bg-white',
                                        errors.password && 'border-destructive',
                                    )}
                                    disabled={isDemo}
                                />
                                {errors.password && (
                                    <p className="text-destructive text-xs font-medium">
                                        {errors.password}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label
                                    htmlFor="prof-phone"
                                    className="text-ink text-[13px] font-bold"
                                >
                                    Teléfono
                                </label>
                                <Input
                                    id="prof-phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setField('phone', e.target.value)}
                                    placeholder="+56 9..."
                                    className="border-border h-11 rounded-[10px] bg-white"
                                    disabled={isDemo}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-ink text-[13px] font-bold">
                                Rol en el sistema
                            </span>
                            <SearchableSelect
                                value={form.roleName}
                                onChange={(v) =>
                                    setField('roleName', v as 'Profesor' | 'Administrador')
                                }
                                options={[
                                    { value: 'Profesor', label: 'Profesor (Solo sus grupos)' },
                                    {
                                        value: 'Administrador',
                                        label: 'Administrador (Toda la institución)',
                                    },
                                ]}
                                disabled={isDemo}
                            />
                        </div>

                        {groups.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <span className="text-ink text-[13px] font-bold">
                                    Grupos asociados
                                </span>

                                {/* Chips de grupos seleccionados */}
                                {form.groupIds.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {form.groupIds.map((id) => {
                                            const g = groups.find((gr) => gr.id === id);
                                            if (!g) return null;
                                            return (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    onClick={() => toggleGroup(id)}
                                                    className="bg-primary/8 text-primary border-primary/20 hover:bg-primary/15 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors"
                                                >
                                                    {g.name}
                                                    <X size={11} className="shrink-0 opacity-70" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Buscador + lista de grupos disponibles */}
                                <div className="border-border overflow-hidden rounded-[12px] border">
                                    <div className="border-border relative border-b">
                                        <Search
                                            size={13}
                                            className="text-mute pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                                        />
                                        <input
                                            value={groupSearch}
                                            onChange={(e) => setGroupSearch(e.target.value)}
                                            placeholder="Buscar grupo..."
                                            className="placeholder:text-mute text-ink w-full py-2 pr-3 pl-8 text-[13px] outline-none"
                                            disabled={isDemo}
                                        />
                                    </div>
                                    <div className="max-h-[180px] overflow-y-auto py-1">
                                        {(() => {
                                            const available = groups.filter(
                                                (g) =>
                                                    !form.groupIds.includes(g.id) &&
                                                    (!groupSearch.trim() ||
                                                        g.name
                                                            .toLowerCase()
                                                            .includes(groupSearch.toLowerCase())),
                                            );
                                            if (available.length === 0) {
                                                return (
                                                    <p className="text-mute px-3 py-4 text-center text-[12.5px]">
                                                        {groupSearch
                                                            ? 'Sin resultados'
                                                            : 'Todos los grupos ya están asignados'}
                                                    </p>
                                                );
                                            }
                                            return available.map((g) => (
                                                <button
                                                    key={g.id}
                                                    type="button"
                                                    onClick={() => toggleGroup(g.id)}
                                                    className="text-ink-dim hover:bg-primary-wash hover:text-primary flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors"
                                                >
                                                    <Plus
                                                        size={12}
                                                        className="text-mute shrink-0"
                                                    />
                                                    {g.name}
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-border flex items-center gap-2 border-t bg-white px-6 py-4">
                        {isDemo && (
                            <p className="text-muted-foreground mr-auto text-xs">
                                En modo demo no podés guardar cambios.
                            </p>
                        )}
                        <div className="ml-auto flex gap-2">
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
                                className="min-w-[140px]"
                            >
                                {isPending && <Loader2 className="mr-2 animate-spin" />}
                                {editing ? 'Guardar cambios' : 'Crear profesor'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete dialog */}
            <Dialog open={isDelOpen} onOpenChange={setIsDelOpen}>
                <DialogContent className="border-border rounded-[22px] shadow-2xl sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="font-display text-destructive text-2xl">
                            Eliminar acceso
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Confirmación para eliminar el acceso del profesor.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-ink-dim text-[14px] leading-relaxed">
                            ¿Estás seguro de eliminar el acceso de{' '}
                            <strong className="text-ink">
                                {toDelete?.name} {toDelete?.lastname}
                            </strong>
                            ? No podrá volver a ingresar al sistema.
                        </p>
                    </div>
                    {deleteError && (
                        <p className="bg-danger-wash text-destructive rounded-[10px] px-4 py-2 text-sm font-medium">
                            {deleteError}
                        </p>
                    )}
                    <DialogFooter className="mt-2 gap-2 sm:justify-end">
                        <Button
                            variant="ghost"
                            size="md"
                            onClick={() => setIsDelOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            size="md"
                            disabled={isPending}
                            onClick={handleDelete}
                        >
                            {isPending && <Loader2 className="mr-2 animate-spin" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
