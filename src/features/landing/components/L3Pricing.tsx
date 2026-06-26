'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/shared/components/ui/button';
import { QuoteDialog } from '@/features/subscriptions/components/QuoteDialog';
import { Tag } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';

type BillingPeriod = 'monthly' | 'annual';

interface Plan {
    id: string;
    name: string;
    monthlyPrice: number | null;
    annualPrice: number | null;
    sub: string;
    cta: string;
    ctaVariant: 'ghost' | 'lime' | 'ghost-dark' | 'outline';
    href: string;
    featured: boolean;
    badge: string | null;
    features: string[];
}

const PLANS: Plan[] = [
    {
        id: 'free',
        name: 'Free',
        monthlyPrice: 0,
        annualPrice: 0,
        sub: 'Para docentes que recién comienzan a digitalizar sus evaluaciones',
        cta: 'Empezar gratis',
        ctaVariant: 'ghost',
        href: '/registro/free',
        featured: false,
        badge: null,
        features: [
            '5 exámenes',
            '1 aula activa',
            'Hasta 50 estudiantes por actividad',
            'Historial de 30 días',
            'Corrección automática',
            'Resultados en tiempo real',
        ],
    },
    {
        id: 'docente',
        name: 'Docente',
        monthlyPrice: 9990,
        annualPrice: 7990,
        sub: 'Para docentes que evalúan grupos pequeños con herramientas avanzadas',
        cta: 'Suscribirse',
        ctaVariant: 'ghost',
        href: '/registro/docente',
        featured: false,
        badge: null,
        features: [
            'Exámenes ilimitados',
            'Hasta 5 aulas activas',
            'Hasta 150 estudiantes',
            'Historial de 90 días',
            'Pausar actividades en curso',
            'Reportes avanzados exportables',
        ],
    },
    {
        id: 'colegio',
        name: 'Colegio',
        monthlyPrice: 29990,
        annualPrice: 24990,
        sub: 'Para equipos docentes que evalúan a escala con herramientas completas',
        cta: 'Suscribirse',
        ctaVariant: 'lime',
        href: '/registro/colegio',
        featured: true,
        badge: 'MÁS ELEGIDO',
        features: [
            'Hasta 30 aulas activas',
            'Hasta 300 estudiantes por actividad',
            '20 bancos de preguntas compartidos',
            'Historial de reportes ilimitado',
            'Anti-copia avanzado',
            'Resultados en tiempo real',
            'Soporte prioritario por correo',
        ],
    },
    {
        id: 'institucion',
        name: 'Institución',
        monthlyPrice: null,
        annualPrice: null,
        sub: 'Para organizaciones que estandarizan evaluaciones a gran escala',
        cta: 'Solicitar cotización',
        ctaVariant: 'ghost',
        href: 'mailto:contacto@aulika.cl?subject=Plan%20Institución',
        featured: false,
        badge: null,
        features: [
            'Mayor ahorro por asiento',
            'Consolidación multi-cuenta',
            'Control de recursos compartidos',
            'Gestor de cuenta dedicado',
            'Soporte prioritario',
            'Acuerdos personalizados',
            'Instalación on-premise disponible',
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

interface PriceDisplayProps {
    price: number | null;
    billing: BillingPeriod;
    featured: boolean;
}

function PriceDisplay({ price, billing, featured }: PriceDisplayProps) {
    const amountColor = featured ? 'text-lime' : 'text-ink';
    const mutedColor = featured ? 'text-white/50' : 'text-mute';
    const subtleColor = featured ? 'text-white/40' : 'text-mute';

    if (price === null) {
        return (
            <span
                className={cn(
                    'font-display text-[28px] font-semibold tracking-[-0.02em]',
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
                        'font-display text-[36px] font-semibold tracking-[-0.03em]',
                        amountColor,
                    )}
                >
                    {price === 0 ? 'Gratis' : formatCLP(price)}
                </span>
                {price > 0 && <span className={cn('text-[13px]', mutedColor)}>/mes</span>}
            </div>
            {price > 0 && billing === 'annual' && (
                <p className={cn('mt-1 text-[12px]', subtleColor)}>
                    Facturado como {formatCLP(price * 12)} al año
                </p>
            )}
        </>
    );
}

interface PlanCardProps {
    plan: Plan;
    billing: BillingPeriod;
    onQuote: () => void;
}

function PlanCard({ plan, billing, onQuote }: PlanCardProps) {
    const price = billing === 'annual' ? plan.annualPrice : plan.monthlyPrice;
    const checkColor = plan.featured ? 'text-lime' : 'text-success';
    const featureTextColor = plan.featured ? 'text-white/80' : 'text-ink';

    return (
        <div
            className={cn(
                'relative flex flex-col rounded-[22px] p-8',
                plan.featured ? 'bg-ink text-white' : 'border-border border bg-white',
            )}
        >
            {plan.badge !== null && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Tag tone="lime" size="sm">
                        {plan.badge}
                    </Tag>
                </div>
            )}

            <div className="mb-6 space-y-1">
                <h3
                    className={cn(
                        'font-display text-[24px] font-semibold tracking-[-0.02em]',
                        plan.featured ? 'text-white' : 'text-ink',
                    )}
                >
                    {plan.name}
                </h3>
                <p className={cn('text-[13px]', plan.featured ? 'text-white/60' : 'text-mute')}>
                    {plan.sub}
                </p>
            </div>

            <div className="mb-6">
                <PriceDisplay price={price} billing={billing} featured={plan.featured} />
            </div>

            <ul className="mb-8 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                        <Check className={cn('mt-0.5 size-4 shrink-0', checkColor)} />
                        <span className={cn('text-[13px]', featureTextColor)}>{f}</span>
                    </li>
                ))}
            </ul>

            {plan.monthlyPrice === null ? (
                <Button
                    variant={plan.featured ? plan.ctaVariant : 'ghost'}
                    size="lg"
                    className="w-full"
                    onClick={onQuote}
                >
                    {plan.cta}
                </Button>
            ) : (
                <Button
                    variant={plan.featured ? plan.ctaVariant : 'ghost'}
                    size="lg"
                    className="w-full"
                    asChild
                >
                    <Link href={plan.href}>{plan.cta}</Link>
                </Button>
            )}
        </div>
    );
}

export function L3Pricing() {
    const [billing, setBilling] = useState<BillingPeriod>('annual');
    const [quoteOpen, setQuoteOpen] = useState(false);

    return (
        <>
            <section className="bg-paper py-24" id="precios">
                <div className="mx-auto max-w-[1200px] px-6">
                    {/* Header */}
                    <div className="mb-12 text-center">
                        <p className="text-mute mb-3 font-mono text-[11px] tracking-[0.12em] uppercase">
                            Precios
                        </p>
                        <h2 className="font-display text-ink text-[48px] font-semibold tracking-[-0.03em]">
                            El plan perfecto para tu establecimiento
                        </h2>
                        <p className="text-ink-dim mx-auto mt-3 max-w-md text-[15px]">
                            Precios pensados para el presupuesto educacional chileno. Sin sorpresas,
                            cancela cuando quieras.
                        </p>
                    </div>

                    {/* Billing toggle - Refined & Delicate Segmented Control */}
                    <div className="mb-14 flex flex-col items-center gap-3">
                        <div className="bg-paper-warm/50 border-border/40 relative flex rounded-full border p-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                            {/* Sliding background */}
                            <motion.div
                                className="border-border/10 absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]"
                                initial={false}
                                animate={{
                                    x: billing === 'monthly' ? 0 : '100%',
                                }}
                                transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
                            />

                            <button
                                type="button"
                                onClick={() => setBilling('monthly')}
                                className={cn(
                                    'relative z-10 px-6 py-1.5 text-[12px] font-semibold tracking-tight transition-colors duration-200',
                                    billing === 'monthly'
                                        ? 'text-primary'
                                        : 'text-mute hover:text-ink',
                                )}
                            >
                                Mensual
                            </button>
                            <button
                                type="button"
                                onClick={() => setBilling('annual')}
                                className={cn(
                                    'relative z-10 px-6 py-1.5 text-[12px] font-semibold tracking-tight transition-colors duration-200',
                                    billing === 'annual'
                                        ? 'text-primary'
                                        : 'text-mute hover:text-ink',
                                )}
                            >
                                Anual
                            </button>
                        </div>

                        {/* Savings Indicator - More subtle */}
                        <div
                            className={cn(
                                'flex items-center gap-1.5 transition-all duration-500',
                                billing === 'annual'
                                    ? 'translate-y-0 opacity-100'
                                    : 'pointer-events-none -translate-y-1 opacity-0',
                            )}
                        >
                            <span className="text-success/80 font-mono text-[9px] font-bold tracking-[0.05em] uppercase">
                                Recomendado
                            </span>
                            <div className="bg-border/40 h-3 w-px" />
                            <span className="text-primary text-[10px] font-bold italic">
                                Ahorra 17%
                            </span>
                        </div>
                    </div>

                    {/* Plan cards */}
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {PLANS.map((plan) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                billing={billing}
                                onQuote={() => setQuoteOpen(true)}
                            />
                        ))}
                    </div>

                    {/* Footer note */}
                    <p className="text-mute mt-8 text-center text-[13px]">
                        Todos los planes incluyen soporte en español · Los precios no incluyen IVA ·
                        Cancela cuando quieras
                    </p>
                </div>
            </section>
            <QuoteDialog open={quoteOpen} onOpenChange={setQuoteOpen} />
        </>
    );
}
