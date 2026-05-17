'use client';

import type * as React from 'react';
import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { updatePlanLimits } from '@/features/admin-plan/actions/mutations';
import type { PlanLimits } from '@prisma/client';

const PLAN_LABELS: Record<string, string> = {
    FREE: 'Free',
    DOCENTE: 'Docente',
    COLEGIO: 'Colegio',
    INSTITUCIONAL: 'Institución',
};

const FIELD_LABELS: Record<string, string> = {
    maxGroups: 'Aulas',
    maxAdmins: 'Admins',
    maxProfessors: 'Profesores',
    maxStudents: 'Estudiantes',
    maxExamsPerYear: 'Exámenes/año',
};

const FIELDS = ['maxGroups', 'maxAdmins', 'maxProfessors', 'maxStudents', 'maxExamsPerYear'] as const;
type LimitField = (typeof FIELDS)[number];

type EditableLimits = Record<LimitField, number | null>;
type RowState = Record<string, EditableLimits>;

function initState(limits: PlanLimits[]): RowState {
    return Object.fromEntries(
        limits.map((l) => [
            l.plan,
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
}

export function PlanLimitsClient({ limits }: Props): React.JSX.Element {
    const [rows, setRows] = useState<RowState>(initState(limits));
    const [saving, setSaving] = useState<string | null>(null);

    function handleChange(plan: string, field: LimitField, value: string): void {
        const num = value === '' ? null : Number.parseInt(value, 10);
        setRows((prev) => ({
            ...prev,
            [plan]: { ...prev[plan]!, [field]: Number.isNaN(num) ? null : num },
        }));
    }

    async function handleSave(plan: string): Promise<void> {
        setSaving(plan);
        try {
            const result = await updatePlanLimits({ plan, ...rows[plan] });
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`Límites del plan ${PLAN_LABELS[plan]} actualizados`);
            }
        } catch {
            toast.error('Error al guardar');
        } finally {
            setSaving(null);
        }
    }

    return (
        <div className="overflow-x-auto rounded-[16px] border border-border bg-white">
            <table className="w-full text-[13px]">
                <thead>
                    <tr className="border-b border-border bg-paper">
                        <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-mute">Plan</th>
                        {FIELDS.map((f) => (
                            <th key={f} className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-mute">
                                {FIELD_LABELS[f]}
                            </th>
                        ))}
                        <th className="px-5 py-3" />
                    </tr>
                </thead>
                <tbody>
                    {limits.map((l) => {
                        const row = rows[l.plan];
                        if (!row) return null;
                        return (
                            <tr key={l.plan} className="border-b border-border last:border-0 hover:bg-paper/50 transition-colors">
                                <td className="px-5 py-4">
                                    <span className="font-semibold text-ink">{PLAN_LABELS[l.plan]}</span>
                                    {l.description && (
                                        <p className="mt-0.5 text-[11px] text-mute">{l.description}</p>
                                    )}
                                </td>
                                {FIELDS.map((field) => (
                                    <td key={field} className="px-4 py-4 text-center">
                                        <input
                                            type="number"
                                            min={1}
                                            value={row[field] ?? ''}
                                            onChange={(e) => handleChange(l.plan, field, e.target.value)}
                                            placeholder="∞"
                                            className="w-20 rounded-[6px] border border-border bg-paper px-2 py-1.5 text-center text-[13px] text-ink outline-none placeholder:text-mute/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        />
                                    </td>
                                ))}
                                <td className="px-5 py-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => void handleSave(l.plan)}
                                        disabled={saving === l.plan}
                                    >
                                        {saving === l.plan ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                            <Save className="size-3.5" />
                                        )}
                                        Guardar
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <p className="px-5 py-3 text-[12px] text-mute">
                Dejar en blanco = ilimitado. Los cambios aplican en el próximo intento de creación (caché de 60 s).
            </p>
        </div>
    );
}
