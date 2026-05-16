import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Tag } from '@/shared/components/ui/badge';

const PLANS = [
    {
        id: 'colegio',
        name: 'Colegio',
        price: 'A consultar',
        period: '',
        sub: 'Para establecimientos de educación básica y media',
        cta: 'Contactar',
        ctaVariant: 'ghost' as const,
        featured: false,
        features: [
            'Hasta 500 estudiantes activos',
            'Exámenes ilimitados',
            'Banco de preguntas compartido',
            'Resultados en tiempo real',
            'Anti-copia básico',
            'Soporte por correo',
        ],
    },
    {
        id: 'institucion',
        name: 'Institución',
        price: 'A consultar',
        period: '',
        sub: 'Para preuniversitarios, CFT, IP y universidades',
        cta: 'Solicitar demo',
        ctaVariant: 'lime' as const,
        featured: true,
        features: [
            'Estudiantes ilimitados',
            'Multi-sede y multi-carrera',
            'API de integración con SGA',
            'Anti-copia avanzado (IP única, timing)',
            'Panel SuperAdmin con auditoría',
            'Soporte prioritario 24/7',
        ],
    },
];

export function L3Pricing(): React.JSX.Element {
    return (
        <section className="bg-paper py-24" id="precios">
            <div className="mx-auto max-w-[860px] px-6">
                <div className="mb-12 text-center">
                    <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-mute">
                        Precios
                    </p>
                    <h2 className="font-display text-[48px] font-semibold tracking-[-0.03em] text-ink">
                        Sin sorpresas
                    </h2>
                    <p className="mx-auto mt-3 max-w-sm text-[15px] text-ink-dim">
                        Precios pensados para el presupuesto educacional chileno.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative flex flex-col rounded-[22px] p-8 ${
                                plan.featured
                                    ? 'bg-ink text-white'
                                    : 'border border-border bg-white'
                            }`}
                        >
                            {plan.featured && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <Tag tone="lime" size="sm">MÁS ELEGIDO</Tag>
                                </div>
                            )}

                            <div className="mb-6 space-y-1">
                                <h3 className={`font-display text-[24px] font-semibold tracking-[-0.02em] ${plan.featured ? 'text-white' : 'text-ink'}`}>
                                    {plan.name}
                                </h3>
                                <p className={`text-[13px] ${plan.featured ? 'text-white/60' : 'text-mute'}`}>
                                    {plan.sub}
                                </p>
                            </div>

                            <div className="mb-6">
                                <span className={`font-display text-[36px] font-semibold tracking-[-0.03em] ${plan.featured ? 'text-lime' : 'text-ink'}`}>
                                    {plan.price}
                                </span>
                            </div>

                            <ul className="mb-8 flex-1 space-y-2.5">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2.5">
                                        <Check className={`mt-0.5 size-4 shrink-0 ${plan.featured ? 'text-lime' : 'text-success'}`} />
                                        <span className={`text-[13px] ${plan.featured ? 'text-white/80' : 'text-ink'}`}>
                                            {f}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                variant={plan.featured ? plan.ctaVariant : 'ghost'}
                                size="lg"
                                className="w-full"
                                asChild
                            >
                                <Link href="/login">{plan.cta}</Link>
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
