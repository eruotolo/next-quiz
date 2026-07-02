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
        <section className="bg-paper py-16 md:py-24">
            <div className="mx-auto max-w-[1200px] px-6">
                <div
                    className="bg-ink relative overflow-hidden rounded-[28px] px-8 py-12 lg:px-14 lg:py-16"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 85% 15%, rgba(214,255,31,0.18) 0%, transparent 55%), radial-gradient(circle at 5% 85%, rgba(31,46,255,0.35) 0%, transparent 55%)',
                    }}
                >
                    <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div>
                            <Tag tone="lime" size="sm" className="mb-4 font-bold">
                                <GraduationCap size={12} className="mr-1" />
                                AULIKA ONLINE · PACK COMPLETO
                            </Tag>
                            <h2 className="font-display text-[28px] leading-[1.05] font-bold tracking-[-0.02em] text-white sm:text-[36px]">
                                Pack Completo PAES
                            </h2>
                            <p className="mt-3 max-w-[520px] text-[14.5px] leading-relaxed text-white/70">
                                Cursos online por asignatura con ensayos tipo DEMRE, o el Pack
                                Completo con las 7 áreas a un precio promocional. Acceso inmediato
                                con tu RUT, certificado de aprobación incluido.
                            </p>
                            <div className="mt-6">
                                <Button
                                    asChild
                                    variant="lime"
                                    size="lg"
                                    className="h-14 px-8 text-[16px] font-bold"
                                >
                                    <Link href="/cursos">
                                        Comprar pack completo
                                        <ArrowRight className="ml-2 size-5" />
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="relative rounded-[20px] bg-white p-6 shadow-xl">
                            <div className="flex items-center gap-2">
                                <Layers size={16} className="text-primary" />
                                <span className="text-ink text-[13px] font-bold">
                                    Asignaturas incluidas
                                </span>
                            </div>
                            <ul className="mt-4 flex flex-col gap-2.5">
                                {SUBJECTS.map((title) => (
                                    <li
                                        key={title}
                                        className="text-ink-dim flex items-center gap-2.5 text-[13.5px]"
                                    >
                                        <BookOpen
                                            size={13}
                                            className="text-mute shrink-0 opacity-70"
                                        />
                                        {title}
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
