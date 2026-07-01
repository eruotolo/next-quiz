'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { InputField } from '@/shared/components/ui/input';
import { RutInputField } from '@/shared/components/ui/rut-field';
import {
    b2cCheckoutSchema,
    type B2cCheckoutInput,
} from '@/features/subscriptions/schemas/b2c-checkout.schemas';
import { createLmsCheckoutPreference } from '@/features/lms/actions/b2c-orders';

interface CheckoutFormProps {
    slug: string;
    courseId: string;
}

export function CheckoutForm({ slug, courseId }: CheckoutFormProps) {
    const [isPending, startTransition] = useTransition();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<B2cCheckoutInput>({
        resolver: zodResolver(b2cCheckoutSchema),
        defaultValues: {
            courseId,
            studentRut: '',
            studentName: '',
            studentLastname: '',
            studentEmail: '',
            acceptTerms: false,
        },
    });

    function onSubmit(values: B2cCheckoutInput) {
        startTransition(async () => {
            const res = await createLmsCheckoutPreference(slug, values);
            if (res.error || !res.data?.initPoint) {
                toast.error(res.error ?? 'No se pudo iniciar el pago.');
                return;
            }
            window.location.href = res.data.initPoint;
        });
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <RutInputField
                id="studentRut"
                value={watch('studentRut')}
                onChange={(v) => setValue('studentRut', v, { shouldValidate: true })}
                disabled={isPending}
                error={errors.studentRut?.message}
            />

            <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                    label="Nombre"
                    {...register('studentName')}
                    disabled={isPending}
                    error={errors.studentName?.message}
                />
                <InputField
                    label="Apellido"
                    {...register('studentLastname')}
                    disabled={isPending}
                    error={errors.studentLastname?.message}
                />
            </div>

            <InputField
                label="Email"
                type="email"
                placeholder="tu@email.cl"
                {...register('studentEmail')}
                disabled={isPending}
                error={errors.studentEmail?.message}
            />

            <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                    type="checkbox"
                    disabled={isPending}
                    {...register('acceptTerms')}
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                />
                <span className="text-ink-dim text-[12.5px] leading-relaxed">
                    Acepto los{' '}
                    <a
                        href="/empresa/terminos"
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Términos de uso
                    </a>{' '}
                    y la{' '}
                    <a
                        href="/empresa/privacidad"
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Política de Privacidad
                    </a>
                </span>
            </label>
            {errors.acceptTerms && (
                <p className="text-destructive text-[12px] -mt-3">
                    {errors.acceptTerms.message}
                </p>
            )}

            <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isPending}
            >
                {isPending ? (
                    <>
                        <Loader2 className="size-4 animate-spin" />
                        Redirigiendo a MercadoPago…
                    </>
                ) : (
                    'Ir a pagar'
                )}
            </Button>

            <p className="text-mute text-center text-[11.5px]">
                Pagás con MercadoPago · Sin suscripciones · Acceso inmediato
            </p>
        </form>
    );
}
