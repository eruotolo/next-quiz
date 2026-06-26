'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FolderKanban } from 'lucide-react';
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

interface ProgramItem {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    academicInstitution: { name: string; slug: string };
    _count: { groups: number; courseSections: number; coordinators: number };
}

interface Props {
    programs: ProgramItem[];
}

const PER_PAGE = 15;

export function ConfigProgramsClient({ programs }: Props) {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q) return programs;
        return programs.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                (p.code?.toLowerCase().includes(q) ?? false) ||
                p.academicInstitution.name.toLowerCase().includes(q),
        );
    }, [programs, query]);

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
                    placeholder="Buscar por nombre, código o institución..."
                    className="border-border h-9 w-72 rounded-[10px] bg-white text-sm"
                />
            </div>

            {filtered.length === 0 ? (
                <Card className="flex flex-col items-center justify-center border-dashed py-24">
                    <FolderKanban size={48} className="text-mute/20 mb-4" />
                    <p className="text-ink text-lg font-medium">
                        {programs.length === 0 ? 'No hay programas registrados' : 'Sin resultados'}
                    </p>
                    <p className="text-mute mt-1 text-sm">
                        {programs.length === 0
                            ? 'Los programas se crean desde cada institución.'
                            : 'No se encontraron programas con ese criterio de búsqueda.'}
                    </p>
                </Card>
            ) : (
                <>
                    <Card className="border-border overflow-hidden rounded-[22px] bg-white shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Nombre
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Código
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Institución
                                    </TableHead>
                                    <TableHead className="text-mute text-center font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Grupos
                                    </TableHead>
                                    <TableHead className="text-mute text-center font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Materias
                                    </TableHead>
                                    <TableHead className="text-mute text-right font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Acciones
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginated.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="text-ink text-[13.5px] font-medium">
                                            {p.name}
                                            {p.description && (
                                                <span className="text-mute block max-w-xs truncate text-[11px] font-normal">
                                                    {p.description}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-mute font-mono text-[12px]">
                                            {p.code ?? <span className="italic opacity-40">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/${p.academicInstitution.slug}/programs`}
                                                className="text-primary text-[13px] hover:underline"
                                            >
                                                {p.academicInstitution.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-display text-ink text-[15px] font-bold">
                                                {p._count.groups}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-display text-ink text-[15px] font-bold">
                                                {p._count.courseSections}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/${p.academicInstitution.slug}/programs`}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="gap-1.5"
                                                >
                                                    Ver en institución <ExternalLink size={12} />
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
                                {filtered.length} programas · página {currentPage} de {totalPages}
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
