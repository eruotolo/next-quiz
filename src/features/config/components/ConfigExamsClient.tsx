'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, ScrollText } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/components/ui/table';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Tag } from '@/shared/components/ui/badge';

interface ExamItem {
    id: string;
    title: string;
    active: boolean;
    createdAt: Date;
    academicInstitution: { name: string; slug: string };
    createdBy: { name: string; lastname: string } | null;
    _count: { questions: number; results: number; groups: number };
}

interface Props {
    exams: ExamItem[];
}

const PER_PAGE = 15;

export function ConfigExamsClient({ exams }: Props) {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q) return exams;
        return exams.filter(
            (e) =>
                e.title.toLowerCase().includes(q) ||
                e.academicInstitution.name.toLowerCase().includes(q),
        );
    }, [exams, query]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginated = useMemo(
        () => filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE),
        [filtered, currentPage],
    );

    const handleQueryChange = (value: string) => {
        setQuery(value);
        setPage(1);
    };

    return (
        <main className="flex-1 overflow-auto p-8">
            {/* Filter */}
            <div className="mb-5">
                <Input
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder="Buscar por nombre o institución..."
                    className="border-border h-9 rounded-[10px] bg-white text-sm w-64"
                />
            </div>

            {filtered.length === 0 ? (
                <Card className="flex flex-col items-center justify-center border-dashed py-24">
                    <ScrollText size={48} className="text-mute/20 mb-4" />
                    <p className="text-ink text-lg font-medium">Sin resultados</p>
                    <p className="text-mute mt-1 text-sm">
                        No se encontraron exámenes con ese criterio de búsqueda.
                    </p>
                </Card>
            ) : (
                <>
                    <Card className="border-border bg-white shadow-sm rounded-[22px] overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Título
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Institución
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Creado por
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Estado
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-center">
                                        Preguntas
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-center">
                                        Resultados
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-center">
                                        Grupos
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Creado el
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-right">
                                        Acciones
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginated.map((e) => (
                                    <TableRow key={e.id}>
                                        <TableCell className="text-ink font-medium text-[13.5px] max-w-[220px] truncate">
                                            {e.title}
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/${e.academicInstitution.slug}/exams`}
                                                className="text-primary hover:underline text-[13px]"
                                            >
                                                {e.academicInstitution.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-mute text-[13px]">
                                            {e.createdBy
                                                ? `${e.createdBy.name} ${e.createdBy.lastname}`
                                                : <span className="italic opacity-50">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Tag
                                                tone={e.active ? 'success' : 'default'}
                                                className="h-5 text-[10px] font-bold"
                                            >
                                                {e.active ? 'Activo' : 'Inactivo'}
                                            </Tag>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-display text-ink text-[15px] font-bold">
                                                {e._count.questions}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-display text-ink text-[15px] font-bold">
                                                {e._count.results}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-display text-ink text-[15px] font-bold">
                                                {e._count.groups}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-mute font-mono text-[12px]">
                                            {new Date(e.createdAt).toLocaleDateString('es-CL')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/${e.academicInstitution.slug}/exams`}>
                                                <Button variant="ghost" size="sm" className="gap-1.5">
                                                    Ver institución{' '}
                                                    <ExternalLink size={12} />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-5 flex items-center justify-between">
                            <p className="text-mute font-mono text-[11px] font-bold tracking-[0.06em] uppercase">
                                {filtered.length} exámenes · página {currentPage} de {totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}
