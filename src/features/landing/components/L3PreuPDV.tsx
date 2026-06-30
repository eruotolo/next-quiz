import Link from 'next/link';
import { ArrowRight, BookOpen, GraduationCap, Layers } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Tag } from '@/shared/components/ui/badge';

const SUBJECTS = [
    'Competencia Matemática M1',
    'Competencia Matemática M2',
    'Competencia Lectora',
    'Ciencias — Biología, Química y Física',
    'Historia y Ciencias Sociales',
];

export function L3PreuPDV() {
    return (
        <section className="border-border border-b bg-white py-16 md:py-24">
            <div className="mx-auto max-w-[1400px] px-6 md:px-14">
                <div
                    className="bg-paper-warm border-border relative overflow-hidden rounded-[32px] border px-8 py-16 lg:px-16"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 90% 10%, rgba(31,46,255,0.08) 0%, transparent 55%)',
                    }}
                >
                    <div className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div>
                            <Tag tone="default" size="sm" className="mb-4 font-bold">
                                <GraduationCap size={12} className="mr-1" />
                                AULIKA ONLINE · PAES
                            </Tag>
                            <h2 className="text-ink font-display text-[32px] leading-[1.05] font-bold tracking-[-0.02em] sm:text-[44px]">
                                ¿Preparando la PAES? Llevá la asignatura que te falta.
                            </h2>
                            <p className="text-ink-dim mt-4 max-w-[520px] text-[15.5px] leading-relaxed">
                                Cursos online por asignatura con ensayos tipo DEMRE, o el Pack
                                Completo con las 7 áreas a un precio promocional. Acceso inmediato
                                con tu RUT, certificado de aprobación incluido.
                            </p>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Button
                                    asChild
                                    variant="primary"
                                    size="lg"
                                    className="h-12 px-7 text-[15px] font-bold"
                                >
                                    <Link href="/cursos">
                                        Ver catálogo de cursos
                                        <ArrowRight className="ml-2 size-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="border-border rounded-[20px] border bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Layers size={16} className="text-primary" />
                                <span className="text-ink text-[13px] font-bold">
                                    Asignaturas disponibles
                                </span>
                            </div>
                            <ul className="mt-4 flex flex-col gap-2.5">
                                {SUBJECTS.map((s) => (
                                    <li
                                        key={s}
                                        className="text-ink-dim flex items-center gap-2.5 text-[13.5px]"
                                    >
                                        <BookOpen
                                            size={13}
                                            className="text-mute shrink-0 opacity-70"
                                        />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                            <div className="border-border mt-5 flex items-center justify-between border-t pt-4">
                                <span className="text-mute text-[11.5px] font-medium">
                                    Pack Completo · todas las áreas
                                </span>
                                <span className="text-ink font-display text-[15px] font-bold">
                                    $450.000
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
