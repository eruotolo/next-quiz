'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Users } from 'lucide-react';
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

interface GroupItem {
    id: string;
    name: string;
    academicInstitution: { name: string; slug: string };
    program: { name: string } | null;
    period: { name: string } | null;
    _count: { users: number; exams: number };
}

interface Props {
    groups: GroupItem[];
}

const PER_PAGE = 15;

export function ConfigGroupsClient({ groups }: Props) {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q) return groups;
        return groups.filter(
            (g) =>
                g.name.toLowerCase().includes(q) ||
                g.academicInstitution.name.toLowerCase().includes(q),
        );
    }, [groups, query]);

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
                    <Users size={48} className="text-mute/20 mb-4" />
                    <p className="text-ink text-lg font-medium">Sin resultados</p>
                    <p className="text-mute mt-1 text-sm">
                        No se encontraron grupos con ese criterio de búsqueda.
                    </p>
                </Card>
            ) : (
                <>
                    <Card className="border-border bg-white shadow-sm rounded-[22px] overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Nombre
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Institución
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Programa
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Período
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-center">
                                        Estudiantes
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-center">
                                        Exámenes
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-right">
                                        Acciones
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginated.map((g) => (
                                    <TableRow key={g.id}>
                                        <TableCell className="text-ink font-medium text-[13.5px]">
                                            {g.name}
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/${g.academicInstitution.slug}/groups`}
                                                className="text-primary hover:underline text-[13px]"
                                            >
                                                {g.academicInstitution.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-mute text-[13px]">
                                            {g.program?.name ?? (
                                                <span className="italic opacity-50">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-mute text-[13px]">
                                            {g.period?.name ?? (
                                                <span className="italic opacity-50">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-display text-ink text-[15px] font-bold">
                                                {g._count.users}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-display text-ink text-[15px] font-bold">
                                                {g._count.exams}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/${g.academicInstitution.slug}/groups`}>
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
                                {filtered.length} grupos · página {currentPage} de {totalPages}
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
