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
        <div className="border-border bg-paper-warm rounded-[10px] border text-[12px]">
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
                <span className="text-mute font-mono">{event.topic}</span>
                <span className="text-ink-dim flex-1 truncate">{event.externalId}</span>
                <span className="text-mute shrink-0 font-mono">
                    {formatDateShort(event.receivedAt)}
                </span>
                {expanded ? (
                    <ChevronUp size={13} className="text-mute shrink-0" />
                ) : (
                    <ChevronDown size={13} className="text-mute shrink-0" />
                )}
            </button>
            {expanded && (
                <div className="border-border border-t px-3 pt-2 pb-3">
                    {event.error && (
                        <p className="mb-2 rounded-[6px] bg-red-50 px-3 py-1.5 text-[11px] text-red-600">
                            {event.error}
                        </p>
                    )}
                    <pre className="bg-ink/5 text-ink-dim overflow-x-auto rounded-[6px] px-3 py-2 text-[10px] leading-relaxed">
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
        return <p className="text-mute py-6 text-center text-[13px]">Sin pagos registrados</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
                <thead>
                    <tr className="border-border bg-paper border-b">
                        {['Fecha', 'Monto', 'Estado', 'Período', 'ID MP'].map((h) => (
                            <th
                                key={h}
                                className="text-mute px-4 py-2.5 text-left font-mono text-[10px] tracking-[0.1em] whitespace-nowrap uppercase"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {payments.map((p) => (
                        <tr key={p.id} className="border-border border-b last:border-0">
                            <td className="text-mute px-4 py-3 whitespace-nowrap">
                                {formatDateShort(p.paidAt ?? p.createdAt)}
                            </td>
                            <td className="text-ink px-4 py-3 font-medium whitespace-nowrap">
                                {formatCLP(p.amount)}
                            </td>
                            <td className="px-4 py-3">
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PAYMENT_STATUS_COLORS[p.status]}`}
                                >
                                    {PAYMENT_STATUS_LABELS[p.status]}
                                </span>
                            </td>
                            <td className="text-mute px-4 py-3 whitespace-nowrap">
                                {p.periodStart
                                    ? `${formatDateShort(p.periodStart)} → ${formatDateShort(p.periodEnd)}`
                                    : '—'}
                            </td>
                            <td className="text-mute px-4 py-3 font-mono text-[11px]">
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
    onAction: (action: () => Promise<{ data: null; error: string | null }>, msg: string) => void;
    isPending: boolean;
}

function ActionsCard({
    id,
    status,
    onAction,
    isPending,
}: ActionsCardProps): React.JSX.Element | null {
    if (status === SubscriptionStatus.cancelled || status === SubscriptionStatus.failed)
        return null;
    return (
        <Card className="border-border bg-white p-5 shadow-sm">
            <h3 className="text-mute mb-3 font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
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
                        {isPending ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <PauseCircle size={14} />
                        )}
                        Pausar suscripción
                    </Button>
                )}
                {status === SubscriptionStatus.paused && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start gap-2 text-green-700 hover:bg-green-50"
                        disabled={isPending}
                        onClick={() =>
                            onAction(() => reactivateSubscription(id), 'Suscripción reactivada')
                        }
                    >
                        {isPending ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <PlayCircle size={14} />
                        )}
                        Reactivar suscripción
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 justify-start gap-2"
                    disabled={isPending}
                    onClick={() => onAction(() => cancelSubscription(id), 'Suscripción cancelada')}
                >
                    {isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <XCircle size={14} />
                    )}
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
        ...(detail.cancelledAt
            ? [['Cancelada', formatDate(detail.cancelledAt)] as [string, string]]
            : []),
        ...(detail.pausedAt ? [['Pausada', formatDate(detail.pausedAt)] as [string, string]] : []),
    ];

    return (
        <div className="space-y-6">
            {/* Subscription data */}
            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="border-border bg-white p-6 shadow-sm lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-mute font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
                            Datos de la suscripción
                        </h2>
                        <span
                            className={`rounded-full px-3 py-1 text-[12px] font-semibold ${STATUS_COLORS[detail.status]}`}
                        >
                            {STATUS_LABELS[detail.status]}
                        </span>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13px] sm:grid-cols-3">
                        {infoFields.map(([label, value]) => (
                            <div key={label}>
                                <dt className="text-mute font-mono text-[10px] tracking-[0.1em] uppercase">
                                    {label}
                                </dt>
                                <dd className="text-ink mt-0.5 font-medium break-all">{value}</dd>
                            </div>
                        ))}
                    </dl>
                    {detail.mpSubscriptionId && (
                        <div className="bg-paper-warm mt-4 rounded-[10px] p-3">
                            <p className="text-mute font-mono text-[10px] tracking-[0.1em] uppercase">
                                ID MercadoPago
                            </p>
                            <p className="text-ink mt-0.5 font-mono text-[12px] break-all">
                                {detail.mpSubscriptionId}
                            </p>
                        </div>
                    )}
                </Card>

                <div className="space-y-4">
                    {detail.metadata && (
                        <Card className="border-border bg-white p-5 shadow-sm">
                            <h3 className="text-mute mb-3 font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
                                Pagador
                            </h3>
                            <div className="space-y-2 text-[13px]">
                                <p className="text-ink font-semibold">
                                    {detail.metadata.payerName}{' '}
                                    {detail.metadata.payerLastname ?? ''}
                                </p>
                                <p className="text-mute">{detail.metadata.payerEmail ?? '—'}</p>
                            </div>
                        </Card>
                    )}

                    <Card className="border-border bg-white p-5 shadow-sm">
                        <h3 className="text-mute mb-3 font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
                            Institución
                        </h3>
                        {detail.institutionName ? (
                            <div className="flex items-center justify-between">
                                <p className="text-ink text-[13px] font-semibold">
                                    {detail.institutionName}
                                </p>
                                {detail.institutionSlug && (
                                    <Link
                                        href={`/${detail.institutionSlug}`}
                                        className="text-primary flex items-center gap-1 text-[12px] hover:underline"
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
            <Card className="border-border bg-white p-6 shadow-sm">
                <h2 className="text-mute mb-4 font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
                    Historial de pagos · {detail.payments.length} registros
                </h2>
                <PaymentsTable payments={detail.payments} />
            </Card>

            {/* Webhook events */}
            <Card className="border-border bg-white p-6 shadow-sm">
                <button
                    type="button"
                    onClick={() => setWebhookOpen((v) => !v)}
                    className="flex w-full items-center justify-between"
                >
                    <h2 className="text-mute font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
                        Eventos webhook · {detail.webhookEvents.length} registros
                    </h2>
                    {webhookOpen ? (
                        <ChevronUp size={14} className="text-mute" />
                    ) : (
                        <ChevronDown size={14} className="text-mute" />
                    )}
                </button>
                {webhookOpen && (
                    <div className="mt-4 space-y-2">
                        {detail.webhookEvents.length === 0 ? (
                            <p className="text-mute py-4 text-center text-[13px]">
                                Sin eventos registrados
                            </p>
                        ) : (
                            detail.webhookEvents.map((ev) => (
                                <WebhookEventRow key={ev.id} event={ev} />
                            ))
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}
