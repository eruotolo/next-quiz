'use client';

import { Button } from '@/shared/components/ui/button';
import { ChevronLeft, ChevronRight, TableIcon } from 'lucide-react';
import type React from 'react';

export interface ColumnDef<T> {
    key: string;
    header: string;
    className?: string;
    render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: ColumnDef<T>[];
    rows: T[];
    total: number;
    page: number;
    perPage: number;
    onPageChange: (page: number) => void;
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
    keyExtractor: (row: T) => string;
    isPending?: boolean;
}

export function DataTable<T>({
    columns,
    rows,
    total,
    page,
    perPage,
    onPageChange,
    onRowClick,
    emptyMessage = 'No hay registros.',
    keyExtractor,
    isPending = false,
}: DataTableProps<T>): React.JSX.Element {
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    if (rows.length === 0) {
        return (
            <div className="border-border flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white py-16">
                <TableIcon size={36} className="text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-[14px] font-medium">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={`border-border overflow-hidden rounded-2xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-opacity ${isPending ? 'opacity-60' : ''}`}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-border border-b">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`text-muted-foreground px-4 py-3 text-left text-[11px] font-semibold tracking-wide uppercase whitespace-nowrap ${col.className ?? ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                        {rows.map((row) => (
                            <tr
                                key={keyExtractor(row)}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                className={`hover:bg-muted/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={`px-4 py-3 text-[13px] whitespace-nowrap ${col.className ?? ''}`}
                                    >
                                        {col.render(row)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="border-border flex items-center justify-between border-t px-4 py-3">
                    <p className="text-muted-foreground text-[13px]">
                        Página{' '}
                        <span className="text-foreground font-semibold">{page}</span>
                        {' '}de{' '}
                        <span className="text-foreground font-semibold">{totalPages}</span>
                        {' '}·{' '}
                        {total.toLocaleString('es-CL')} registro{total !== 1 ? 's' : ''}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || isPending}
                            onClick={() => onPageChange(page - 1)}
                            className="gap-1"
                        >
                            <ChevronLeft size={14} />
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages || isPending}
                            onClick={() => onPageChange(page + 1)}
                            className="gap-1"
                        >
                            Siguiente
                            <ChevronRight size={14} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
