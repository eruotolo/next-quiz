'use client';

import { createGroup, updateGroup } from '@/features/groups/actions/mutations';
import { Button } from '@/shared/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { cn } from '@/shared/lib/utils';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

interface ProfessorOption {
    id: string;
    name: string;
    lastname: string;
}

interface ProgramInfo {
    id: string;
    name: string;
}

interface PeriodInfo {
    id: string;
    name: string;
}

interface CourseOption {
    id: string;
    name: string;
    programId: string | null;
    periodId: string;
    groups: { id: string; name: string }[];
}

export interface EditingGroup {
    id: string;
    name: string;
    stream: string | null;
    tutor: { id: string } | null;
    program: { id: string; name: string } | null;
    period: { id: string; name: string } | null;
    courseSections: { id: string; name: string }[];
}

interface Props {
    slug: string;
    open: boolean;
    onOpenChange: (v: boolean) => void;
    editing?: EditingGroup | null;
    professors: ProfessorOption[];
    programs: ProgramInfo[];
    periods: PeriodInfo[];
    courseSections: CourseOption[];
    disabled?: boolean;
}

const NO_TUTOR = '__none__';
const NO_PROGRAM = '__none__';
const NO_PERIOD = '__none__';

export function GroupForm({
    slug,
    open,
    onOpenChange,
    editing,
    professors,
    programs,
    periods,
    courseSections,
    disabled,
}: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [name, setName] = useState('');
    const [stream, setStream] = useState('');
    const [tutorId, setTutorId] = useState<string>(NO_TUTOR);
    const [programId, setProgramId] = useState<string>(NO_PROGRAM);
    const [periodId, setPeriodId] = useState<string>(NO_PERIOD);
    const [courseSectionIds, setCourseSectionIds] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Resetea el form al abrir (creación vacía o edición con los datos del grupo).
    useEffect(() => {
        if (!open) return;
        setName(editing?.name ?? '');
        setStream(editing?.stream ?? '');
        setTutorId(editing?.tutor?.id ?? NO_TUTOR);
        setProgramId(editing?.program?.id ?? NO_PROGRAM);
        setPeriodId(editing?.period?.id ?? NO_PERIOD);
        setCourseSectionIds(editing?.courseSections?.map((c) => c.id) ?? []);
        setError(null);
    }, [open, editing]);

    // D3 — los ramos se filtran por la carrera + semestre elegidos (coherencia).
    const filteredCourses = useMemo(() => {
        if (periodId === NO_PERIOD) return [];
        const prog = programId === NO_PROGRAM ? null : programId;
        return courseSections.filter(
            (c) => c.periodId === periodId && (c.programId ?? null) === (prog ?? null),
        );
    }, [courseSections, programId, periodId]);

    // Si cambia carrera/semestre, descarta los ramos seleccionados que ya no
    // pertenezcan al filtro (evita inconsistencias al mover selects).
    useEffect(() => {
        setCourseSectionIds((prev) =>
            prev.filter((id) => filteredCourses.some((c) => c.id === id)),
        );
    }, [filteredCourses]);

    const toggleCourse = (id: string): void => {
        setCourseSectionIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const handleSave = (): void => {
        if (!name.trim()) {
            setError('El nombre es requerido.');
            return;
        }
        const payload = {
            name,
            stream: stream.trim(),
            tutorId: tutorId === NO_TUTOR ? null : tutorId,
            programId: programId === NO_PROGRAM ? null : programId,
            periodId: periodId === NO_PERIOD ? null : periodId,
            courseSectionIds,
        };
        startTransition(async () => {
            const result = editing
                ? await updateGroup(slug, editing.id, payload)
                : await createGroup(slug, payload);
            if (result.error) {
                setError(result.error);
                return;
            }
            onOpenChange(false);
            toast.success(editing ? 'Grupo actualizado' : 'Grupo creado');
            router.refresh();
        });
    };

    const coursesDisabled = periodId === NO_PERIOD;
    const coursesHint =
        periodId === NO_PERIOD
            ? 'Elegí carrera y semestre primero'
            : filteredCourses.length === 0
              ? 'No hay ramos para esta carrera y semestre'
              : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-border rounded-[22px] shadow-2xl sm:max-w-3xl">
                <DialogTitle className="font-display text-2xl">
                    {editing ? 'Editar grupo' : 'Nuevo grupo'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    Formulario para crear o editar un grupo.
                </DialogDescription>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="group-form-name" className="text-ink text-[13px] font-bold">
                            Nombre del grupo
                        </label>
                        <Input
                            id="group-form-name"
                            placeholder="Ej: 4to Año B"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError(null);
                            }}
                            className={cn(
                                'border-border h-11 rounded-[10px] bg-white',
                                error && 'border-destructive',
                            )}
                            autoFocus
                            disabled={disabled}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="group-form-stream"
                            className="text-ink text-[13px] font-bold"
                        >
                            Mención / especialidad (opcional)
                        </label>
                        <Input
                            id="group-form-stream"
                            placeholder="Ej: Científico-Humanista"
                            value={stream}
                            onChange={(e) => setStream(e.target.value)}
                            className="border-border h-11 rounded-[10px] bg-white"
                            disabled={disabled}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="text-ink text-[13px] font-bold">
                            Profesor/a tutor/a (opcional)
                        </span>
                        <SearchableSelect
                            value={tutorId}
                            onChange={setTutorId}
                            placeholder="Sin tutor asignado"
                            options={[
                                { value: NO_TUTOR, label: 'Sin tutor asignado' },
                                ...professors.map((p) => ({
                                    value: p.id,
                                    label: `${p.name} ${p.lastname}`,
                                })),
                            ]}
                            disabled={disabled}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="text-ink text-[13px] font-bold">Carrera (opcional)</span>
                        <SearchableSelect
                            value={programId}
                            onChange={setProgramId}
                            placeholder="Sin carrera"
                            options={[
                                { value: NO_PROGRAM, label: 'Sin carrera / Transversal' },
                                ...programs.map((p) => ({ value: p.id, label: p.name })),
                            ]}
                            disabled={disabled}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="text-ink text-[13px] font-bold">Semestre (opcional)</span>
                        <SearchableSelect
                            value={periodId}
                            onChange={setPeriodId}
                            placeholder="Sin semestre"
                            options={[
                                { value: NO_PERIOD, label: 'Sin semestre' },
                                ...periods.map((p) => ({ value: p.id, label: p.name })),
                            ]}
                            disabled={disabled}
                        />
                    </div>

                    <div className="col-span-2 flex flex-col gap-2">
                        <span className="text-ink text-[13px] font-bold">
                            Ramos del grupo (opcional)
                        </span>
                        <div
                            className={cn(
                                'border-border h-40 overflow-y-auto rounded-[10px] border bg-white p-2',
                                coursesDisabled && 'opacity-50',
                            )}
                        >
                            {filteredCourses.length === 0 ? (
                                <p className="text-mute p-2 text-xs">{coursesHint}</p>
                            ) : (
                                filteredCourses.map((c) => {
                                    const otherGroups = c.groups.filter(
                                        (g) => g.id !== editing?.id,
                                    );
                                    return (
                                        <label
                                            key={c.id}
                                            className="flex cursor-pointer items-start gap-2 p-1 text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                className="mt-0.5"
                                                checked={courseSectionIds.includes(c.id)}
                                                onChange={() => toggleCourse(c.id)}
                                                disabled={coursesDisabled || !!disabled}
                                            />
                                            <span className="flex-1">
                                                <span>{c.name}</span>
                                                {otherGroups.length > 0 && (
                                                    <span className="text-mute ml-2 text-[11px]">
                                                        · En:{' '}
                                                        {otherGroups
                                                            .map((g) => g.name)
                                                            .join(', ')}
                                                    </span>
                                                )}
                                            </span>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {error && (
                        <p className="text-destructive col-span-2 text-sm font-medium">{error}</p>
                    )}
                </div>
                <DialogFooter className="gap-2">
                    {disabled && (
                        <p className="text-muted-foreground mr-auto text-xs">
                            En modo demo no podés guardar cambios.
                        </p>
                    )}
                    <Button
                        variant="ghost"
                        size="md"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="ink"
                        size="md"
                        disabled={isPending || !!disabled}
                        onClick={handleSave}
                    >
                        {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                        {editing ? 'Guardar cambios' : 'Crear grupo'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
