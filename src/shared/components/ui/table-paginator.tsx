'use client';

import { Button } from '@/shared/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TablePaginatorProps {
    page: number;
    perPage: number;
    total: number;
    onPageChange: (page: number) => void;
}

export function TablePaginator({ page, perPage, total, onPageChange }: TablePaginatorProps): React.JSX.Element {
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const from = total === 0 ? 0 : (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, total);

    return (
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 bg-paper-warm/30">
            <span className="font-mono text-[11px] text-mute uppercase tracking-wider">
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
                <span className="font-mono text-[12px] text-ink-dim min-w-[56px] text-center">
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
