'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { updatePlanLimits } from '@/features/admin-plan/actions/mutations';
import {
    createCustomPlan,
    deleteCustomPlan,
    updateCustomPlan,
} from '@/features/admin-plan/actions/custom-plans';
import type { CustomPlan, Plan, PlanLimits } from '@prisma/client';

const PLAN_LABELS: Record<Plan, string> = {
    FREE: 'Free',
    DOCENTE: 'Docente',
    COLEGIO: 'Colegio',
    INSTITUCIONAL: 'Institución',
};

// Etiquetas legibles para cada planCode. El fallback usa el código crudo.
const PLAN_CODE_LABELS: Record<string, string> = {
    exams_free: 'Exámenes · Free',
    exams_docente: 'Exámenes · Docente',
    exams_colegio: 'Exámenes · Colegio',
    lms_free: 'Aula Virtual · Free',
    lms_colegio: 'Aula Virtual · Colegio',
    pack_completo: 'Pack completo (Exámenes + LMS)',
};

function planCodeLabel(code: string | null): string {
    if (!code) return 'Plan heredado';
    return PLAN_CODE_LABELS[code] ?? code;
}

const FIELD_LABELS: Record<string, string> = {
    maxGroups: 'Aulas',
    maxAdmins: 'Admins',
    maxProfessors: 'Profesores',
    maxStudents: 'Estudiantes',
    maxExamsPerYear: 'Exámenes/año',
};

const FIELDS = [
    'maxGroups',
    'maxAdmins',
    'maxProfessors',
    'maxStudents',
    'maxExamsPerYear',
] as const;
type LimitField = (typeof FIELDS)[number];

type EditableLimits = Record<LimitField, number | null>;
type RowState = Record<string, EditableLimits>;

function rowKey(plan: Plan, planCode: string | null): string {
    return `${plan}-${planCode ?? '__legacy__'}`;
}

function initState(limits: PlanLimits[]): RowState {
    return Object.fromEntries(
        limits.map((l) => [
            rowKey(l.plan, l.planCode),
            {
                maxGroups: l.maxGroups,
                maxAdmins: l.maxAdmins,
                maxProfessors: l.maxProfessors,
                maxStudents: l.maxStudents,
                maxExamsPerYear: l.maxExamsPerYear,
            },
        ]),
    );
}

interface Props {
    limits: PlanLimits[];
    customPlans: CustomPlan[];
}

interface CustomPlanForm extends EditableLimits {
    name: string;
    description: string;
}

function CustomPlanFormFields({
    initial,
    onSubmit,
    isPending,
}: {
    initial?: CustomPlan;
    onSubmit: (form: CustomPlanForm) => void;
    isPending: boolean;
}) {
    const [form, setForm] = useState<CustomPlanForm>({
        name: initial?.name ?? '',
        description: initial?.description ?? '',
        maxGroups: initial?.maxGroups ?? null,
        maxAdmins: initial?.maxAdmins ?? null,
        maxProfessors: initial?.maxProfessors ?? null,
        maxStudents: initial?.maxStudents ?? null,
        maxExamsPerYear: initial?.maxExamsPerYear ?? null,
    });

    function setLimit(field: LimitField, value: string): void {
        const num = value === '' ? null : Number.parseInt(value, 10);
        setForm((f) => ({ ...f, [field]: Number.isNaN(num) ? null : num }));
    }

    return (
        <div className="flex flex-col gap-5 py-4">
            <div className="flex flex-col gap-1.5">
                <label htmlFor="cp-name" className="text-ink text-[13px] font-bold">
                    Nombre del plan
                </label>
                <Input
                    id="cp-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Cortesía Colegio X"
                    className="border-border h-11 rounded-[10px] bg-white"
                    autoFocus
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                {FIELDS.map((field) => (
                    <div key={field} className="flex flex-col gap-1.5">
                        <label htmlFor={`cp-${field}`} className="text-ink text-[12.5px] font-bold">
                            {FIELD_LABELS[field]}
                        </label>
                        <Input
                            id={`cp-${field}`}
                            type="number"
                            min={1}
                            value={form[field] ?? ''}
                            onChange={(e) => setLimit(field, e.target.value)}
                            placeholder="∞ (ilimitado)"
                            className="border-border h-11 rounded-[10px] bg-white"
                        />
                    </div>
                ))}
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="cp-description" className="text-ink text-[12.5px] font-bold">
                    Descripción (opcional)
                </label>
                <Input
                    id="cp-description"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="border-border h-11 rounded-[10px] bg-white"
                />
            </div>
            <div className="flex justify-end">
                <Button
                    variant="ink"
                    size="md"
                    disabled={isPending || form.name.trim().length < 2}
                    onClick={() => onSubmit(form)}
                >
                    {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    {initial ? 'Guardar cambios' : 'Crear plan interno'}
                </Button>
            </div>
        </div>
    );
}

/**
 * Agrupa las filas por plan comercial para la tabla. Cada grupo mantiene el
 * orden de aparición en la DB (la seed los inserta en el orden deseado).
 */
function groupByPlan(limits: PlanLimits[]): Map<Plan, PlanLimits[]> {
    const map = new Map<Plan, PlanLimits[]>();
    for (const l of limits) {
        const list = map.get(l.plan) ?? [];
        list.push(l);
        map.set(l.plan, list);
    }
    return map;
}

export function PlanLimitsClient({ limits, customPlans }: Props) {
    const router = useRouter();
    const [rows, setRows] = useState<RowState>(initState(limits));
    const [saving, setSaving] = useState<string | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<CustomPlan | null>(null);
    const [deleting, setDeleting] = useState<CustomPlan | null>(null);
    const [pending, setPending] = useState(false);

    function handleChange(key: string, field: LimitField, value: string): void {
        const num = value === '' ? null : Number.parseInt(value, 10);
        setRows((prev) => ({
            ...prev,
            [key]: { ...(prev[key] as EditableLimits), [field]: Number.isNaN(num) ? null : num },
        }));
    }

    async function handleSave(plan: Plan, planCode: string | null): Promise<void> {
        const key = rowKey(plan, planCode);
        setSaving(key);
        try {
            const result = await updatePlanLimits({ plan, planCode, ...rows[key] });
            if (result.error) toast.error(result.error);
            else toast.success(`Límites actualizados`);
        } catch {
            toast.error('Error al guardar');
        } finally {
            setSaving(null);
        }
    }

    function openCreate(): void {
        setEditing(null);
        setFormOpen(true);
    }

    function openEdit(cp: CustomPlan): void {
        setEditing(cp);
        setFormOpen(true);
    }

    async function handleSubmitCustom(form: CustomPlanForm): Promise<void> {
        setPending(true);
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description,
                maxGroups: form.maxGroups,
                maxAdmins: form.maxAdmins,
                maxProfessors: form.maxProfessors,
                maxStudents: form.maxStudents,
                maxExamsPerYear: form.maxExamsPerYear,
            };
            const result = editing
                ? await updateCustomPlan(editing.id, payload)
                : await createCustomPlan(payload);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success(editing ? 'Plan interno actualizado' : 'Plan interno creado');
            setFormOpen(false);
            router.refresh();
        } finally {
            setPending(false);
        }
    }

    async function handleDelete(): Promise<void> {
        if (!deleting) return;
        setPending(true);
        try {
            const result = await deleteCustomPlan(deleting.id);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Plan interno eliminado');
            setDeleting(null);
            router.refresh();
        } finally {
            setPending(false);
        }
    }

    const grouped = groupByPlan(limits);
    const allRows = rows;

    return (
        <div className="flex flex-col gap-8">
            {/* Planes por producto (Exámenes / Aula Virtual) + legacy */}
            <section className="flex flex-col gap-3">
                <div className="flex items-end justify-between gap-3">
                    <h2 className="font-display text-ink text-lg font-bold">
                        Límites por pack de producto
                    </h2>
                    <span className="text-mute font-mono text-[10px] tracking-[0.1em] uppercase">
                        {limits.length} {limits.length === 1 ? 'fila' : 'filas'}
                    </span>
                </div>
                <p className="text-mute -mt-1 text-[12.5px]">
                    Cada plan comercial puede tener varios packs por producto
                    (Exámenes / LMS). Las filas con <code>planCode</code> nulo son los
                    planes heredados y se mantienen por compatibilidad.
                </p>
                <div className="border-border overflow-x-auto rounded-[16px] border bg-white">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="border-border bg-paper border-b">
                                <th className="text-mute px-5 py-3 text-left font-mono text-[10px] tracking-[0.1em] uppercase">
                                    Plan comercial
                                </th>
                                <th className="text-mute px-4 py-3 text-left font-mono text-[10px] tracking-[0.1em] uppercase">
                                    Pack (planCode)
                                </th>
                                {FIELDS.map((f) => (
                                    <th
                                        key={f}
                                        className="text-mute px-4 py-3 text-center font-mono text-[10px] tracking-[0.1em] uppercase"
                                    >
                                        {FIELD_LABELS[f]}
                                    </th>
                                ))}
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from(grouped.entries()).flatMap(([plan, rows]) =>
                                rows.map((l, idx) => {
                                    const key = rowKey(l.plan, l.planCode);
                                    const row = allRows[key];
                                    if (!row) return null;
                                    return (
                                        <tr
                                            key={key}
                                            className="border-border hover:bg-paper/50 border-b transition-colors last:border-0"
                                        >
                                            <td className="px-5 py-4 align-top">
                                                {idx === 0 ? (
                                                    <span className="text-ink font-semibold">
                                                        {PLAN_LABELS[plan]}
                                                    </span>
                                                ) : (
                                                    <span className="text-mute text-[12px]">↳</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 align-top">
                                                <span className="text-ink-dim font-mono text-[11.5px]">
                                                    {planCodeLabel(l.planCode)}
                                                </span>
                                                {l.description && (
                                                    <p className="text-mute mt-0.5 text-[10.5px]">
                                                        {l.description}
                                                    </p>
                                                )}
                                            </td>
                                            {FIELDS.map((field) => (
                                                <td key={field} className="px-4 py-4 text-center">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={row[field] ?? ''}
                                                        onChange={(e) =>
                                                            handleChange(
                                                                key,
                                                                field,
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="∞"
                                                        className="border-border text-ink placeholder:text-mute/40 focus:border-primary focus:ring-primary/20 w-20 rounded-[8px] border bg-white px-2 py-1.5 text-center text-[13px] outline-none focus:ring-2"
                                                    />
                                                </td>
                                            ))}
                                            <td className="px-5 py-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        void handleSave(l.plan, l.planCode)
                                                    }
                                                    disabled={saving === key}
                                                >
                                                    {saving === key ? (
                                                        <Loader2 className="size-3.5 animate-spin" />
                                                    ) : (
                                                        <Save className="size-3.5" />
                                                    )}
                                                    Guardar
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                }),
                            )}
                        </tbody>
                    </table>
                    <p className="text-mute px-5 py-3 text-[12px]">
                        Dejar en blanco = ilimitado. Los cambios aplican de inmediato a todas las
                        instituciones con ese pack.
                    </p>
                </div>
            </section>

            {/* Planes internos (CustomPlan) */}
            <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Lock size={16} className="text-mute" />
                        <h2 className="font-display text-ink text-lg font-bold">Planes internos</h2>
                    </div>
                    <Button variant="ink" size="md" className="gap-2" onClick={openCreate}>
                        <Plus size={16} />
                        Nuevo plan
                    </Button>
                </div>
                <p className="text-mute -mt-1 text-[12.5px]">
                    Planes a medida del SuperAdmin (cortesías, pruebas). No son visibles para el
                    cliente final y se asignan a una institución desde su ficha.
                </p>

                {customPlans.length === 0 ? (
                    <div className="border-border text-mute rounded-[16px] border border-dashed bg-white px-5 py-10 text-center text-sm">
                        Todavía no hay planes internos. Crea el primero con “Nuevo plan”.
                    </div>
                ) : (
                    <div className="border-border overflow-x-auto rounded-[16px] border bg-white">
                        <table className="w-full text-[13px]">
                            <thead>
                                <tr className="border-border bg-paper border-b">
                                    <th className="text-mute px-5 py-3 text-left font-mono text-[10px] tracking-[0.1em] uppercase">
                                        Nombre
                                    </th>
                                    {FIELDS.map((f) => (
                                        <th
                                            key={f}
                                            className="text-mute px-4 py-3 text-center font-mono text-[10px] tracking-[0.1em] uppercase"
                                        >
                                            {FIELD_LABELS[f]}
                                        </th>
                                    ))}
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {customPlans.map((cp) => (
                                    <tr
                                        key={cp.id}
                                        className="border-border hover:bg-paper/50 border-b transition-colors last:border-0"
                                    >
                                        <td className="px-5 py-4">
                                            <span className="text-ink font-semibold">{cp.name}</span>
                                            {cp.description && (
                                                <p className="text-mute mt-0.5 text-[11px]">
                                                    {cp.description}
                                                </p>
                                            )}
                                        </td>
                                        {FIELDS.map((field) => (
                                            <td
                                                key={field}
                                                className="text-ink-dim px-4 py-4 text-center font-mono"
                                            >
                                                {cp[field] === null ? '∞' : String(cp[field])}
                                            </td>
                                        ))}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => openEdit(cp)}
                                                    title="Editar"
                                                >
                                                    <Pencil size={15} className="text-mute" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => setDeleting(cp)}
                                                    title="Eliminar"
                                                >
                                                    <Trash2
                                                        size={15}
                                                        className="text-destructive"
                                                    />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Create / Edit dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="border-border max-w-lg overflow-hidden rounded-[22px] p-0 shadow-2xl">
                    <div className="border-border bg-paper border-b px-6 py-5">
                        <DialogTitle className="font-display text-ink text-2xl">
                            {editing ? 'Editar plan interno' : 'Nuevo plan interno'}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulario para crear o editar un plan interno.
                        </DialogDescription>
                    </div>
                    <div className="px-6">
                        <CustomPlanFormFields
                            key={editing?.id ?? 'new'}
                            initial={editing ?? undefined}
                            onSubmit={(form) => void handleSubmitCustom(form)}
                            isPending={pending}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete dialog */}
            <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
                <DialogContent className="border-border rounded-[22px] shadow-2xl sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="font-display text-destructive text-2xl">
                            Eliminar plan interno
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Confirmación para eliminar un plan interno.
                        </DialogDescription>
                    </DialogHeader>
                    <p className="text-ink-dim py-2 text-[14px] leading-relaxed">
                        ¿Eliminar <strong className="text-ink">{deleting?.name}</strong>? Las
                        instituciones que lo tengan asignado quedarán sin plan interno (vuelven a su
                        plan comercial).
                    </p>
                    <DialogFooter className="mt-2 gap-2 sm:justify-end">
                        <Button
                            variant="ghost"
                            size="md"
                            onClick={() => setDeleting(null)}
                            disabled={pending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            size="md"
                            onClick={() => void handleDelete()}
                            disabled={pending}
                        >
                            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}