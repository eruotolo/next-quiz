'use client';

import type * as React from 'react';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Loader2,
    PauseCircle,
    PlayCircle,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import {
    cancelSubscription,
    pauseSubscription,
    reactivateSubscription,
} from '@/features/admin-plan/actions/mutations';
import type { SubscriptionDetail } from '@/features/admin-plan/actions/mutations';
import { type Plan, SubscriptionStatus, PaymentStatus } from '@prisma/client';

const PLAN_LABELS: Record<Plan, string> = {
    FREE: 'Free',
    DOCENTE: 'Docente',
    COLEGIO: 'Colegio',
    INSTITUCIONAL: 'Institución',
};

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

function formatCLP(n: number | null): string {
    if (n === null) return '—';
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
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDateShort(d: Date | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
    });
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface WebhookEventRowProps {
    event: SubscriptionDetail['webhookEvents'][number];
}

function WebhookEventRow({ event }: WebhookEventRowProps): React.JSX.Element {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="rounded-[10px] border border-border bg-paper-warm text-[12px]">
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
            >
                <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${event.processed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}
                >
                    {event.processed ? 'OK' : 'Error'}
                </span>
                <span className="font-mono text-mute">{event.topic}</span>
                <span className="flex-1 truncate text-ink-dim">{event.externalId}</span>
                <span className="shrink-0 font-mono text-mute">{formatDateShort(event.receivedAt)}</span>
                {expanded
                    ? <ChevronUp size={13} className="shrink-0 text-mute" />
                    : <ChevronDown size={13} className="shrink-0 text-mute" />}
            </button>
            {expanded && (
                <div className="border-t border-border px-3 pb-3 pt-2">
                    {event.error && (
                        <p className="mb-2 rounded-[6px] bg-red-50 px-3 py-1.5 text-[11px] text-red-600">
                            {event.error}
                        </p>
                    )}
                    <pre className="overflow-x-auto rounded-[6px] bg-ink/5 px-3 py-2 text-[10px] leading-relaxed text-ink-dim">
                        {JSON.stringify(event.rawPayload, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

interface PaymentsTableProps {
    payments: SubscriptionDetail['payments'];
}

function PaymentsTable({ payments }: PaymentsTableProps): React.JSX.Element {
    if (payments.length === 0) {
        return <p className="py-6 text-center text-[13px] text-mute">Sin pagos registrados</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
                <thead>
                    <tr className="border-b border-border bg-paper">
                        {['Fecha', 'Monto', 'Estado', 'Período', 'ID MP'].map((h) => (
                            <th
                                key={h}
                                className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-mute whitespace-nowrap"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {payments.map((p) => (
                        <tr key={p.id} className="border-b border-border last:border-0">
                            <td className="px-4 py-3 whitespace-nowrap text-mute">
                                {formatDateShort(p.paidAt ?? p.createdAt)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-ink">
                                {formatCLP(p.amount)}
                            </td>
                            <td className="px-4 py-3">
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PAYMENT_STATUS_COLORS[p.status]}`}>
                                    {PAYMENT_STATUS_LABELS[p.status]}
                                </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-mute">
                                {p.periodStart
                                    ? `${formatDateShort(p.periodStart)} → ${formatDateShort(p.periodEnd)}`
                                    : '—'}
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-mute">
                                {p.mpPaymentId ?? '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

interface ActionsCardProps {
    id: string;
    status: SubscriptionStatus;
    onAction: (
        action: () => Promise<{ data: null; error: string | null }>,
        msg: string,
    ) => void;
    isPending: boolean;
}

function ActionsCard({ id, status, onAction, isPending }: ActionsCardProps): React.JSX.Element | null {
    if (status === SubscriptionStatus.cancelled || status === SubscriptionStatus.failed) return null;
    return (
        <Card className="bg-white border-border shadow-sm p-5">
            <h3 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-mute">
                Acciones
            </h3>
            <div className="flex flex-col gap-2">
                {status === SubscriptionStatus.active && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start gap-2 text-amber-700 hover:bg-amber-50"
                        disabled={isPending}
                        onClick={() => onAction(() => pauseSubscription(id), 'Suscripción pausada')}
                    >
                        {isPending ? <Loader2 size={14} className="animate-spin" /> : <PauseCircle size={14} />}
                        Pausar suscripción
                    </Button>
                )}
                {status === SubscriptionStatus.paused && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start gap-2 text-green-700 hover:bg-green-50"
                        disabled={isPending}
                        onClick={() => onAction(() => reactivateSubscription(id), 'Suscripción reactivada')}
                    >
                        {isPending ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
                        Reactivar suscripción
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2 text-destructive hover:bg-destructive/10"
                    disabled={isPending}
                    onClick={() => onAction(() => cancelSubscription(id), 'Suscripción cancelada')}
                >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    Cancelar suscripción
                </Button>
            </div>
        </Card>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
    detail: SubscriptionDetail;
}

export function SubscriptionDetailClient({ detail }: Props): React.JSX.Element {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [webhookOpen, setWebhookOpen] = useState(false);

    function handleAction(
        action: () => Promise<{ data: null; error: string | null }>,
        successMsg: string,
    ): void {
        startTransition(async () => {
            const result = await action();
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(successMsg);
                router.refresh();
            }
        });
    }

    const infoFields: [string, string][] = [
        ['Plan', PLAN_LABELS[detail.plan]],
        ['Modalidad', detail.billing === 'monthly' ? 'Mensual' : 'Anual'],
        ['Monto', formatCLP(detail.amount)],
        ['Moneda', detail.currency ?? 'CLP'],
        ['Creada', formatDate(detail.createdAt)],
        ['Actualizada', formatDate(detail.updatedAt)],
        ['Inicio', formatDate(detail.startedAt)],
        ['Vencimiento', formatDate(detail.expiresAt)],
        ...(detail.cancelledAt ? [['Cancelada', formatDate(detail.cancelledAt)] as [string, string]] : []),
        ...(detail.pausedAt ? [['Pausada', formatDate(detail.pausedAt)] as [string, string]] : []),
    ];

    return (
        <div className="space-y-6">
            {/* Subscription data */}
            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="bg-white border-border shadow-sm p-6 lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-mute">
                            Datos de la suscripción
                        </h2>
                        <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${STATUS_COLORS[detail.status]}`}>
                            {STATUS_LABELS[detail.status]}
                        </span>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13px] sm:grid-cols-3">
                        {infoFields.map(([label, value]) => (
                            <div key={label}>
                                <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-mute">{label}</dt>
                                <dd className="mt-0.5 font-medium text-ink break-all">{value}</dd>
                            </div>
                        ))}
                    </dl>
                    {detail.mpSubscriptionId && (
                        <div className="mt-4 rounded-[10px] bg-paper-warm p-3">
                            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-mute">ID MercadoPago</p>
                            <p className="mt-0.5 font-mono text-[12px] text-ink break-all">{detail.mpSubscriptionId}</p>
                        </div>
                    )}
                </Card>

                <div className="space-y-4">
                    {detail.metadata && (
                        <Card className="bg-white border-border shadow-sm p-5">
                            <h3 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-mute">
                                Pagador
                            </h3>
                            <div className="space-y-2 text-[13px]">
                                <p className="font-semibold text-ink">
                                    {detail.metadata.payerName} {detail.metadata.payerLastname ?? ''}
                                </p>
                                <p className="text-mute">{detail.metadata.payerEmail ?? '—'}</p>
                            </div>
                        </Card>
                    )}

                    <Card className="bg-white border-border shadow-sm p-5">
                        <h3 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-mute">
                            Institución
                        </h3>
                        {detail.institutionName ? (
                            <div className="flex items-center justify-between">
                                <p className="text-[13px] font-semibold text-ink">{detail.institutionName}</p>
                                {detail.institutionSlug && (
                                    <Link
                                        href={`/${detail.institutionSlug}`}
                                        className="flex items-center gap-1 text-[12px] text-primary hover:underline"
                                    >
                                        Ver panel
                                        <ExternalLink size={12} />
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-medium text-yellow-700">
                                Sin registrar
                            </span>
                        )}
                    </Card>

                    <ActionsCard
                        id={detail.id}
                        status={detail.status}
                        onAction={handleAction}
                        isPending={isPending}
                    />
                </div>
            </div>

            {/* Payments */}
            <Card className="bg-white border-border shadow-sm p-6">
                <h2 className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-mute">
                    Historial de pagos · {detail.payments.length} registros
                </h2>
                <PaymentsTable payments={detail.payments} />
            </Card>

            {/* Webhook events */}
            <Card className="bg-white border-border shadow-sm p-6">
                <button
                    type="button"
                    onClick={() => setWebhookOpen((v) => !v)}
                    className="flex w-full items-center justify-between"
                >
                    <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-mute">
                        Eventos webhook · {detail.webhookEvents.length} registros
                    </h2>
                    {webhookOpen
                        ? <ChevronUp size={14} className="text-mute" />
                        : <ChevronDown size={14} className="text-mute" />}
                </button>
                {webhookOpen && (
                    <div className="mt-4 space-y-2">
                        {detail.webhookEvents.length === 0
                            ? <p className="py-4 text-center text-[13px] text-mute">Sin eventos registrados</p>
                            : detail.webhookEvents.map((ev) => (
                                <WebhookEventRow key={ev.id} event={ev} />
                            ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
