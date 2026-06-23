'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Loader2, Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import { createPaidCheckout } from '@/features/subscriptions/actions/signup';
import {
    payerFormSchema,
    type PayerFormInput,
} from '@/features/subscriptions/schemas/signup.schemas';
import type { PaidPlan } from '@/features/subscriptions/lib/mercadopago';

const PLAN_LABELS: Record<PaidPlan, { name: string; monthly: number; annual: number }> = {
    DOCENTE: { name: 'Docente', monthly: 9990, annual: 7990 },
    COLEGIO: { name: 'Colegio', monthly: 29990, annual: 24990 },
};

function formatCLP(n: number): string {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
    }).format(n);
}

interface FormFieldProps {
    label: string;
    icon?: ReactNode;
    error?: string;
    children: ReactNode;
}

function FormField({ label, icon, error, children }: FormFieldProps) {
    return (
        <div className="flex flex-col gap-1">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: input injected via children */}
            <label className="border-border focus-within:border-primary focus-within:ring-primary/20 hover:border-ink/20 flex h-[46px] cursor-text items-center gap-3 rounded-[8px] border bg-white px-3 transition-colors focus-within:ring-2">
                {icon && <span className="text-mute shrink-0">{icon}</span>}
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-mute font-mono text-[9px] leading-none tracking-[0.08em] uppercase">
                        {label}
                    </span>
                    {children}
                </div>
            </label>
            {error && <p className="text-destructive text-[12px]">{error}</p>}
        </div>
    );
}

interface Props {
    plan: PaidPlan;
}

export function PayerForm({ plan }: Props) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const info = PLAN_LABELS[plan];

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<PayerFormInput>({
        resolver: zodResolver(payerFormSchema),
        defaultValues: { billing: 'annual' },
    });

    const billing = watch('billing');
    const price = billing === 'annual' ? info.annual : info.monthly;

    async function onSubmit(data: PayerFormInput): Promise<void> {
        setIsPending(true);
        try {
            const result = await createPaidCheckout(
                {
                    payerName: data.payerName,
                    payerLastname: data.payerLastname,
                    payerEmail: data.payerEmail,
                    billing: data.billing,
                },
                plan,
            );

            if (result.error) {
                toast.error(result.error);
                return;
            }

            const { initPoint, subscriptionId } = result.data!;

            if (initPoint) {
                window.location.href = initPoint;
            } else {
                router.push(`/registro/${plan.toLowerCase()}/exito?sub=${subscriptionId}`);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error inesperado. Intenta de nuevo.';
            toast.error(msg);
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className="space-y-5">
            <div>
                <span className="text-mute font-mono text-[11px] tracking-[0.1em] uppercase">
                    Plan {info.name} · Suscripción recurrente
                </span>
                <h1 className="font-display text-ink mt-2 text-[34px] leading-none font-semibold tracking-[-0.03em]">
                    Datos de pago
                </h1>
                <p className="text-ink-dim mt-2 text-[14px] leading-relaxed">
                    Después de confirmar el pago vas a completar el registro de tu institución.
                </p>
            </div>

            <form
                onSubmit={(e) => {
                    void handleSubmit(onSubmit)(e);
                }}
                className="space-y-4"
            >
                <div className="grid grid-cols-2 gap-2">
                    <FormField
                        label="Nombre"
                        icon={<User size={14} />}
                        error={errors.payerName?.message}
                    >
                        <input
                            {...register('payerName')}
                            disabled={isPending}
                            placeholder="María"
                            className="text-ink placeholder:text-mute/50 bg-transparent text-[14px] outline-none disabled:opacity-60"
                        />
                    </FormField>
                    <FormField
                        label="Apellido"
                        icon={<User size={14} />}
                        error={errors.payerLastname?.message}
                    >
                        <input
                            {...register('payerLastname')}
                            disabled={isPending}
                            placeholder="González"
                            className="text-ink placeholder:text-mute/50 bg-transparent text-[14px] outline-none disabled:opacity-60"
                        />
                    </FormField>
                </div>

                <FormField
                    label="Email de contacto"
                    icon={<Mail size={14} />}
                    error={errors.payerEmail?.message}
                >
                    <input
                        {...register('payerEmail')}
                        type="email"
                        disabled={isPending}
                        placeholder="admin@colegio.cl"
                        className="text-ink placeholder:text-mute/50 bg-transparent text-[14px] outline-none disabled:opacity-60"
                    />
                </FormField>

                {/* Billing toggle */}
                <div className="flex flex-col gap-1">
                    <p className="text-mute font-mono text-[9px] tracking-[0.08em] uppercase">
                        Modalidad de pago
                    </p>
                    <div className="border-border flex overflow-hidden rounded-[8px] border">
                        {(['monthly', 'annual'] as const).map((b) => (
                            <label
                                key={b}
                                className={`flex flex-1 cursor-pointer flex-col items-center gap-0.5 p-3 text-center transition-colors ${billing === b ? 'bg-ink text-white' : 'text-ink hover:bg-paper bg-white'}`}
                            >
                                <input
                                    type="radio"
                                    {...register('billing')}
                                    value={b}
                                    className="sr-only"
                                />
                                <span className="text-[13px] font-semibold">
                                    {b === 'monthly' ? 'Mensual' : 'Anual'}
                                </span>
                                <span
                                    className={`text-[12px] ${billing === b ? 'text-white/70' : 'text-mute'}`}
                                >
                                    {formatCLP(b === 'annual' ? info.annual : info.monthly)}/mes
                                </span>
                                {b === 'annual' && (
                                    <span
                                        className={`text-[11px] font-medium ${billing === b ? 'text-lime' : 'text-success'}`}
                                    >
                                        Ahorrás 17%
                                    </span>
                                )}
                            </label>
                        ))}
                    </div>
                    {errors.billing && (
                        <p className="text-destructive text-[12px]">{errors.billing.message}</p>
                    )}
                </div>

                {/* Summary */}
                <div className="border-border bg-paper rounded-[10px] border px-4 py-3">
                    <div className="flex items-center justify-between">
                        <span className="text-ink-dim text-[13px]">
                            Plan {info.name} · {billing === 'annual' ? 'Anual' : 'Mensual'}
                        </span>
                        <span className="text-ink font-semibold">
                            {formatCLP(price)}
                            <span className="text-mute text-[12px] font-normal">/mes</span>
                        </span>
                    </div>
                    {billing === 'annual' && (
                        <p className="text-mute mt-1 text-[12px]">
                            Facturado como {formatCLP(price * 12)} al año
                        </p>
                    )}
                </div>

                <Button
                    variant="ink"
                    size="lg"
                    type="submit"
                    disabled={isPending}
                    className="mt-1 w-full"
                >
                    {isPending ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <>
                            Continuar al pago
                            <ArrowRight className="size-4" />
                        </>
                    )}
                </Button>
            </form>

            <p className="text-ink-dim text-center text-[13px]">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/login" className="text-primary font-medium hover:underline">
                    Inicia sesión
                </Link>
            </p>
        </div>
    );
}
