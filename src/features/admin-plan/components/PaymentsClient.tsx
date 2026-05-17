'use client';

import type * as React from 'react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import {
    getPayments,
    exportPaymentsCSV,
} from '@/features/admin-plan/actions/mutations';
import type {
    PaymentRow,
    PaginatedPayments,
    PaymentFilters,
} from '@/features/admin-plan/actions/mutations';
import { type Plan, PaymentStatus } from '@prisma/client';

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    [PaymentStatus.APPROVED]: 'Aprobado',
    [PaymentStatus.PENDING]: 'Pendiente',
    [PaymentStatus.REJECTED]: 'Rechazado',
    [PaymentStatus.REFUNDED]: 'Reembolsado',
};

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
    [PaymentStatus.APPROVED]: 'bg-green-100 text-green-700',
    [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-700',
    [PaymentStatus.REJECTED]: 'bg-red-100 text-red-600',
    [PaymentStatus.REFUNDED]: 'bg-purple-100 text-purple-700',
};

const PLAN_LABELS: Record<Plan, string> = {
    FREE: 'Free',
    DOCENTE: 'Docente',
    COLEGIO: 'Colegio',
    INSTITUCIONAL: 'Institución',
};

function formatCLP(n: number): string {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
    }).format(n);
}

function formatDate(d: Date | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
    });
}

interface Props {
    initial: PaginatedPayments;
}

export function PaymentsClient({ initial }: Props): React.JSX.Element {
    const router = useRouter();
    const [data, setData] = useState<PaginatedPayments>(initial);
    const [filters, setFilters] = useState<PaymentFilters>({ page: 1 });
    const [search, setSearch] = useState('');
    const [isPending, startTransition] = useTransition();

    function applyFilters(next: PaymentFilters): void {
        startTransition(async () => {
            const result = await getPayments({ ...next, search: search || undefined });
            if (result.data) setData(result.data);
        });
        setFilters(next);
    }

    function handleSearch(q: string): void {
        setSearch(q);
        startTransition(async () => {
            const result = await getPayments({ ...filters, page: 1, search: q || undefined });
            if (result.data) setData(result.data);
        });
    }

    async function handleExport(): Promise<void> {
        const result = await exportPaymentsCSV({
            ...filters,
            search: search || undefined,
        });
        if (!result.data) {
            toast.error('Error al exportar');
            return;
        }
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pagos-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function handleRowClick(row: PaymentRow): void {
        router.push(`/config/subscriptions/${row.subscriptionId}`);
    }

    const totalPages = Math.ceil(data.total / data.pageSize);

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-9 flex-1 items-center gap-2 rounded-[8px] border border-border bg-white px-3">
                    <Search size={14} className="shrink-0 text-mute" />
                    <input
                        type="search"
                        placeholder="Buscar institución…"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-mute/50"
                    />
                </div>

                <select
                    className="h-9 rounded-[8px] border border-border bg-white px-3 text-[13px] text-ink outline-none"
                    value={filters.plan ?? ''}
                    onChange={(e) =>
                        applyFilters({ ...filters, plan: (e.target.value as Plan) || undefined, page: 1 })
                    }
                >
                    <option value="">Todos los planes</option>
                    {(['DOCENTE', 'COLEGIO', 'INSTITUCIONAL'] as Plan[]).map((p) => (
                        <option key={p} value={p}>
                            {PLAN_LABELS[p]}
                        </option>
                    ))}
                </select>

                <select
                    className="h-9 rounded-[8px] border border-border bg-white px-3 text-[13px] text-ink outline-none"
                    value={filters.status ?? ''}
                    onChange={(e) =>
                        applyFilters({
                            ...filters,
                            status: (e.target.value as PaymentStatus) || undefined,
                            page: 1,
                        })
                    }
                >
                    <option value="">Todos los estados</option>
                    {(Object.values(PaymentStatus) as PaymentStatus[]).map((s) => (
                        <option key={s} value={s}>
                            {PAYMENT_STATUS_LABELS[s]}
                        </option>
                    ))}
                </select>

                <input
                    type="date"
                    className="h-9 rounded-[8px] border border-border bg-white px-3 text-[13px] text-ink outline-none"
                    value={filters.dateFrom ?? ''}
                    onChange={(e) =>
                        applyFilters({ ...filters, dateFrom: e.target.value || undefined, page: 1 })
                    }
                    placeholder="Desde"
                />

                <input
                    type="date"
                    className="h-9 rounded-[8px] border border-border bg-white px-3 text-[13px] text-ink outline-none"
                    value={filters.dateTo ?? ''}
                    onChange={(e) =>
                        applyFilters({ ...filters, dateTo: e.target.value || undefined, page: 1 })
                    }
                    placeholder="Hasta"
                />

                <Button variant="ghost" size="sm" onClick={() => void handleExport()}>
                    <Download size={14} />
                    Exportar CSV
                </Button>
            </div>

            {/* Table */}
            <div
                className={`overflow-x-auto rounded-[16px] border border-border bg-white transition-opacity ${isPending ? 'opacity-60' : ''}`}
            >
                <table className="w-full text-[13px]">
                    <thead>
                        <tr className="border-b border-border bg-paper">
                            {['Fecha', 'Institución', 'Plan', 'Modalidad', 'Monto', 'Estado', 'Período', 'Ver'].map(
                                (h) => (
                                    <th
                                        key={h}
                                        className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-mute whitespace-nowrap"
                                    >
                                        {h}
                                    </th>
                                ),
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {data.rows.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-mute">
                                    No hay pagos con los filtros seleccionados
                                </td>
                            </tr>
                        ) : (
                            data.rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-b border-border last:border-0 hover:bg-paper/50 transition-colors"
                                >
                                    <td className="px-4 py-3 whitespace-nowrap text-mute">
                                        {formatDate(row.paidAt ?? row.createdAt)}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-ink">
                                        {row.institutionName ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {PLAN_LABELS[row.subscriptionPlan]}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-mute">
                                        {row.subscriptionBilling === 'monthly' ? 'Mensual' : 'Anual'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap font-medium text-ink">
                                        {formatCLP(row.amount)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PAYMENT_STATUS_COLORS[row.status]}`}
                                        >
                                            {PAYMENT_STATUS_LABELS[row.status]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-mute">
                                        {row.periodStart
                                            ? `${formatDate(row.periodStart)} → ${formatDate(row.periodEnd)}`
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRowClick(row)}
                                            className="text-primary hover:text-primary/80"
                                        >
                                            Ver →
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-[13px] text-mute">
                    <span>
                        {data.total} registros · página {data.page}/{totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={data.page <= 1}
                            onClick={() =>
                                applyFilters({ ...filters, page: (filters.page ?? 1) - 1 })
                            }
                        >
                            <ChevronLeft size={14} />
                            Anterior
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={data.page >= totalPages}
                            onClick={() =>
                                applyFilters({ ...filters, page: (filters.page ?? 1) + 1 })
                            }
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
