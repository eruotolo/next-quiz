'use client';

import {
    createProfessor,
    deleteProfessor,
    updateProfessor,
} from '@/features/professors/actions/mutations';
import { RutInput } from '@/features/students/components/RutInput';
import { Button } from '@/shared/components/ui/button';
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
import { formatRut, isValidRut, normalizeRut } from '@/shared/lib/rut';
import type { Group, Prisma } from '@prisma/client';
import { Edit2, Loader2, Plus, Trash2, UserCog } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: legacy complex UI component
export function ProfessorsClient({ professors, groups, slug: _slug }: Props): React.ReactElement {
    const router = useRouter();
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

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: legacy complex UI component
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
            try {
                if (editing) await updateProfessor(editing.id, form);
                else await createProfessor(form);
                setIsOpen(false);
                router.refresh();
            } catch (err: unknown) {
                const msg =
                    err instanceof Error && err.message.includes('Unique constraint')
                        ? 'Ya existe un profesor con ese email o RUT.'
                        : 'Ocurrió un error. Intentá de nuevo.';
                setErrors({ general: msg });
            }
        });
    };

    const handleDelete = (): void => {
        if (!toDelete) return;
        startTransition(async () => {
            try {
                await deleteProfessor(toDelete.id);
                setIsDelOpen(false);
                router.refresh();
            } catch {
                setDeleteError('Ocurrió un error al eliminar. Intentá de nuevo.');
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-foreground text-2xl font-bold">Profesores</h1>
                    <p className="text-muted-foreground text-sm">
                        {professors.length} profesor{professors.length !== 1 ? 'es' : ''}{' '}
                        registrado{professors.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button className="rounded-full" onClick={openCreate}>
                    <Plus size={16} />
                    Nuevo profesor
                </Button>
            </div>

            {/* Table / empty state */}
            {professors.length === 0 ? (
                <div className="border-border flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white py-20">
                    <UserCog size={40} className="text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground font-medium">Todavía no hay profesores</p>
                    <p className="text-muted-foreground/70 mt-1 text-sm">
                        Agregá el primero para comenzar.
                    </p>
                    <Button className="mt-4 rounded-full" size="sm" onClick={openCreate}>
                        <Plus size={14} />
                        Agregar profesor
                    </Button>
                </div>
            ) : (
                <div className="border-border overflow-hidden rounded-2xl border bg-white shadow-sm">
                    <table className="w-full">
                        <thead className="border-border bg-muted/50 border-b">
                            <tr>
                                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Profesor
                                </th>
                                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    RUT
                                </th>
                                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Rol
                                </th>
                                <th className="text-muted-foreground px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                    Grupos
                                </th>
                                <th className="text-muted-foreground px-6 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-border divide-y">
                            {professors.map((p) => (
                                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                                                {p.name[0]}
                                                {p.lastname[0]}
                                            </div>
                                            <div>
                                                <p className="text-foreground font-medium">
                                                    {p.name} {p.lastname}
                                                </p>
                                                <p className="text-muted-foreground text-sm">
                                                    {p.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-muted-foreground px-6 py-4 font-mono text-sm">
                                        {formatRut(p.rut)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {p.userRole?.name === 'Administrador' ? (
                                            <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                                                Administrador
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                                Profesor
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {p.professorGroups.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {p.professorGroups.map((g) => (
                                                    <span
                                                        key={g.id}
                                                        className="bg-primary/10 text-primary inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                                                    >
                                                        {g.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">
                                                Sin grupos
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-lg"
                                                onClick={() => openEdit(p)}
                                            >
                                                <Edit2 size={13} />
                                                Editar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg"
                                                onClick={() => openDelete(p)}
                                            >
                                                <Trash2 size={13} />
                                                Eliminar
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create/Edit dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Editar profesor' : 'Nuevo profesor'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                        {errors.general && (
                            <p className="bg-destructive/10 text-destructive rounded-xl px-4 py-2 text-sm">
                                {errors.general}
                            </p>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="professor-name" className="text-foreground text-sm font-medium">
                                    Nombre
                                </label>
                                <Input
                                    id="professor-name"
                                    value={form.name}
                                    onChange={(e) => setField('name', e.target.value)}
                                    className={errors.name ? 'border-destructive' : ''}
                                    autoFocus
                                />
                                {errors.name && (
                                    <p className="text-destructive text-xs">{errors.name}</p>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="professor-lastname" className="text-foreground text-sm font-medium">
                                    Apellido
                                </label>
                                <Input
                                    id="professor-lastname"
                                    value={form.lastname}
                                    onChange={(e) => setField('lastname', e.target.value)}
                                    className={errors.lastname ? 'border-destructive' : ''}
                                />
                                {errors.lastname && (
                                    <p className="text-destructive text-xs">{errors.lastname}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="professor-email" className="text-foreground text-sm font-medium">Email</label>
                            <Input
                                id="professor-email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setField('email', e.target.value)}
                                className={errors.email ? 'border-destructive' : ''}
                            />
                            {errors.email && (
                                <p className="text-destructive text-xs">{errors.email}</p>
                            )}
                        </div>
                        <RutInput
                            label="RUT"
                            value={form.rut}
                            onChange={(v) => setField('rut', v)}
                            error={errors.rut}
                        />
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="professor-password" className="text-foreground text-sm font-medium">
                                Contraseña
                            </label>
                            <Input
                                id="professor-password"
                                type="password"
                                value={form.password}
                                onChange={(e) => setField('password', e.target.value)}
                                placeholder={
                                    editing ? 'Dejar en blanco para no cambiar' : undefined
                                }
                                className={errors.password ? 'border-destructive' : ''}
                            />
                            {errors.password && (
                                <p className="text-destructive text-xs">{errors.password}</p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="professor-phone" className="text-foreground text-sm font-medium">
                                Teléfono{' '}
                                <span className="text-muted-foreground font-normal">(opcional)</span>
                            </label>
                            <Input
                                id="professor-phone"
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setField('phone', e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="professor-role" className="text-foreground text-sm font-medium">Rol</label>
                            <Select
                                value={form.roleName}
                                onValueChange={(v) =>
                                    setField('roleName', v as 'Profesor' | 'Administrador')
                                }
                            >
                                <SelectTrigger id="professor-role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Profesor">Profesor</SelectItem>
                                    <SelectItem value="Administrador">Administrador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {groups.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <span className="text-foreground text-sm font-medium">
                                    Grupos asignados
                                </span>
                                <div className="border-border max-h-40 space-y-1 overflow-y-auto rounded-xl border p-3">
                                    {groups.map((g) => (
                                        <label
                                            key={g.id}
                                            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-50"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={form.groupIds.includes(g.id)}
                                                onChange={() => toggleGroup(g.id)}
                                                className="accent-primary h-4 w-4 rounded"
                                            />
                                            <span className="text-foreground text-sm">
                                                {g.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setIsOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="rounded-full"
                            disabled={isPending}
                            onClick={handleSave}
                        >
                            {isPending && <Loader2 className="animate-spin" />}
                            {editing ? 'Guardar cambios' : 'Crear profesor'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete dialog */}
            <Dialog open={isDelOpen} onOpenChange={setIsDelOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Eliminar profesor</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground text-sm">
                        ¿Estás seguro de eliminar a{' '}
                        <strong className="text-foreground">
                            {toDelete?.name} {toDelete?.lastname}
                        </strong>
                        ? Esta acción no se puede deshacer.
                    </p>
                    {deleteError && (
                        <p className="bg-destructive/10 text-destructive rounded-xl px-4 py-2 text-sm">
                            {deleteError}
                        </p>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setIsDelOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            className="rounded-full"
                            disabled={isPending}
                            onClick={handleDelete}
                        >
                            {isPending && <Loader2 className="animate-spin" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
