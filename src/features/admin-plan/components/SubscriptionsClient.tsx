'use client';

import type * as React from 'react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    ChevronRight,
    Download,
    ExternalLink,
    Search,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
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

    const totalPages = Math.ceil(data.total / data.pageSize);

    return (
        <>
            <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-9 flex-1 items-center gap-2 rounded-[8px] border border-border bg-white px-3">
                        <Search size={14} className="shrink-0 text-mute" />
                        <input
                            type="search"
                            placeholder="Buscar pagador, email o institución…"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-mute/50"
                        />
                    </div>

                    <select
                        className="h-9 rounded-[8px] border border-border bg-white px-3 text-[13px] text-ink outline-none"
                        value={filters.plan ?? ''}
                        onChange={(e) => applyFilters({ ...filters, plan: (e.target.value as Plan) || undefined, page: 1 })}
                    >
                        <option value="">Todos los planes</option>
                        {(['FREE', 'DOCENTE', 'COLEGIO', 'INSTITUCIONAL'] as Plan[]).map((p) => (
                            <option key={p} value={p}>{PLAN_LABELS[p]}</option>
                        ))}
                    </select>

                    <select
                        className="h-9 rounded-[8px] border border-border bg-white px-3 text-[13px] text-ink outline-none"
                        value={filters.status ?? ''}
                        onChange={(e) => applyFilters({ ...filters, status: (e.target.value as SubscriptionStatus) || undefined, page: 1 })}
                    >
                        <option value="">Todos los estados</option>
                        {(Object.values(SubscriptionStatus) as SubscriptionStatus[]).map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                    </select>

                    <select
                        className="h-9 rounded-[8px] border border-border bg-white px-3 text-[13px] text-ink outline-none"
                        value={filters.billing ?? ''}
                        onChange={(e) => applyFilters({ ...filters, billing: e.target.value || undefined, page: 1 })}
                    >
                        <option value="">Mensual y Anual</option>
                        <option value="monthly">Mensual</option>
                        <option value="annual">Anual</option>
                    </select>

                    <Button variant="ghost" size="sm" onClick={() => void handleExport()}>
                        <Download size={14} />
                        Exportar CSV
                    </Button>
                </div>

                {/* Table */}
                <div className={`overflow-x-auto rounded-[16px] border border-border bg-white transition-opacity ${isPending ? 'opacity-60' : ''}`}>
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="border-b border-border bg-paper">
                                {['Fecha', 'Pagador', 'Institución', 'Plan', 'Modalidad', 'Monto', 'Estado', 'Inicio', 'Vencimiento'].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-mute whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.rows.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-mute">
                                        No hay suscripciones con los filtros seleccionados
                                    </td>
                                </tr>
                            ) : (
                                data.rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => setDetail(row)}
                                        className="cursor-pointer border-b border-border last:border-0 hover:bg-paper/50 transition-colors"
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap text-mute">{formatDate(row.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-ink">{row.payerName ?? '—'}</p>
                                            <p className="text-[12px] text-mute">{row.payerEmail ?? ''}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.institutionName ?? (
                                                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-medium text-yellow-700">
                                                    Sin registrar
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">{PLAN_LABELS[row.plan]}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-mute">
                                            {row.billing === 'monthly' ? 'Mensual' : 'Anual'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">{formatCLP(row.amount)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[row.status]}`}>
                                                {STATUS_LABELS[row.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-mute">{formatDate(row.startedAt)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-mute">{formatDate(row.expiresAt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between text-[13px] text-mute">
                        <span>{data.total} registros · página {data.page}/{totalPages}</span>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={data.page <= 1}
                                onClick={() => applyFilters({ ...filters, page: (filters.page ?? 1) - 1 })}
                            >
                                <ChevronLeft size={14} />
                                Anterior
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={data.page >= totalPages}
                                onClick={() => applyFilters({ ...filters, page: (filters.page ?? 1) + 1 })}
                            >
                                Siguiente
                                <ChevronRight size={14} />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {detail && (
                <DetailModal
                    row={detail}
                    onClose={() => setDetail(null)}
                    onCancel={(id) => void handleCancel(id)}
                    onViewDetail={(id) => router.push(`/config/subscriptions/${id}`)}
                    cancelling={cancelling}
                />
            )}
        </>
    );
}
