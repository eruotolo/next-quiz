'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, CheckCircle2, ExternalLink } from 'lucide-react';
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
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Tag } from '@/shared/components/ui/badge';

interface PeriodItem {
    id: string;
    name: string;
    year: number;
    type: string;
    startDate: Date | null;
    endDate: Date | null;
    isActive: boolean;
    academicInstitution: { name: string; slug: string };
}

interface Props {
    periods: PeriodItem[];
}

const PER_PAGE = 15;

/** Build a sorted unique list of years from the periods data */
function getYears(periods: PeriodItem[]): number[] {
    return Array.from(new Set(periods.map((p) => p.year))).sort((a, b) => b - a);
}

export function ConfigPeriodsClient({ periods }: Props) {
    const [query, setQuery] = useState('');
    const [yearFilter, setYearFilter] = useState<string>('');
    const [page, setPage] = useState(1);

    const years = useMemo(() => getYears(periods), [periods]);

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        return periods.filter((p) => {
            const matchesQuery =
                !q ||
                p.name.toLowerCase().includes(q) ||
                p.academicInstitution.name.toLowerCase().includes(q) ||
                p.type.toLowerCase().includes(q);
            const matchesYear = !yearFilter || p.year === Number(yearFilter);
            return matchesQuery && matchesYear;
        });
    }, [periods, query, yearFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginated = useMemo(
        () => filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE),
        [filtered, currentPage],
    );

    const resetFilters = () => {
        setQuery('');
        setYearFilter('');
        setPage(1);
    };

    const handleQueryChange = (value: string) => {
        setQuery(value);
        setPage(1);
    };

    const handleYearChange = (value: string) => {
        setYearFilter(value);
        setPage(1);
    };

    const formatDate = (date: Date | null): string => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <main className="flex-1 overflow-auto p-8">
            {/* Filters */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
                <Input
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder="Buscar por nombre o institución..."
                    className="border-border h-9 w-72 rounded-[10px] bg-white text-sm"
                />
                <SearchableSelect
                    size="sm"
                    value={yearFilter || 'all'}
                    onChange={(v) => handleYearChange(v === 'all' ? '' : v)}
                    options={[
                        { value: 'all', label: 'Todos los años' },
                        ...years.map((y) => ({ value: String(y), label: String(y) })),
                    ]}
                    className="w-40"
                />
                {(query || yearFilter) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        className="text-mute text-[12px]"
                    >
                        Limpiar filtros
                    </Button>
                )}
            </div>

            {filtered.length === 0 ? (
                <Card className="flex flex-col items-center justify-center border-dashed py-24">
                    <CalendarDays size={48} className="text-mute/20 mb-4" />
                    <p className="text-ink text-lg font-medium">
                        {periods.length === 0
                            ? 'No hay períodos registrados'
                            : 'Sin resultados'}
                    </p>
                    <p className="text-mute mt-1 text-sm">
                        {periods.length === 0
                            ? 'Los períodos se crean desde cada institución.'
                            : 'No se encontraron períodos con ese criterio de búsqueda.'}
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
                                        Institución
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Año
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Tipo
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                                        Fechas
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-center">
                                        Estado
                                    </TableHead>
                                    <TableHead className="text-mute font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-right">
                                        Acciones
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginated.map((p) => (
                                    <TableRow
                                        key={p.id}
                                        className="hover:bg-paper-warm/30 transition-colors"
                                    >
                                        <TableCell className="text-ink font-semibold text-[13.5px]">
                                            {p.name}
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/${p.academicInstitution.slug}/periods`}
                                                className="text-primary hover:underline text-[13px]"
                                            >
                                                {p.academicInstitution.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-mute text-[13px]">
                                            {p.year}
                                        </TableCell>
                                        <TableCell className="text-mute text-[13px]">
                                            {p.type}
                                        </TableCell>
                                        <TableCell className="text-mute text-xs">
                                            {formatDate(p.startDate)}
                                            {' a '}
                                            {formatDate(p.endDate)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {p.isActive ? (
                                                <Tag tone="success" className="font-bold">
                                                    <CheckCircle2
                                                        size={12}
                                                        className="mr-1 inline"
                                                    />
                                                    Activo
                                                </Tag>
                                            ) : (
                                                <Tag tone="default">Inactivo</Tag>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={`/${p.academicInstitution.slug}/periods`}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="gap-1.5"
                                                >
                                                    Ver en institución{' '}
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
                                {filtered.length} períodos · página {currentPage} de {totalPages}
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
