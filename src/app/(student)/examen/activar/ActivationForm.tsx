'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { InputField } from '@/shared/components/ui/input';
import {
    b2cActivatePasswordSchema,
    type B2cActivatePasswordInput,
} from '@/features/subscriptions/schemas/b2c-checkout.schemas';
import { activateB2cAccount } from '@/features/lms/actions/b2c-activation';

interface ActivationFormProps {
    token: string;
}

export function ActivationForm({ token }: ActivationFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const [done, setDone] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<B2cActivatePasswordInput>({
        resolver: zodResolver(b2cActivatePasswordSchema),
        defaultValues: { token, password: '', confirmPassword: '' },
    });

    function onSubmit(values: B2cActivatePasswordInput) {
        startTransition(async () => {
            const res = await activateB2cAccount(values);
            if (res.error || !res.data) {
                toast.error(res.error ?? 'No se pudo activar la cuenta.');
                return;
            }
            setDone(true);
            // Pequeño delay para que el usuario vea el check, luego lo mandamos al dashboard.
            setTimeout(() => {
                router.push('/students/dashboard');
                router.refresh();
            }, 1500);
        });
    }

    if (done) {
        return (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="bg-success/10 flex size-16 items-center justify-center rounded-full">
                    <CheckCircle2 className="text-success size-9" />
                </div>
                <h1 className="text-ink font-display text-[24px] font-semibold tracking-tight">
                    ¡Cuenta activada!
                </h1>
                <p className="text-ink-dim text-[14px]">
                    Te estamos llevando a tu aula…
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('token')} />
            <p className="text-ink-dim text-[13px]">
                Tu contraseña debe tener al menos 8 caracteres, una mayúscula y un número.
            </p>
            <div className="relative">
                <InputField
                    label="Nueva contraseña"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    {...register('password')}
                    disabled={isPending}
                    error={errors.password?.message}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="text-mute hover:text-ink absolute right-2 top-[34px] flex size-8 items-center justify-center rounded-md"
                >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
            <InputField
                label="Repetir contraseña"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('confirmPassword')}
                disabled={isPending}
                error={errors.confirmPassword?.message}
            />
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
                        Activando…
                    </>
                ) : (
                    'Activar cuenta'
                )}
            </Button>
        </form>
    );
}
