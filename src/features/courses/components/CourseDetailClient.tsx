'use client';

import { useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { GraduationCap, BookOpen, Plus } from 'lucide-react';
import Link from 'next/link';

interface Student {
    id: string;
    name: string | null;
    lastname: string | null;
    rut: string | null;
    email: string;
}

interface Exam {
    id: string;
    title: string;
    active: boolean;
    scheduledAt: string | null;
    closesAt: string | null;
    _count: { questions: number };
}

interface Props {
    slug: string;
    courseSectionId: string;
    students: Student[];
    exams: Exam[];
}

type Tab = 'students' | 'exams';

export function CourseDetailClient({ slug, courseSectionId, students, exams }: Props) {
    const [tab, setTab] = useState<Tab>('students');

    return (
        <Card className="border-border overflow-hidden bg-white shadow-sm">
            <div className="border-border flex items-center justify-between border-b px-6 py-3">
                <div className="flex gap-1">
                    <button
                        type="button"
                        onClick={() => setTab('students')}
                        className={cn(
                            'flex items-center gap-2 rounded-[8px] px-4 py-2 text-[13px] font-medium transition-colors',
                            tab === 'students'
                                ? 'bg-primary-wash text-primary font-bold'
                                : 'text-ink-dim hover:bg-paper-warm hover:text-ink',
                        )}
                    >
                        <GraduationCap size={15} />
                        Alumnos
                        <span
                            className={cn(
                                'font-mono text-[10px]',
                                tab === 'students' ? 'text-primary' : 'text-mute',
                            )}
                        >
                            {students.length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('exams')}
                        className={cn(
                            'flex items-center gap-2 rounded-[8px] px-4 py-2 text-[13px] font-medium transition-colors',
                            tab === 'exams'
                                ? 'bg-primary-wash text-primary font-bold'
                                : 'text-ink-dim hover:bg-paper-warm hover:text-ink',
                        )}
                    >
                        <BookOpen size={15} />
                        Exámenes
                        <span
                            className={cn(
                                'font-mono text-[10px]',
                                tab === 'exams' ? 'text-primary' : 'text-mute',
                            )}
                        >
                            {exams.length}
                        </span>
                    </button>
                </div>

                {tab === 'exams' && (
                    <Button asChild variant="primary" size="sm">
                        <Link href={`/${slug}/exams?courseSectionId=${courseSectionId}`}>
                            <Plus size={14} className="mr-1" /> Crear examen
                        </Link>
                    </Button>
                )}
            </div>

            {tab === 'students' &&
                (students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <GraduationCap size={40} className="text-mute/20 mb-3" />
                        <p className="text-ink text-sm font-medium">Sin alumnos inscriptos</p>
                        <p className="text-mute mt-1 text-xs">
                            Asigna un grupo a esta materia para ver los alumnos.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-paper border-border border-b">
                                <tr>
                                    <th className="text-mute px-6 py-3 text-left font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Alumno
                                    </th>
                                    <th className="text-mute px-6 py-3 text-left font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        RUT
                                    </th>
                                    <th className="text-mute px-6 py-3 text-left font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Email
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-border divide-y">
                                {students.map((s) => (
                                    <tr
                                        key={s.id}
                                        className="hover:bg-paper-warm/30 transition-colors"
                                    >
                                        <td className="text-ink px-6 py-3 font-semibold">
                                            {s.name} {s.lastname}
                                        </td>
                                        <td className="text-mute px-6 py-3 font-mono text-xs">
                                            {s.rut ?? '—'}
                                        </td>
                                        <td className="text-mute px-6 py-3 text-xs">{s.email}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}

            {tab === 'exams' &&
                (exams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <BookOpen size={40} className="text-mute/20 mb-3" />
                        <p className="text-ink text-sm font-medium">Sin exámenes creados</p>
                        <p className="text-mute mt-1 text-xs">
                            Crea el primero usando el botón de arriba.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-paper border-border border-b">
                                <tr>
                                    <th className="text-mute px-6 py-3 text-left font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Título
                                    </th>
                                    <th className="text-mute px-6 py-3 text-center font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Preguntas
                                    </th>
                                    <th className="text-mute px-6 py-3 text-center font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Estado
                                    </th>
                                    <th className="text-mute px-6 py-3 text-left font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Disponible
                                    </th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-border divide-y">
                                {exams.map((e) => (
                                    <tr
                                        key={e.id}
                                        className="hover:bg-paper-warm/30 transition-colors"
                                    >
                                        <td className="text-ink px-6 py-3 font-semibold">
                                            {e.title}
                                        </td>
                                        <td className="text-mute px-6 py-3 text-center font-mono text-xs">
                                            {e._count.questions}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span
                                                className={cn(
                                                    'inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold',
                                                    e.active
                                                        ? 'bg-success/10 text-success'
                                                        : 'bg-paper-warm text-mute',
                                                )}
                                            >
                                                {e.active ? 'Publicado' : 'Borrador'}
                                            </span>
                                        </td>
                                        <td className="text-mute px-6 py-3 text-xs">
                                            {e.scheduledAt
                                                ? new Date(e.scheduledAt).toLocaleDateString(
                                                      'es-CL',
                                                  )
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                                className="border-0 text-xs"
                                            >
                                                <Link href={`/${slug}/exams/${e.id}/edit`}>
                                                    Editar
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
        </Card>
    );
}
