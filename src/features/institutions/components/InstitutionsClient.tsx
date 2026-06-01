'use client';

import {
    assignInstitutionCustomPlan,
    createInstitution,
    deleteInstitution,
    setInstitutionPlan,
    toggleInstitutionActive,
    updateInstitution,
} from '@/features/institutions/actions/mutations';
import type { InstitutionRow } from '@/features/institutions/actions/queries';
import { institutionSchema } from '@/features/institutions/schemas/institution.schemas';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
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
import { Switch } from '@/shared/components/ui/switch';
import { Tag } from '@/shared/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { TablePaginator } from '@/shared/components/ui/table-paginator';
import type { PaginatedResult } from '@/shared/types/pagination';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, CreditCard, ExternalLink, Loader2, Pencil, Plus, Trash2, Search, MoreHorizontal, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { cn } from '@/shared/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

type InstitutionInput = z.infer<typeof institutionSchema>;

const PLAN_LABELS: Record<string, string> = {
    FREE: 'Free',
    DOCENTE: 'Docente',
    COLEGIO: 'Colegio',
    INSTITUCIONAL: 'Institucional',
};

const PLAN_TONE: Record<string, 'default' | 'success' | 'outline'> = {
    FREE: 'default',
    DOCENTE: 'outline',
    COLEGIO: 'outline',
    INSTITUCIONAL: 'success',
};

function formatDate(d: Date | null): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

interface CustomPlanOption {
    id: string;
    name: string;
}

interface Props {
    result: PaginatedResult<InstitutionRow>;
    q: string;
    customPlans: CustomPlanOption[];
}

type AssignPayload =
    | { kind: 'commercial'; plan: string; planExpiresAt: string }
    | { kind: 'custom'; customPlanId: string };

function PlanForm({
    row,
    customPlans,
    onSubmit,
    isPending,
}: {
    row: InstitutionRow;
    customPlans: CustomPlanOption[];
    onSubmit: (payload: AssignPayload) => void;
    isPending: boolean;
}): React.JSX.Element {
    const [kind, setKind] = useState<'commercial' | 'custom'>(row.customPlan ? 'custom' : 'commercial');
    const [plan, setPlan] = useState<string>(row.plan);
    const [expires, setExpires] = useState<string>(
        row.planExpiresAt ? new Date(row.planExpiresAt).toISOString().slice(0, 10) : '',
    );
    const [customPlanId, setCustomPlanId] = useState<string>(row.customPlan?.id ?? customPlans[0]?.id ?? '');

    const noCustom = customPlans.length === 0;

    return (
        <div className="flex flex-col gap-5 py-4">
            <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold text-ink">Tipo de plan</span>
                <Select value={kind} onValueChange={(v) => setKind(v as 'commercial' | 'custom')}>
                    <SelectTrigger className="h-11 rounded-[10px] border-border bg-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
                        <SelectItem value="commercial">Comercial</SelectItem>
                        <SelectItem value="custom" disabled={noCustom}>Interno</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {kind === 'commercial' ? (
                <>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-bold text-ink">Plan comercial</span>
                        <Select value={plan} onValueChange={setPlan}>
                            <SelectTrigger className="h-11 rounded-[10px] border-border bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border shadow-xl">
                                {Object.entries(PLAN_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="plan-expires" className="text-[13px] font-bold text-ink">
                            Vencimiento (opcional)
                        </label>
                        <Input
                            id="plan-expires"
                            type="date"
                            value={expires}
                            onChange={(e) => setExpires(e.target.value)}
                            disabled={plan === 'FREE'}
                            className="h-11 rounded-[10px]"
                        />
                        <p className="text-[11px] text-mute">
                            {plan === 'FREE'
                                ? 'El plan Free no tiene vencimiento.'
                                : 'Dejar en blanco para un plan sin fecha de vencimiento.'}
                        </p>
                    </div>
                </>
            ) : (
                <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-bold text-ink">Plan interno</span>
                    <Select value={customPlanId} onValueChange={setCustomPlanId}>
                        <SelectTrigger className="h-11 rounded-[10px] border-border bg-white">
                            <SelectValue placeholder="Seleccioná un plan interno" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border shadow-xl">
                            {customPlans.map((cp) => (
                                <SelectItem key={cp.id} value={cp.id}>{cp.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-[11px] text-mute">
                        Los planes internos se crean en Planes. No son visibles para el cliente final.
                    </p>
                </div>
            )}

            <div className="mt-2 flex justify-end gap-2">
                <Button
                    type="button"
                    variant="ink"
                    size="md"
                    disabled={isPending || (kind === 'custom' && !customPlanId)}
                    onClick={() =>
                        onSubmit(
                            kind === 'commercial'
                                ? { kind: 'commercial', plan, planExpiresAt: plan === 'FREE' ? '' : expires }
                                : { kind: 'custom', customPlanId },
                        )
                    }
                >
                    {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Asignar plan
                </Button>
            </div>
        </div>
    );
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="inst-name" className="text-[13px] font-bold text-ink">Nombre</label>
                    <Input id="inst-name" {...register('name')} className={cn("h-11 rounded-[10px]", errors.name && 'border-destructive')} />
                    {errors.name && <p className="text-xs text-destructive font-medium">{errors.name.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="inst-slug" className="text-[13px] font-bold text-ink">Slug (URL)</label>
                    <Input id="inst-slug" {...register('slug')} placeholder="ej: univ-talca" className={cn("h-11 rounded-[10px]", errors.slug && 'border-destructive')} />
                    {errors.slug && <p className="text-xs text-destructive font-medium">{errors.slug.message}</p>}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="inst-city" className="text-[13px] font-bold text-ink">Ciudad</label>
                    <Input id="inst-city" {...register('city')} className={cn("h-11 rounded-[10px]", errors.city && 'border-destructive')} />
                    {errors.city && <p className="text-xs text-destructive font-medium">{errors.city.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="inst-country" className="text-[13px] font-bold text-ink">País</label>
                    <Input id="inst-country" {...register('country')} className={cn("h-11 rounded-[10px]", errors.country && 'border-destructive')} />
                    {errors.country && <p className="text-xs text-destructive font-medium">{errors.country.message}</p>}
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="inst-address" className="text-[13px] font-bold text-ink">Dirección</label>
                <Input id="inst-address" {...register('address')} className={cn("h-11 rounded-[10px]", errors.address && 'border-destructive')} />
                {errors.address && <p className="text-xs text-destructive font-medium">{errors.address.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="inst-phone" className="text-[13px] font-bold text-ink">Teléfono</label>
                    <Input id="inst-phone" {...register('phone')} className={cn("h-11 rounded-[10px]", errors.phone && 'border-destructive')} />
                    {errors.phone && <p className="text-xs text-destructive font-medium">{errors.phone.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="inst-campus" className="text-[13px] font-bold text-ink">Campus (opcional)</label>
                    <Input id="inst-campus" {...register('campus')} className="h-11 rounded-[10px]" />
                </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <Button type="submit" disabled={isPending} variant="ink" size="md">
                    {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Guardar institución
                </Button>
            </div>
        </form>
    );
}

export function InstitutionsClient({ result, q: initialQ, customPlans }: Props): React.JSX.Element {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [search, setSearch] = useState(initialQ);
    const [createOpen, setCreateOpen] = useState(false);
    const [editRow, setEditRow] = useState<InstitutionRow | null>(null);
    const [deleteRow, setDeleteRow] = useState<InstitutionRow | null>(null);
    const [planRow, setPlanRow] = useState<InstitutionRow | null>(null);

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

    function handleAssignPlan(payload: AssignPayload): void {
        if (!planRow) return;
        startTransition(async () => {
            const result =
                payload.kind === 'commercial'
                    ? await setInstitutionPlan(planRow.id, {
                          plan: payload.plan,
                          planExpiresAt: payload.planExpiresAt,
                      })
                    : await assignInstitutionCustomPlan(planRow.id, payload.customPlanId);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Plan asignado');
            setPlanRow(null);
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

    return (
        <div className="flex flex-col min-h-screen bg-paper">
            {/* Header */}
            <AdminTopBar
                breadcrumb={['Sistema', 'Instituciones']}
                title="Instituciones"
                subtitle={`${result.total} entidades educativas registradas en la plataforma`}
                actions={
                    <Button variant="ink" size="md" onClick={() => setCreateOpen(true)} className="gap-2">
                        <Plus size={16} />
                        Nueva institución
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
                        placeholder="Buscar institución por nombre o slug..."
                        className="pl-9 h-[38px] border-border bg-white"
                    />
                </form>
                <div className="flex-1" />
                <span className="font-mono text-[11px] text-mute uppercase tracking-wider">
                    {result.total} registradas
                </span>
            </div>

            <main className="flex-1 p-8 overflow-auto">
                {result.items.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <Building2 size={48} className="mb-4 text-mute/20" />
                        <p className="text-lg font-medium text-ink">No hay instituciones</p>
                        <p className="mt-1 text-sm text-mute">Comienza registrando la primera entidad educativa.</p>
                        <Button variant="primary" size="md" onClick={() => setCreateOpen(true)} className="mt-6">
                            <Plus size={16} />
                            Nueva institución
                        </Button>
                    </Card>
                ) : (
                    <Card className="p-0 overflow-visible border-border shadow-sm">
                        <Table>
                            <TableHeader className="bg-paper">
                                <TableRow className="hover:bg-transparent border-b border-border">
                                    <TableHead>Nombre / Entidad</TableHead>
                                    <TableHead className="w-[180px]">Identificador</TableHead>
                                    <TableHead className="w-[160px]">Ubicación</TableHead>
                                    <TableHead className="w-[150px]">Plan</TableHead>
                                    <TableHead className="w-[100px] text-center">Usuarios</TableHead>
                                    <TableHead className="w-[110px] text-center">Estado</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {result.items.map((row) => (
                                    <TableRow key={row.id} className="group h-16 border-b border-border last:border-0">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-[10px] bg-primary-wash flex items-center justify-center text-primary shrink-0 border border-primary/10">
                                                    <Building2 size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-bold text-ink leading-tight">{row.name}</span>
                                                    <span className="text-[11.5px] text-mute">{row.phone}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Tag tone="outline" className="font-mono text-[11px] h-6 bg-paper-warm/50 border-border">
                                                /{row.slug}
                                            </Tag>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-mute">
                                                <MapPin size={12} className="shrink-0 opacity-60" />
                                                <span className="text-[12px] font-medium">{row.city}, {row.country}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                {row.customPlan ? (
                                                    <>
                                                        <Tag tone="outline" className="w-fit font-bold text-[10.5px] h-6 px-2.5 border-primary/30 text-primary">
                                                            {row.customPlan.name}
                                                        </Tag>
                                                        <span className="text-[10.5px] text-mute">plan interno</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Tag tone={PLAN_TONE[row.plan] ?? 'default'} className="w-fit font-bold text-[10.5px] h-6 px-2.5">
                                                            {PLAN_LABELS[row.plan] ?? row.plan}
                                                        </Tag>
                                                        {row.planExpiresAt && (
                                                            <span className="text-[10.5px] text-mute">
                                                                vence {formatDate(row.planExpiresAt)}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-[13px] font-bold text-ink-dim">
                                            {row._count.users}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                <Switch
                                                    checked={row.active}
                                                    onCheckedChange={() => handleToggleActive(row)}
                                                    disabled={isPending}
                                                    className="data-[state=checked]:bg-success"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon-sm" asChild title="Ir al panel">
                                                    <Link href={`/${row.slug}`}>
                                                        <ExternalLink size={16} className="text-primary" />
                                                    </Link>
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon-sm">
                                                            <MoreHorizontal size={16} className="text-mute" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl border-border shadow-xl w-44">
                                                        <DropdownMenuItem onClick={() => setEditRow(row)} className="gap-2 py-2 cursor-pointer">
                                                            <Pencil size={14} /> Editar datos
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setPlanRow(row)} className="gap-2 py-2 cursor-pointer">
                                                            <CreditCard size={14} /> Asignar plan
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setDeleteRow(row)} className="text-destructive gap-2 py-2 cursor-pointer focus:bg-danger-wash focus:text-destructive">
                                                            <Trash2 size={14} /> Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
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
                        <DialogTitle className="font-display text-2xl text-ink">Nueva institución</DialogTitle>
                        <DialogDescription className="sr-only">Formulario para registrar una nueva institución.</DialogDescription>
                    </div>
                    <div className="px-6">
                        <InstitutionForm onSubmit={handleCreate} isPending={isPending} />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit dialog */}
            <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
                <DialogContent className="max-w-lg rounded-[22px] border-border shadow-2xl overflow-hidden p-0">
                    <div className="px-6 py-5 border-b border-border bg-paper">
                        <DialogTitle className="font-display text-2xl text-ink">Editar institución</DialogTitle>
                        <DialogDescription className="sr-only">Formulario para editar los datos de la institución.</DialogDescription>
                    </div>
                    <div className="px-6">
                        {editRow && (
                            <InstitutionForm
                                defaultValues={{ ...editRow, campus: editRow.campus ?? undefined }}
                                onSubmit={handleUpdate}
                                isPending={isPending}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Plan dialog */}
            <Dialog open={!!planRow} onOpenChange={(o) => !o && setPlanRow(null)}>
                <DialogContent className="max-w-md rounded-[22px] border-border shadow-2xl overflow-hidden p-0">
                    <div className="px-6 py-5 border-b border-border bg-paper">
                        <DialogTitle className="font-display text-2xl text-ink">Asignar plan</DialogTitle>
                        <DialogDescription className="sr-only">Formulario para asignar un plan a la institución.</DialogDescription>
                        {planRow && (
                            <p className="mt-1 text-[12.5px] text-mute">{planRow.name}</p>
                        )}
                    </div>
                    <div className="px-6">
                        {planRow && (
                            <PlanForm row={planRow} customPlans={customPlans} onSubmit={handleAssignPlan} isPending={isPending} />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
                <DialogContent className="sm:max-w-sm rounded-[22px] border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl text-destructive">Eliminar institución</DialogTitle>
                        <DialogDescription className="sr-only">Confirmación para eliminar la institución de forma permanente.</DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-[14px] leading-relaxed text-ink-dim">
                            ¿Estás seguro de eliminar <strong className="text-ink">{deleteRow?.name}</strong>? Esta acción es irreversible.
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
