'use client';

import { QuoteDialog } from '@/features/subscriptions/components/QuoteDialog';
import { upgradePlan } from '@/features/subscriptions/actions/upgrade';
import { Button } from '@/shared/components/ui/button';
import { Tag } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

type Billing = 'monthly' | 'annual';
type PlanEnum = 'FREE' | 'DOCENTE' | 'COLEGIO' | 'INSTITUCIONAL';

interface UpgradePlan {
    planEnum: PlanEnum;
    name: string;
    monthlyPrice: number | null;
    annualPrice: number | null;
    sub: string;
    featured: boolean;
    badge: string | null;
    features: string[];
}

const PLANS: UpgradePlan[] = [
    {
        planEnum: 'FREE',
        name: 'Free',
        monthlyPrice: 0,
        annualPrice: 0,
        sub: 'Para docentes que recién comienzan a digitalizar sus evaluaciones',
        featured: false,
        badge: null,
        features: ['5 exámenes', '1 aula activa', 'Hasta 50 estudiantes', 'Historial de 30 días'],
    },
    {
        planEnum: 'DOCENTE',
        name: 'Docente',
        monthlyPrice: 9990,
        annualPrice: 7990,
        sub: 'Para docentes que evalúan grupos pequeños con herramientas avanzadas',
        featured: false,
        badge: null,
        features: [
            'Exámenes ilimitados',
            'Hasta 5 aulas activas',
            'Hasta 150 estudiantes',
            'Historial de 90 días',
            'Reportes avanzados exportables',
        ],
    },
    {
        planEnum: 'COLEGIO',
        name: 'Colegio',
        monthlyPrice: 29990,
        annualPrice: 24990,
        sub: 'Para equipos docentes que evalúan a escala con herramientas completas',
        featured: true,
        badge: 'MÁS ELEGIDO',
        features: [
            'Hasta 30 aulas activas',
            'Hasta 300 estudiantes',
            '20 bancos de preguntas compartidos',
            'Historial ilimitado',
            'Anti-copia avanzado',
            'Soporte prioritario',
        ],
    },
    {
        planEnum: 'INSTITUCIONAL',
        name: 'Institucional',
        monthlyPrice: null,
        annualPrice: null,
        sub: 'Para organizaciones que estandarizan evaluaciones a gran escala',
        featured: false,
        badge: null,
        features: [
            'Mayor ahorro por asiento',
            'Consolidación multi-cuenta',
            'Gestor de cuenta dedicado',
            'Acuerdos personalizados',
            'Soporte prioritario',
        ],
    },
];

function formatCLP(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
    }).format(amount);
}

interface PlanCardProps {
    plan: UpgradePlan;
    billing: Billing;
    isCurrent: boolean;
    onUpgrade: (plan: PlanEnum) => void;
    onQuote: () => void;
}

function PriceBlock({ plan, billing }: { plan: UpgradePlan; billing: Billing }) {
    const price = billing === 'annual' ? plan.annualPrice : plan.monthlyPrice;
    const amountColor = plan.featured ? 'text-lime' : 'text-ink';
    const mutedColor = plan.featured ? 'text-white/50' : 'text-mute';

    if (price === null) {
        return (
            <span
                className={cn(
                    'font-display text-[26px] font-semibold tracking-[-0.02em]',
                    amountColor,
                )}
            >
                A consultar
            </span>
        );
    }
    return (
        <>
            <div className="flex items-baseline gap-1">
                <span
                    className={cn(
                        'font-display text-[32px] font-semibold tracking-[-0.03em]',
                        amountColor,
                    )}
                >
                    {price === 0 ? 'Gratis' : formatCLP(price)}
                </span>
                {price > 0 && <span className={cn('text-[12px]', mutedColor)}>/mes</span>}
            </div>
            {price > 0 && billing === 'annual' && (
                <p className={cn('mt-1 text-[11px]', plan.featured ? 'text-white/40' : 'text-mute')}>
                    Facturado {formatCLP(price * 12)} al año
                </p>
            )}
        </>
    );
}

function PlanCta({ plan, isCurrent, onUpgrade, onQuote }: Omit<PlanCardProps, 'billing'>) {
    if (isCurrent) {
        return (
            <Button variant="ghost" size="lg" className="w-full" disabled>
                Plan actual
            </Button>
        );
    }
    if (plan.planEnum === 'FREE') {
        return (
            <Button variant="ghost" size="lg" className="w-full" disabled>
                Plan base
            </Button>
        );
    }
    if (plan.planEnum === 'INSTITUCIONAL') {
        return (
            <Button
                variant={plan.featured ? 'lime' : 'ghost'}
                size="lg"
                className="w-full"
                onClick={onQuote}
            >
                Solicitar cotización
            </Button>
        );
    }
    return (
        <Button
            variant={plan.featured ? 'lime' : 'primary'}
            size="lg"
            className="w-full"
            onClick={() => onUpgrade(plan.planEnum)}
        >
            Contratar
        </Button>
    );
}

function PlanCard({ plan, billing, isCurrent, onUpgrade, onQuote }: PlanCardProps) {
    const checkColor = plan.featured ? 'text-lime' : 'text-success';

    return (
        <div
            className={cn(
                'relative flex flex-col rounded-[20px] p-6',
                plan.featured ? 'bg-ink text-white' : 'border-border border bg-white',
                isCurrent && 'ring-primary ring-2',
            )}
        >
            {plan.badge && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Tag tone="lime" size="sm">
                        {plan.badge}
                    </Tag>
                </div>
            )}
            {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Tag tone="primary" size="sm">
                        TU PLAN ACTUAL
                    </Tag>
                </div>
            )}

            <h3
                className={cn(
                    'font-display text-[22px] font-semibold tracking-[-0.02em]',
                    plan.featured ? 'text-white' : 'text-ink',
                )}
            >
                {plan.name}
            </h3>
            <p
                className={cn(
                    'mt-1 mb-5 text-[12.5px] leading-snug',
                    plan.featured ? 'text-white/60' : 'text-mute',
                )}
            >
                {plan.sub}
            </p>

            <div className="mb-5">
                <PriceBlock plan={plan} billing={billing} />
            </div>

            <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                        <Check className={cn('mt-0.5 size-4 shrink-0', checkColor)} />
                        <span
                            className={cn(
                                'text-[12.5px]',
                                plan.featured ? 'text-white/80' : 'text-ink',
                            )}
                        >
                            {f}
                        </span>
                    </li>
                ))}
            </ul>

            <PlanCta plan={plan} isCurrent={isCurrent} onUpgrade={onUpgrade} onQuote={onQuote} />
        </div>
    );
}

interface UpgradePlansProps {
    slug: string;
    currentPlan: PlanEnum;
    quoteDefaults?: { name?: string; email?: string; institution?: string };
}

export function UpgradePlans({
    slug,
    currentPlan,
    quoteDefaults,
}: UpgradePlansProps) {
    const [billing, setBilling] = useState<Billing>('annual');
    const [quoteOpen, setQuoteOpen] = useState(false);
    const [, startTransition] = useTransition();

    function handleUpgrade(plan: PlanEnum): void {
        if (plan !== 'DOCENTE' && plan !== 'COLEGIO') return;
        startTransition(async () => {
            const res = await upgradePlan(slug, plan, billing);
            if (res.error || !res.data?.initPoint) {
                toast.error(res.error ?? 'No se pudo iniciar el pago. Intenta de nuevo.');
                return;
            }
            // Redirige al checkout de MercadoPago; al volver, el webhook activa el plan.
            window.location.href = res.data.initPoint;
        });
    }
    function handleQuote(): void {
        setQuoteOpen(true);
    }

    return (
        <>
            <main className="flex-1 p-8">
                {/* Toggle de facturación */}
                <div className="mb-10 flex flex-col items-center gap-3">
                    <div className="bg-paper-warm/50 border-border/40 relative flex rounded-full border p-0.5">
                        <motion.div
                            className="border-border/10 absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full border bg-white shadow-sm"
                            initial={false}
                            animate={{ x: billing === 'monthly' ? 0 : '100%' }}
                            transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
                        />
                        <button
                            type="button"
                            onClick={() => setBilling('monthly')}
                            className={cn(
                                'relative z-10 px-6 py-1.5 text-[12px] font-semibold transition-colors',
                                billing === 'monthly' ? 'text-primary' : 'text-mute hover:text-ink',
                            )}
                        >
                            Mensual
                        </button>
                        <button
                            type="button"
                            onClick={() => setBilling('annual')}
                            className={cn(
                                'relative z-10 px-6 py-1.5 text-[12px] font-semibold transition-colors',
                                billing === 'annual' ? 'text-primary' : 'text-mute hover:text-ink',
                            )}
                        >
                            Anual
                        </button>
                    </div>
                    {billing === 'annual' && (
                        <span className="text-primary text-[11px] font-bold italic">
                            Ahorrás hasta 17% pagando al año
                        </span>
                    )}
                </div>

                {/* Tarjetas */}
                <div className="mx-auto grid max-w-[1100px] gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {PLANS.map((plan) => (
                        <PlanCard
                            key={plan.planEnum}
                            plan={plan}
                            billing={billing}
                            isCurrent={plan.planEnum === currentPlan}
                            onUpgrade={handleUpgrade}
                            onQuote={handleQuote}
                        />
                    ))}
                </div>

                <p className="text-mute mt-8 text-center text-[12.5px]">
                    Los precios no incluyen IVA · Cancelás cuando quieras · Soporte en español
                </p>
            </main>

            <QuoteDialog
                open={quoteOpen}
                onOpenChange={setQuoteOpen}
                defaultValues={quoteDefaults}
            />
        </>
    );
}
