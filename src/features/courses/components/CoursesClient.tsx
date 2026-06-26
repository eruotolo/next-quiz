'use client';

import { createCourse, updateCourse, deleteCourse } from '@/features/courses/actions/mutations';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Edit2, Loader2, Plus, Trash2, BookOpen, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useMemo } from 'react';
import { toast } from 'sonner';

import type { CourseSection, Program, AcademicPeriod, Group, User } from '@prisma/client';

interface GroupWithProfessors extends Group {
    professors: User[];
}

interface CourseSectionWithRelations extends CourseSection {
    program: Program | null;
    period: AcademicPeriod;
    group: GroupWithProfessors | null;
    professors: User[];
    _count: { exams: number };
    studentsCount: number;
}

interface Props {
    slug: string;
    courses: CourseSectionWithRelations[];
    programs: Program[];
    periods: AcademicPeriod[];
    groups: Group[];
    canMutate: boolean;
    courseLabel: string;
}

export function CoursesClient({
    slug,
    courses,
    programs,
    periods,
    groups,
    canMutate,
    courseLabel,
}: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isDelOpen, setIsDelOpen] = useState(false);
    const [editing, setEditing] = useState<CourseSectionWithRelations | null>(null);
    const [toDelete, setToDelete] = useState<CourseSectionWithRelations | null>(null);

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [programId, setProgramId] = useState<string>('none');
    const [periodId, setPeriodId] = useState<string>('');
    const [groupId, setGroupId] = useState<string>('none');
    const [error, setError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const openCreate = (): void => {
        setEditing(null);
        setName('');
        setCode('');
        setProgramId('none');
        setPeriodId(periods.length > 0 ? (periods[0]?.id ?? '') : '');
        setGroupId('none');
        setError(null);
        setIsOpen(true);
    };

    const openEdit = (c: CourseSectionWithRelations): void => {
        setEditing(c);
        setName(c.name);
        setCode(c.code ?? '');
        setProgramId(c.programId ?? 'none');
        setPeriodId(c.periodId);
        setGroupId(c.groupId ?? 'none');
        setError(null);
        setIsOpen(true);
    };

    const openDelete = (c: CourseSectionWithRelations): void => {
        setToDelete(c);
        setDeleteError(null);
        setIsDelOpen(true);
    };

    const filteredGroups = useMemo(() => {
        if (programId === 'none') return groups;
        return groups.filter((g) => g.programId === programId || !g.programId);
    }, [groups, programId]);

    const handleSave = (): void => {
        if (!name.trim()) {
            setError('El nombre es requerido.');
            return;
        }
        if (!periodId) {
            setError('El período es requerido.');
            return;
        }

        const payload = {
            name,
            code: code.trim() || null,
            programId: programId === 'none' ? null : programId,
            periodId,
            groupId: groupId === 'none' ? null : groupId,
            professorIds: [],
        };

        startTransition(async () => {
            const result = editing
                ? await updateCourse(slug, editing.id, payload)
                : await createCourse(slug, payload);

            if (result.error) {
                setError(result.error);
                return;
            }
            setIsOpen(false);
            toast.success(editing ? `${courseLabel} actualizada` : `${courseLabel} creada`);
            router.refresh();
        });
    };

    const handleDelete = (): void => {
        if (!toDelete) return;
        startTransition(async () => {
            const result = await deleteCourse(slug, toDelete.id);
            if (result.error) {
                setDeleteError(result.error);
                return;
            }
            setIsDelOpen(false);
            toast.success(`${courseLabel} eliminada`);
            router.refresh();
        });
    };

    return (
        <>
            <main className="flex-1 overflow-auto p-8">
                {courses.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <BookOpen size={48} className="text-mute/20 mb-4" />
                        <p className="text-ink text-lg font-medium">No hay registros</p>
                        <p className="text-mute mt-1 text-sm">
                            Crea la primera {courseLabel.toLowerCase()} para asignar profesores y
                            alumnos.
                        </p>
                        {canMutate && (
                            <Button
                                variant="primary"
                                size="md"
                                onClick={openCreate}
                                className="mt-6"
                            >
                                <Plus size={16} /> Nueva {courseLabel.toLowerCase()}
                            </Button>
                        )}
                    </Card>
                ) : (
                    <Card className="border-border overflow-hidden bg-white shadow-sm">
                        <div className="border-border flex items-center justify-between border-b px-6 py-4">
                            <h2 className="text-ink font-display text-xl font-bold capitalize">
                                {courseLabel}s
                            </h2>
                            {canMutate && (
                                <Button variant="primary" size="sm" onClick={openCreate}>
                                    <Plus size={14} className="mr-1" /> Nueva{' '}
                                    {courseLabel.toLowerCase()}
                                </Button>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-paper border-border border-b">
                                    <tr>
                                        <th className="text-mute px-6 py-3 text-left font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                            Materia
                                        </th>
                                        <th className="text-mute px-6 py-3 text-left font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                            Programa
                                        </th>
                                        <th className="text-mute px-6 py-3 text-left font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                            Período
                                        </th>
                                        <th className="text-mute px-6 py-3 text-left font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                            Profesor(es)
                                        </th>
                                        <th className="text-mute px-6 py-3 text-center font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                            Estudiantes
                                        </th>
                                        <th className="text-mute px-6 py-3 text-center font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                            Exámenes
                                        </th>
                                        <th className="px-6 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-border divide-y">
                                    {courses.map((c) => (
                                        <tr
                                            key={c.id}
                                            className="hover:bg-paper-warm/30 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="text-ink font-semibold">{c.name}</p>
                                                {c.code && (
                                                    <p className="text-mute font-mono text-xs">
                                                        {c.code}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="text-mute px-6 py-4 text-xs">
                                                {c.program?.name ?? 'Transversal'}
                                            </td>
                                            <td className="text-mute px-6 py-4 text-xs">
                                                {c.period?.name}
                                            </td>
                                            <td className="text-mute px-6 py-4 text-xs">
                                                {(c.group?.professors?.length ?? 0) > 0
                                                    ? c
                                                          .group!.professors.map(
                                                              (p) => `${p.name} ${p.lastname}`,
                                                          )
                                                          .join(', ')
                                                    : 'Sin asignar'}
                                            </td>
                                            <td className="text-ink px-6 py-4 text-center font-bold">
                                                {c.studentsCount}
                                            </td>
                                            <td className="text-ink px-6 py-4 text-center font-bold">
                                                {c._count.exams}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            className="text-mute border-0"
                                                        >
                                                            <MoreHorizontal size={16} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                router.push(
                                                                    `/${slug}/courses/${c.id}`,
                                                                )
                                                            }
                                                            className="cursor-pointer gap-2 py-2"
                                                        >
                                                            <BookOpen size={14} /> Ver detalle
                                                        </DropdownMenuItem>
                                                        {canMutate && (
                                                            <>
                                                                <DropdownMenuItem
                                                                    onClick={() => openEdit(c)}
                                                                    className="cursor-pointer gap-2 py-2"
                                                                >
                                                                    <Edit2 size={14} /> Editar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => openDelete(c)}
                                                                    className="text-destructive cursor-pointer gap-2 py-2"
                                                                >
                                                                    <Trash2 size={14} /> Eliminar
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </main>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="border-border rounded-[22px] shadow-2xl sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl">
                            {editing
                                ? `Editar ${courseLabel.toLowerCase()}`
                                : `Nueva ${courseLabel.toLowerCase()}`}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Formulario</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="course-form-name"
                                className="text-ink text-[13px] font-bold"
                            >
                                Nombre
                            </label>
                            <Input
                                id="course-form-name"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setError(null);
                                }}
                                className="border-border h-11 rounded-[10px] bg-white"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="course-form-code"
                                className="text-ink text-[13px] font-bold"
                            >
                                Código (opcional)
                            </label>
                            <Input
                                id="course-form-code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="border-border h-11 rounded-[10px] bg-white"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-ink text-[13px] font-bold">
                                Programa / Carrera (opcional)
                            </span>
                            <SearchableSelect
                                value={programId}
                                onChange={setProgramId}
                                options={[
                                    { value: 'none', label: 'Plan Común / Transversal' },
                                    ...programs.map((p) => ({ value: p.id, label: p.name })),
                                ]}
                                placeholder="Plan Común / Transversal"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-ink text-[13px] font-bold">
                                Período Académico
                            </span>
                            <SearchableSelect
                                value={periodId}
                                onChange={setPeriodId}
                                options={periods.map((p) => ({ value: p.id, label: p.name }))}
                                placeholder="Seleccioná un período"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-ink text-[13px] font-bold">
                                Grupo de alumnos (opcional)
                            </span>
                            <SearchableSelect
                                value={groupId}
                                onChange={setGroupId}
                                options={[
                                    {
                                        value: 'none',
                                        label: 'Sin grupo / Se creará automáticamente',
                                    },
                                    ...filteredGroups.map((g) => ({ value: g.id, label: g.name })),
                                ]}
                                placeholder="Sin grupo / Se creará automáticamente"
                            />
                        </div>

                        {error && (
                            <div className="text-destructive col-span-2 text-sm font-medium">
                                {error}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsOpen(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button variant="ink" onClick={handleSave} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 animate-spin" />} Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDelOpen} onOpenChange={setIsDelOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">
                            Eliminar {courseLabel.toLowerCase()}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de eliminar <strong>{toDelete?.name}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && <p className="text-destructive text-sm">{deleteError}</p>}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
