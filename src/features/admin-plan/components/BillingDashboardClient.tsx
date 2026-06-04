'use client';

import type * as React from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp, CreditCard, Users, XCircle, PauseCircle } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import type { BillingStats } from '@/features/admin-plan/actions/mutations';
import type { Plan } from '@prisma/client';

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

function formatMonth(key: string): string {
    const [y, m] = key.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' });
}

interface RevenueChartProps {
    data: Array<{ month: string; amount: number }>;
}

function RevenueChart({ data }: RevenueChartProps): React.JSX.Element {
    const max = Math.max(...data.map((d) => d.amount), 1);
    return (
        <div className="flex h-[80px] items-end gap-1">
            {data.map((d) => {
                const pct = (d.amount / max) * 100;
                const hasValue = d.amount > 0;
                return (
                    <div
                        key={d.month}
                        className="group relative flex flex-1 flex-col items-center gap-1"
                    >
                        <div
                            className="w-full rounded-t-[3px] transition-all duration-300"
                            style={{
                                height: `${Math.max(pct, hasValue ? 4 : 2)}%`,
                                backgroundColor: hasValue ? '#1f2eff' : '#e5e2dc',
                                minHeight: 2,
                            }}
                        />
                        {hasValue && (
                            <div className="bg-ink absolute bottom-full z-10 mb-1 hidden rounded-[6px] px-2 py-1 text-[10px] whitespace-nowrap text-white shadow-lg group-hover:block">
                                {formatCLP(d.amount)}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

interface Props {
    stats: BillingStats;
}

export function BillingDashboardClient({ stats }: Props): React.JSX.Element {
    const totalRevenue = stats.revenueLast12Months.reduce((s, m) => s + m.amount, 0);
    const lastMonthRevenue = stats.revenueLast12Months.at(-1)?.amount ?? 0;
    const prevMonthRevenue = stats.revenueLast12Months.at(-2)?.amount ?? 0;
    const growthPct =
        prevMonthRevenue > 0
            ? Math.round(((lastMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
            : null;

    const maxPlanMrr = Math.max(...stats.byPlan.map((p) => p.mrr), 1);

    return (
        <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card
                    className="border-border p-6 shadow-sm"
                    style={{ backgroundColor: '#1f2eff', borderColor: '#1a27d9' }}
                >
                    <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/15">
                        <CreditCard size={18} className="text-white" />
                    </div>
                    <p className="font-display text-[36px] leading-none font-bold tracking-[-0.03em] text-white">
                        {formatCLP(stats.mrr)}
                    </p>
                    <p className="mt-2 font-mono text-[10px] font-bold tracking-[0.1em] text-white/60 uppercase">
                        MRR · Ingreso mensual recurrente
                    </p>
                </Card>

                <Card className="border-border bg-white p-6 shadow-sm">
                    <div
                        className="mb-4 flex h-9 w-9 items-center justify-center rounded-[10px]"
                        style={{ backgroundColor: '#e6f4ed', color: '#0f7c4a' }}
                    >
                        <Users size={18} />
                    </div>
                    <p className="font-display text-ink text-[36px] leading-none font-bold tracking-[-0.03em]">
                        {stats.activeCount}
                    </p>
                    <p className="text-mute mt-2 font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                        Suscripciones activas
                    </p>
                    {stats.pausedCount > 0 && (
                        <p className="text-mute mt-1 text-[12px]">{stats.pausedCount} pausadas</p>
                    )}
                </Card>

                <Card className="border-border bg-white p-6 shadow-sm">
                    <div
                        className="mb-4 flex h-9 w-9 items-center justify-center rounded-[10px]"
                        style={{ backgroundColor: '#fff2d4', color: '#b7791f' }}
                    >
                        <TrendingUp size={18} />
                    </div>
                    <p className="font-display text-ink text-[36px] leading-none font-bold tracking-[-0.03em]">
                        {formatCLP(lastMonthRevenue)}
                    </p>
                    <p className="text-mute mt-2 font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                        Ingresos este mes
                    </p>
                    {growthPct !== null && (
                        <p
                            className="mt-1 text-[12px] font-medium"
                            style={{ color: growthPct >= 0 ? '#0f7c4a' : '#d5301f' }}
                        >
                            {growthPct >= 0 ? '+' : ''}
                            {growthPct}% vs mes anterior
                        </p>
                    )}
                </Card>

                <Card className="border-border bg-white p-6 shadow-sm">
                    <div
                        className="mb-4 flex h-9 w-9 items-center justify-center rounded-[10px]"
                        style={{ backgroundColor: '#fee2e2', color: '#d5301f' }}
                    >
                        <XCircle size={18} />
                    </div>
                    <p className="font-display text-ink text-[36px] leading-none font-bold tracking-[-0.03em]">
                        {stats.cancelledCount}
                    </p>
                    <p className="text-mute mt-2 font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                        Canceladas
                    </p>
                    {stats.pendingCount > 0 && (
                        <p className="text-mute mt-1 text-[12px]">
                            {stats.pendingCount} pendientes
                        </p>
                    )}
                </Card>
            </div>

            {/* Revenue chart + plan distribution */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-border bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-mute font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
                                Ingresos · últimos 12 meses
                            </h3>
                            <p className="font-display text-ink mt-1 text-[22px] font-bold">
                                {formatCLP(totalRevenue)}
                            </p>
                        </div>
                    </div>
                    <RevenueChart data={stats.revenueLast12Months} />
                    {/* X-axis labels */}
                    <div className="mt-2 flex items-center gap-1">
                        {stats.revenueLast12Months
                            .filter((_, i) => i % 3 === 0 || i === 11)
                            .map((d) => (
                                <span
                                    key={d.month}
                                    className="text-mute flex-1 text-center font-mono text-[9px]"
                                >
                                    {formatMonth(d.month)}
                                </span>
                            ))}
                    </div>
                </Card>

                <Card className="border-border bg-white p-6 shadow-sm">
                    <h3 className="text-mute mb-4 font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
                        Distribución por plan
                    </h3>
                    {stats.byPlan.length === 0 ? (
                        <p className="text-mute py-8 text-center text-[13px]">
                            Sin suscripciones activas
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {stats.byPlan.map((p) => {
                                const barWidth = Math.round((p.mrr / maxPlanMrr) * 100);
                                return (
                                    <div key={p.plan}>
                                        <div className="mb-1.5 flex items-center justify-between">
                                            <span className="text-ink text-[13px] font-medium">
                                                {PLAN_LABELS[p.plan]}
                                            </span>
                                            <span className="text-mute font-mono text-[11px]">
                                                {p.count} · {formatCLP(p.mrr)}/mes
                                            </span>
                                        </div>
                                        <div className="bg-paper-warm h-2 overflow-hidden rounded-full">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${barWidth}%`,
                                                    backgroundColor: '#1f2eff',
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>

            {/* Quick links */}
            <div className="grid gap-3 sm:grid-cols-3">
                {[
                    {
                        href: '/config/subscriptions',
                        label: 'Ver suscripciones',
                        sub: `${stats.activeCount + stats.pendingCount + stats.pausedCount} activas o pendientes`,
                        icon: PauseCircle,
                        color: '#1f2eff',
                        wash: '#e8eaff',
                    },
                    {
                        href: '/config/payments',
                        label: 'Ver pagos',
                        sub: 'Historial de cobros individuales',
                        icon: CreditCard,
                        color: '#0f7c4a',
                        wash: '#e6f4ed',
                    },
                    {
                        href: '/config/plan-limits',
                        label: 'Configurar planes',
                        sub: 'Cuotas y límites por plan',
                        icon: TrendingUp,
                        color: '#b7791f',
                        wash: '#fff2d4',
                    },
                ].map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="group border-border flex items-center gap-4 rounded-[16px] border bg-white p-4 shadow-sm transition-all hover:shadow-md"
                        style={{ borderLeftWidth: 3, borderLeftColor: item.color }}
                    >
                        <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                            style={{ backgroundColor: item.wash, color: item.color }}
                        >
                            <item.icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-ink text-[13px] font-bold">{item.label}</p>
                            <p className="text-mute mt-0.5 text-[11px]">{item.sub}</p>
                        </div>
                        <ArrowRight
                            size={14}
                            className="text-mute shrink-0 transition-transform group-hover:translate-x-0.5"
                        />
                    </Link>
                ))}
            </div>
        </div>
    );
}
