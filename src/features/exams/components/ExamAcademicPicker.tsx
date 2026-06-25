'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { useMemo } from 'react';

export interface CourseOption {
    id: string;
    name: string;
    programId: string | null;
    periodId: string;
    groupId: string | null;
    program: { id: string; name: string } | null;
    period: { id: string; name: string };
}

export const NO_PROGRAM = '__none__';
export const NO_PERIOD = '__none__';
export const NO_COURSE = '__none__';

export interface AcademicValue {
    programId: string;
    periodId: string;
    courseSectionId: string;
}

interface Props {
    courseSections: CourseOption[];
    value: AcademicValue;
    onChange: (patch: Partial<AcademicValue>) => void;
}

/**
 * Cascada Carrera → Semestre → Ramo. Las opciones se derivan de los ramos
 * accesibles al usuario (ya scopeados por rol en la página). El ramo es
 * opcional: "Sin asignatura" lo desvincula.
 */
export function ExamAcademicPicker({ courseSections, value, onChange }: Props) {
    const programs = useMemo(() => {
        const map = new Map<string, string>();
        for (const c of courseSections) {
            if (c.program) map.set(c.program.id, c.program.name);
        }
        return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
            a.name.localeCompare(b.name),
        );
    }, [courseSections]);

    const selectedProgram = value.programId === NO_PROGRAM ? null : value.programId;

    const periods = useMemo(() => {
        const map = new Map<string, string>();
        for (const c of courseSections) {
            if ((c.programId ?? null) === (selectedProgram ?? null)) {
                map.set(c.period.id, c.period.name);
            }
        }
        return Array.from(map, ([id, name]) => ({ id, name }));
    }, [courseSections, selectedProgram]);

    const selectedPeriod = value.periodId === NO_PERIOD ? null : value.periodId;

    const courses = useMemo(
        () =>
            courseSections.filter(
                (c) =>
                    (c.programId ?? null) === (selectedProgram ?? null) &&
                    (selectedPeriod === null || c.periodId === selectedPeriod),
            ),
        [courseSections, selectedProgram, selectedPeriod],
    );

    const empty = courseSections.length === 0;

    if (empty) {
        return (
            <p className="text-mute border-border bg-paper-warm/30 rounded-[10px] border px-4 py-3 text-[12px] leading-snug">
                Todavía no hay ramos creados. Podés vincular uno más tarde desde la sección
                Materias.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                    <span className="text-ink text-[13px] font-bold">Carrera</span>
                    <Select
                        value={value.programId}
                        onValueChange={(v) =>
                            onChange({ programId: v, periodId: NO_PERIOD, courseSectionId: NO_COURSE })
                        }
                    >
                        <SelectTrigger className="border-border data-[size=default]:h-11 rounded-[10px] bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-border rounded-xl shadow-xl">
                            <SelectItem value={NO_PROGRAM}>Sin carrera / Transversal</SelectItem>
                            {programs.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-ink text-[13px] font-bold">Semestre</span>
                    <Select
                        value={value.periodId}
                        onValueChange={(v) => onChange({ periodId: v, courseSectionId: NO_COURSE })}
                    >
                        <SelectTrigger className="border-border data-[size=default]:h-11 rounded-[10px] bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-border rounded-xl shadow-xl">
                            <SelectItem value={NO_PERIOD}>Sin semestre</SelectItem>
                            {periods.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <span className="text-ink text-[13px] font-bold">Ramo</span>
                <Select
                    value={value.courseSectionId}
                    onValueChange={(v) => onChange({ courseSectionId: v })}
                >
                    <SelectTrigger className="border-border data-[size=default]:h-11 rounded-[10px] bg-white">
                        <SelectValue placeholder="Sin asignatura" />
                    </SelectTrigger>
                    <SelectContent className="border-border rounded-xl shadow-xl">
                        <SelectItem value={NO_COURSE}>Sin asignatura</SelectItem>
                        {courses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                                {c.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-mute text-[11px] leading-snug">
                    Opcional. Vincula el examen a una materia del plan; no define quién lo rinde (lo
                    deciden los grupos).
                </p>
            </div>
        </div>
    );
}
