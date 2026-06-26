'use client';

import { Button } from '@/shared/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TablePaginatorProps {
    page: number;
    perPage: number;
    total: number;
    onPageChange: (page: number) => void;
}

export function TablePaginator({ page, perPage, total, onPageChange }: TablePaginatorProps) {
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const from = total === 0 ? 0 : (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, total);

    return (
        <div className="border-border bg-paper-warm/30 flex items-center justify-between border-t px-4 py-2.5">
            <span className="text-mute font-mono text-[11px] tracking-wider uppercase">
                {total === 0 ? 'Sin resultados' : `${from}–${to} de ${total}`}
            </span>
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    aria-label="Página anterior"
                >
                    <ChevronLeft size={15} />
                </Button>
                <span className="text-ink-dim min-w-[56px] text-center font-mono text-[12px]">
                    {page} / {totalPages}
                </span>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    aria-label="Página siguiente"
                >
                    <ChevronRight size={15} />
                </Button>
            </div>
        </div>
    );
}
