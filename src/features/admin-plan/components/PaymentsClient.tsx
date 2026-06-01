'use client';

import type * as React from 'react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Download, ExternalLink, Search, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { TablePaginator } from '@/shared/components/ui/table-paginator';
import { cn } from '@/shared/lib/utils';
import {
    getPayments,
    exportPaymentsCSV,
} from '@/features/admin-plan/actions/mutations';
import type {
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

    return (
        <div className="flex flex-col min-h-screen bg-paper">
            <AdminTopBar
                breadcrumb={['Aulika · Plataforma', 'Panel Global', 'Pagos']}
                title="Pagos"
                subtitle={`${data.total} cobros registrados`}
                icon={<Wallet size={18} />}
                actions={
                    <Button variant="ghost" size="sm" onClick={() => void handleExport()} className="gap-1.5">
                        <Download size={14} />
                        Exportar CSV
                    </Button>
                }
            />

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-white px-8 py-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mute" />
                    <Input
                        type="search"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Buscar institución..."
                        className="pl-9 h-[38px] border-border bg-white"
                    />
                </div>

                <Select
                    value={filters.plan ?? 'all'}
                    onValueChange={(v) => applyFilters({ ...filters, plan: v === 'all' ? undefined : (v as Plan), page: 1 })}
                >
                    <SelectTrigger className="h-[38px] w-44 border-border bg-white text-sm">
                        <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
                        <SelectItem value="all">Todos los planes</SelectItem>
                        {(['DOCENTE', 'COLEGIO', 'INSTITUCIONAL'] as Plan[]).map((p) => (
                            <SelectItem key={p} value={p}>{PLAN_LABELS[p]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.status ?? 'all'}
                    onValueChange={(v) => applyFilters({ ...filters, status: v === 'all' ? undefined : (v as PaymentStatus), page: 1 })}
                >
                    <SelectTrigger className="h-[38px] w-40 border-border bg-white text-sm">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
                        <SelectItem value="all">Todos los estados</SelectItem>
                        {(Object.values(PaymentStatus) as PaymentStatus[]).map((s) => (
                            <SelectItem key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-mute whitespace-nowrap">Desde</span>
                    <Input
                        type="date"
                        value={filters.dateFrom ?? ''}
                        onChange={(e) => applyFilters({ ...filters, dateFrom: e.target.value || undefined, page: 1 })}
                        className="h-[38px] w-36 border-border bg-white"
                    />
                </div>

                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-mute whitespace-nowrap">Hasta</span>
                    <Input
                        type="date"
                        value={filters.dateTo ?? ''}
                        onChange={(e) => applyFilters({ ...filters, dateTo: e.target.value || undefined, page: 1 })}
                        className="h-[38px] w-36 border-border bg-white"
                    />
                </div>

                <div className="flex-1" />
                <span className="font-mono text-[11px] text-mute uppercase tracking-wider">
                    {data.total} cobros
                </span>
            </div>

            <main className="flex-1 p-8 overflow-auto">
                {data.rows.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <Wallet size={48} className="mb-4 text-mute/20" />
                        <p className="text-lg font-medium text-ink">
                            No hay pagos con los filtros seleccionados
                        </p>
                    </Card>
                ) : (
                    <Card className={cn('p-0 overflow-visible border-border shadow-sm transition-opacity', isPending && 'opacity-60')}>
                        <Table>
                            <TableHeader className="bg-paper">
                                <TableRow className="hover:bg-transparent border-b border-border">
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Institución</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Modalidad</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Período</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.rows.map((row) => (
                                    <TableRow key={row.id} className="group h-14 border-b border-border last:border-0">
                                        <TableCell className="text-mute">{formatDate(row.paidAt ?? row.createdAt)}</TableCell>
                                        <TableCell className="font-medium text-ink">{row.institutionName ?? '—'}</TableCell>
                                        <TableCell>{PLAN_LABELS[row.subscriptionPlan]}</TableCell>
                                        <TableCell className="text-mute">{row.subscriptionBilling === 'monthly' ? 'Mensual' : 'Anual'}</TableCell>
                                        <TableCell className="font-medium text-ink">{formatCLP(row.amount)}</TableCell>
                                        <TableCell>
                                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PAYMENT_STATUS_COLORS[row.status]}`}>
                                                {PAYMENT_STATUS_LABELS[row.status]}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-mute">
                                            {row.periodStart ? `${formatDate(row.periodStart)} → ${formatDate(row.periodEnd)}` : '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => router.push(`/config/subscriptions/${row.subscriptionId}`)}
                                                title="Ver suscripción"
                                            >
                                                <ExternalLink size={16} className="text-primary" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <TablePaginator
                            page={data.page}
                            perPage={10}
                            total={data.total}
                            onPageChange={(p) => applyFilters({ ...filters, page: p })}
                        />
                    </Card>
                )}
            </main>
        </div>
    );
}
