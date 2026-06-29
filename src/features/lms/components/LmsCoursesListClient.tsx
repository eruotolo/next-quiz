'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
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
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { BookOpen, Edit2, Plus, Trash2, MoreHorizontal, Eye, EyeOff } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createLmsCourse, deleteLmsCourse, updateLmsCourse } from '@/features/lms/actions/courses';

interface CourseSectionOption {
    id: string;
    name: string;
}

interface Course {
    id: string;
    title: string;
    description: string | null;
    published: boolean;
    coverImageUrl: string | null;
    courseSectionId: string | null;
    _count: { modules: number; enrollments: number };
}

interface Props {
    slug: string;
    courses: Course[];
    courseSections: CourseSectionOption[];
}

export function LmsCoursesListClient({ slug, courses, courseSections }: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState<Course | null>(null);
    const [toDelete, setToDelete] = useState<Course | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [courseSectionId, setCourseSectionId] = useState('none');
    const [published, setPublished] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const openCreate = () => {
        setEditing(null);
        setTitle('');
        setDescription('');
        setCourseSectionId('none');
        setPublished(false);
        setError(null);
        setIsOpen(true);
    };

    const openEdit = (c: Course) => {
        setEditing(c);
        setTitle(c.title);
        setDescription(c.description ?? '');
        setCourseSectionId(c.courseSectionId ?? 'none');
        setPublished(c.published);
        setError(null);
        setIsOpen(true);
    };

    const handleSave = () => {
        if (!title.trim()) {
            setError('El título es requerido.');
            return;
        }
        const payload = {
            title: title.trim(),
            description: description.trim() || null,
            coverImageUrl: null,
            courseSectionId: courseSectionId === 'none' ? null : courseSectionId,
            published,
        };
        startTransition(async () => {
            const result = editing
                ? await updateLmsCourse(slug, editing.id, payload)
                : await createLmsCourse(slug, payload);
            if (result.error) {
                setError(result.error);
                return;
            }
            toast.success(editing ? 'Curso actualizado' : 'Curso creado');
            setIsOpen(false);
            router.refresh();
        });
    };

    const handleDelete = () => {
        if (!toDelete) return;
        startTransition(async () => {
            const result = await deleteLmsCourse(slug, toDelete.id);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Curso eliminado');
            setToDelete(null);
            router.refresh();
        });
    };

    return (
        <>
            {courses.length === 0 ? (
                <Card className="flex flex-col items-center justify-center border-dashed py-20">
                    <BookOpen size={48} className="text-mute/20 mb-4" />
                    <p className="text-ink font-display text-lg font-bold">No hay cursos en el Aula</p>
                    <p className="text-mute mt-1 text-sm">
                        Creá el primer curso para empezar a cargar contenido.
                    </p>
                    <Button variant="primary" size="md" onClick={openCreate} className="mt-6">
                        <Plus size={16} className="mr-1" /> Nuevo curso
                    </Button>
                </Card>
            ) : (
                <Card className="border-border overflow-hidden bg-white shadow-sm">
                    <div className="border-border flex items-center justify-between border-b px-6 py-4">
                        <h2 className="text-ink font-display text-xl font-bold">Cursos del Aula Virtual</h2>
                        <Button variant="primary" size="sm" onClick={openCreate}>
                            <Plus size={14} className="mr-1" /> Nuevo curso
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-paper border-border border-b">
                                <tr>
                                    <th className="text-mute px-6 py-3 text-left font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Curso
                                    </th>
                                    <th className="text-mute px-6 py-3 text-center font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Módulos
                                    </th>
                                    <th className="text-mute px-6 py-3 text-center font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Inscriptos
                                    </th>
                                    <th className="text-mute px-6 py-3 text-center font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-border divide-y">
                                {courses.map((c) => (
                                    <tr key={c.id} className="hover:bg-paper-warm/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-ink font-semibold">{c.title}</p>
                                            {c.description && (
                                                <p className="text-mute line-clamp-1 text-xs">
                                                    {c.description}
                                                </p>
                                            )}
                                        </td>
                                        <td className="text-ink px-6 py-4 text-center font-bold">
                                            {c._count.modules}
                                        </td>
                                        <td className="text-ink px-6 py-4 text-center font-bold">
                                            {c._count.enrollments}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={
                                                    c.published
                                                        ? 'bg-success/10 text-success inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold'
                                                        : 'bg-paper-warm text-mute inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold'
                                                }
                                            >
                                                {c.published ? 'Publicado' : 'Borrador'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon-sm">
                                                        <MoreHorizontal size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link
                                                            href={`/${slug}/aula/${c.id}`}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Edit2 size={14} /> Editar contenido
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openEdit(c)}>
                                                        <Edit2 size={14} /> Editar datos
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setToDelete(c)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 size={14} /> Eliminar
                                                    </DropdownMenuItem>
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

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="border-border rounded-[22px] shadow-2xl sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl">
                            {editing ? 'Editar curso' : 'Nuevo curso'}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Formulario de curso</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="lms-title" className="text-ink text-[13px] font-bold">
                                Título
                            </label>
                            <Input
                                id="lms-title"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    setError(null);
                                }}
                                className="border-border h-11 rounded-[10px] bg-white"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="lms-desc" className="text-ink text-[13px] font-bold">
                                Descripción
                            </label>
                            <textarea
                                id="lms-desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="border-border rounded-[10px] border bg-white px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-ink text-[13px] font-bold">
                                Materia asociada (opcional)
                            </span>
                            <SearchableSelect
                                value={courseSectionId}
                                onChange={setCourseSectionId}
                                options={[
                                    { value: 'none', label: 'Sin materia asociada' },
                                    ...courseSections.map((cs) => ({ value: cs.id, label: cs.name })),
                                ]}
                                placeholder="Sin materia asociada"
                            />
                        </div>
                        <label className="text-ink flex cursor-pointer items-center gap-2 text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={published}
                                onChange={(e) => setPublished(e.target.checked)}
                                className="border-border h-4 w-4 rounded"
                            />
                            {published ? (
                                <Eye size={14} />
                            ) : (
                                <EyeOff size={14} className="text-mute" />
                            )}
                            {published ? 'Publicado' : 'En borrador'}
                        </label>
                        {error && <p className="text-destructive text-sm">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button variant="ink" onClick={handleSave} disabled={isPending}>
                            {editing ? 'Guardar cambios' : 'Crear curso'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">Eliminar curso</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Eliminar <strong>{toDelete?.title}</strong> y todos sus módulos y lecciones?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
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
