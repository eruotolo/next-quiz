'use client';

import { createProfessor } from '@/features/professors/actions/mutations';
import { getGroupsForSlug } from '@/features/professors/actions/queries';
import { RutField } from '@/shared/components/ui/rut-field';
import { Button } from '@/shared/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { isValidRut, normalizeRut } from '@/shared/lib/rut';
import { cn } from '@/shared/lib/utils';
import type { Group } from '@prisma/client';
import { Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
    slug: string;
    isDemo?: boolean;
}

export function NewProfessorButton({ slug, isDemo }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [groups, setGroups] = useState<Group[]>([]);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'general', string>>>({});
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

    const validate = (): boolean => {
        const next: typeof errors = {};
        if (!form.name.trim()) next.name = 'Nombre requerido';
        if (!form.lastname.trim()) next.lastname = 'Apellido requerido';
        if (!emailRegex.test(form.email)) next.email = 'Email inválido';
        if (!form.rut.trim()) {
            next.rut = 'RUT requerido';
        } else if (!isValidRut(normalizeRut(form.rut))) {
            next.rut = 'RUT inválido';
        }
        if (!form.password) next.password = 'Contraseña requerida';
        else if (form.password.length < 8) next.password = 'Mínimo 8 caracteres';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleOpen = (): void => {
        setForm(emptyForm);
        setErrors({});
        startTransition(async () => {
            const fetched = await getGroupsForSlug(slug);
            setGroups(fetched);
            setOpen(true);
        });
    };

    const handleSubmit = (): void => {
        if (!validate()) return;
        startTransition(async () => {
            const result = await createProfessor(slug, form);
            if (result.error) {
                setErrors({ general: result.error });
                return;
            }
            setOpen(false);
            router.refresh();
        });
    };

    return (
        <>
            <Button
                variant="ink"
                size="md"
                className="gap-2"
                disabled={isPending}
                onClick={handleOpen}
            >
                {isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={16} />}
                Nuevo profesor
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="border-border overflow-hidden rounded-[22px] p-0 shadow-2xl sm:max-w-lg"
                >
                    <div className="border-border bg-paper-warm border-b px-6 py-5">
                        <DialogTitle className="font-display text-ink text-2xl">
                            Nuevo profesor
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulario para crear un nuevo profesor o administrador.
                        </DialogDescription>
                    </div>

                    <div className="space-y-4 overflow-y-auto px-6 py-6">
                        {errors.general && (
                            <p className="bg-danger-wash text-destructive border-destructive/10 rounded-[10px] border px-4 py-3 text-sm font-bold">
                                {errors.general}
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="np-name" className="text-ink text-[13px] font-bold">
                                    Nombre
                                </label>
                                <Input
                                    id="np-name"
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
                                    htmlFor="np-lastname"
                                    className="text-ink text-[13px] font-bold"
                                >
                                    Apellido
                                </label>
                                <Input
                                    id="np-lastname"
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
                                    htmlFor="np-email"
                                    className="text-ink text-[13px] font-bold"
                                >
                                    Email
                                </label>
                                <Input
                                    id="np-email"
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
                                    className={cn(
                                        'border-border h-11 rounded-[10px] bg-white',
                                        errors.rut && 'border-destructive',
                                    )}
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
                                    htmlFor="np-password"
                                    className="text-ink text-[13px] font-bold"
                                >
                                    Contraseña
                                </label>
                                <Input
                                    id="np-password"
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setField('password', e.target.value)}
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
                                    htmlFor="np-phone"
                                    className="text-ink text-[13px] font-bold"
                                >
                                    Teléfono
                                </label>
                                <Input
                                    id="np-phone"
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
                            <Select
                                value={form.roleName}
                                onValueChange={(v) =>
                                    setField('roleName', v as 'Profesor' | 'Administrador')
                                }
                                disabled={isDemo}
                            >
                                <SelectTrigger className="border-border h-11 rounded-[10px] bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-border rounded-xl shadow-xl">
                                    <SelectItem value="Profesor">
                                        Profesor (Solo sus grupos)
                                    </SelectItem>
                                    <SelectItem value="Administrador">
                                        Administrador (Toda la institución)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {groups.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <span className="text-ink text-[13px] font-bold">
                                    Grupos asociados
                                </span>
                                <div className="border-border bg-paper-warm/20 max-h-[140px] overflow-y-auto rounded-[12px] border p-2">
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
                                                    className="accent-primary border-border h-4 w-4 rounded"
                                                    disabled={isDemo}
                                                />
                                                <span className="text-ink text-[13.5px] font-medium">
                                                    {g.name}
                                                </span>
                                            </label>
                                        ))}
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
                                onClick={() => setOpen(false)}
                                disabled={isPending}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="ink"
                                size="md"
                                disabled={isPending || isDemo}
                                onClick={handleSubmit}
                                className="min-w-[140px]"
                            >
                                {isPending && <Loader2 className="mr-2 animate-spin" />}
                                Crear profesor
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
