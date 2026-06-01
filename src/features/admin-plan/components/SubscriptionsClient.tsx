'use client';

import type * as React from 'react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Download, ExternalLink, Search, XCircle } from 'lucide-react';
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
    getSubscriptions,
    cancelSubscription,
    exportSubscriptionsCSV,
} from '@/features/admin-plan/actions/mutations';
import type {
    SubscriptionRow,
    PaginatedSubscriptions,
    SubscriptionFilters,
} from '@/features/admin-plan/actions/mutations';
import { type Plan, SubscriptionStatus } from '@prisma/client';

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
    [SubscriptionStatus.pending]: 'Pendiente',
    [SubscriptionStatus.authorized]: 'Autorizado',
    [SubscriptionStatus.active]: 'Activo',
    [SubscriptionStatus.paused]: 'Pausado',
    [SubscriptionStatus.cancelled]: 'Cancelado',
    [SubscriptionStatus.failed]: 'Fallido',
};

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
    [SubscriptionStatus.pending]: 'bg-yellow-100 text-yellow-700',
    [SubscriptionStatus.authorized]: 'bg-blue-100 text-blue-700',
    [SubscriptionStatus.active]: 'bg-green-100 text-green-700',
    [SubscriptionStatus.paused]: 'bg-orange-100 text-orange-700',
    [SubscriptionStatus.cancelled]: 'bg-gray-100 text-gray-500',
    [SubscriptionStatus.failed]: 'bg-red-100 text-red-600',
};

const PLAN_LABELS: Record<Plan, string> = {
    FREE: 'Free',
    DOCENTE: 'Docente',
    COLEGIO: 'Colegio',
    INSTITUCIONAL: 'Institución',
};

function formatCLP(n: number | null): string {
    if (n === null) return '—';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(n);
}

function formatDate(d: Date | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

interface DetailModalProps {
    row: SubscriptionRow;
    onClose: () => void;
    onCancel: (id: string) => void;
    onViewDetail: (id: string) => void;
    cancelling: boolean;
}

function DetailModal({ row, onClose, onCancel, onViewDetail, cancelling }: DetailModalProps): React.JSX.Element {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Cerrar"
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Detalle de suscripción"
                className="relative w-full max-w-lg rounded-[20px] bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h3 className="font-display text-[20px] font-semibold tracking-tight text-ink">
                            Detalle de suscripción
                        </h3>
                        <p className="mt-0.5 font-mono text-[11px] text-mute">{row.id}</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-paper text-mute">
                        <XCircle size={18} />
                    </button>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
                    {[
                        ['Pagador', row.payerName ?? '—'],
                        ['Email', row.payerEmail ?? '—'],
                        ['Institución', row.institutionName ?? 'Sin registrar'],
                        ['Plan', PLAN_LABELS[row.plan]],
                        ['Modalidad', row.billing === 'monthly' ? 'Mensual' : 'Anual'],
                        ['Monto', formatCLP(row.amount)],
                        ['Estado', STATUS_LABELS[row.status]],
                        ['Fecha pago', formatDate(row.createdAt)],
                        ['Inicio', formatDate(row.startedAt)],
                        ['Vencimiento', formatDate(row.expiresAt)],
                        ['ID MP', row.mpSubscriptionId ?? '—'],
                    ].map(([label, value]) => (
                        <div key={label}>
                            <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-mute">{label}</dt>
                            <dd className="mt-0.5 break-all font-medium text-ink">{value}</dd>
                        </div>
                    ))}
                </dl>
                <div className="mt-6 flex justify-end gap-2">
                    {row.status !== SubscriptionStatus.cancelled && row.status !== SubscriptionStatus.failed && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => onCancel(row.id)}
                            disabled={cancelling}
                        >
                            Cancelar
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => onViewDetail(row.id)}
                    >
                        <ExternalLink size={13} />
                        Ver detalle
                    </Button>
                    <Button variant="ink" size="sm" onClick={onClose}>Cerrar</Button>
                </div>
            </div>
        </div>
    );
}

interface Props {
    initial: PaginatedSubscriptions;
}

export function SubscriptionsClient({ initial }: Props): React.JSX.Element {
    const router = useRouter();
    const [data, setData] = useState<PaginatedSubscriptions>(initial);
    const [filters, setFilters] = useState<SubscriptionFilters>({ page: 1 });
    const [search, setSearch] = useState('');
    const [detail, setDetail] = useState<SubscriptionRow | null>(null);
    const [isPending, startTransition] = useTransition();
    const [cancelling, setCancelling] = useState(false);

    function applyFilters(next: SubscriptionFilters): void {
        startTransition(async () => {
            const result = await getSubscriptions({ ...next, search: search || undefined });
            if (result.data) setData(result.data);
        });
        setFilters(next);
    }

    function handleSearch(q: string): void {
        setSearch(q);
        startTransition(async () => {
            const result = await getSubscriptions({ ...filters, page: 1, search: q || undefined });
            if (result.data) setData(result.data);
        });
    }

    async function handleCancel(id: string): Promise<void> {
        setCancelling(true);
        try {
            const result = await cancelSubscription(id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Suscripción cancelada');
                setDetail(null);
                applyFilters({ ...filters });
            }
        } finally {
            setCancelling(false);
        }
    }

    async function handleExport(): Promise<void> {
        const result = await exportSubscriptionsCSV({ ...filters, search: search || undefined });
        if (!result.data) { toast.error('Error al exportar'); return; }
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `suscripciones-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="flex flex-col min-h-screen bg-paper">
            <AdminTopBar
                breadcrumb={['Aulika · Plataforma', 'Panel Global', 'Suscripciones']}
                title="Suscripciones y pagos"
                subtitle={`${data.total} registros en total`}
                icon={<CreditCard size={18} />}
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
                        placeholder="Buscar pagador, email o institución..."
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
                        {(['FREE', 'DOCENTE', 'COLEGIO', 'INSTITUCIONAL'] as Plan[]).map((p) => (
                            <SelectItem key={p} value={p}>{PLAN_LABELS[p]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.status ?? 'all'}
                    onValueChange={(v) => applyFilters({ ...filters, status: v === 'all' ? undefined : (v as SubscriptionStatus), page: 1 })}
                >
                    <SelectTrigger className="h-[38px] w-40 border-border bg-white text-sm">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
                        <SelectItem value="all">Todos los estados</SelectItem>
                        {(Object.values(SubscriptionStatus) as SubscriptionStatus[]).map((s) => (
                            <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.billing ?? 'all'}
                    onValueChange={(v) => applyFilters({ ...filters, billing: v === 'all' ? undefined : v, page: 1 })}
                >
                    <SelectTrigger className="h-[38px] w-40 border-border bg-white text-sm">
                        <SelectValue placeholder="Modalidad" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
                        <SelectItem value="all">Mensual y Anual</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex-1" />
                <span className="font-mono text-[11px] text-mute uppercase tracking-wider">
                    {data.total} registros
                </span>
            </div>

            <main className="flex-1 p-8 overflow-auto">
                {data.rows.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center border-dashed py-24">
                        <CreditCard size={48} className="mb-4 text-mute/20" />
                        <p className="text-lg font-medium text-ink">
                            No hay suscripciones con los filtros seleccionados
                        </p>
                    </Card>
                ) : (
                    <Card className={cn('p-0 overflow-visible border-border shadow-sm transition-opacity', isPending && 'opacity-60')}>
                        <Table>
                            <TableHeader className="bg-paper">
                                <TableRow className="hover:bg-transparent border-b border-border">
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Pagador</TableHead>
                                    <TableHead>Institución</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Modalidad</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Inicio</TableHead>
                                    <TableHead>Vencimiento</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        onClick={() => setDetail(row)}
                                        className="group h-14 border-b border-border last:border-0 cursor-pointer"
                                    >
                                        <TableCell className="text-mute">{formatDate(row.createdAt)}</TableCell>
                                        <TableCell>
                                            <p className="font-medium text-ink">{row.payerName ?? '—'}</p>
                                            <p className="text-[12px] text-mute">{row.payerEmail ?? ''}</p>
                                        </TableCell>
                                        <TableCell>
                                            {row.institutionName ?? (
                                                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-medium text-yellow-700">
                                                    Sin registrar
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>{PLAN_LABELS[row.plan]}</TableCell>
                                        <TableCell className="text-mute">{row.billing === 'monthly' ? 'Mensual' : 'Anual'}</TableCell>
                                        <TableCell>{formatCLP(row.amount)}</TableCell>
                                        <TableCell>
                                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[row.status]}`}>
                                                {STATUS_LABELS[row.status]}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-mute">{formatDate(row.startedAt)}</TableCell>
                                        <TableCell className="text-mute">{formatDate(row.expiresAt)}</TableCell>
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

            {detail && (
                <DetailModal
                    row={detail}
                    onClose={() => setDetail(null)}
                    onCancel={(id) => void handleCancel(id)}
                    onViewDetail={(id) => router.push(`/config/subscriptions/${id}`)}
                    cancelling={cancelling}
                />
            )}
        </div>
    );
}
