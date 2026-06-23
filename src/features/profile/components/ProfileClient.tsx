'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
    profileUpdateSchema,
    type ProfileUpdateInput,
} from '@/features/profile/schemas/profile.schemas';
import { updateMyProfile } from '@/features/profile/actions/mutations';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { RutField } from '@/shared/components/ui/rut-field';
import { Avatar } from '@/shared/components/ui/avatar';
import { cn } from '@/shared/lib/utils';
import { formatRut } from '@/shared/lib/rut';

interface Props {
    user: {
        name: string;
        lastname: string;
        email: string;
        rut: string;
        role: string;
    };
}

export function ProfileClient({ user }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<ProfileUpdateInput>({
        resolver: zodResolver(profileUpdateSchema),
        defaultValues: {
            name: user.name,
            lastname: user.lastname,
            email: user.email,
            rut: formatRut(user.rut),
            password: '',
        },
    });

    function onSubmit(data: ProfileUpdateInput): void {
        startTransition(async () => {
            const result = await updateMyProfile(data);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Perfil actualizado');
            router.refresh();
        });
    }

    return (
        <div className="mx-auto max-w-2xl px-6 py-10">
            {/* Header */}
            <div className="mb-8 flex items-center gap-4">
                <Avatar
                    name={`${user.name} ${user.lastname}`}
                    size={56}
                    className="ring-border shadow-md ring-2"
                />
                <div>
                    <h1 className="text-ink text-[22px] font-bold tracking-tight">
                        {user.name} {user.lastname}
                    </h1>
                    <p className="text-mute text-[13px]">{user.role}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Nombre + Apellido */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="profile-name" className="text-ink text-[13px] font-bold">
                            Nombre
                        </label>
                        <Input
                            id="profile-name"
                            {...register('name')}
                            className={cn(
                                'border-border h-11 rounded-[10px] bg-white',
                                errors.name && 'border-destructive',
                            )}
                        />
                        {errors.name && (
                            <p className="text-destructive text-xs font-medium">
                                {errors.name.message}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="profile-lastname"
                            className="text-ink text-[13px] font-bold"
                        >
                            Apellido
                        </label>
                        <Input
                            id="profile-lastname"
                            {...register('lastname')}
                            className={cn(
                                'border-border h-11 rounded-[10px] bg-white',
                                errors.lastname && 'border-destructive',
                            )}
                        />
                        {errors.lastname && (
                            <p className="text-destructive text-xs font-medium">
                                {errors.lastname.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="profile-email" className="text-ink text-[13px] font-bold">
                        Email
                    </label>
                    <Input
                        id="profile-email"
                        type="email"
                        {...register('email')}
                        className={cn(
                            'border-border h-11 rounded-[10px] bg-white',
                            errors.email && 'border-destructive',
                        )}
                    />
                    {errors.email && (
                        <p className="text-destructive text-xs font-medium">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                {/* RUT */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-ink text-[13px] font-bold">RUT</span>
                    <Controller
                        name="rut"
                        control={control}
                        render={({ field }) => (
                            <RutField
                                value={field.value ?? ''}
                                onChange={field.onChange}
                                className={cn(
                                    'border-border h-11 rounded-[10px] bg-white',
                                    errors.rut && 'border-destructive',
                                )}
                            />
                        )}
                    />
                    {errors.rut && (
                        <p className="text-destructive text-xs font-medium">{errors.rut.message}</p>
                    )}
                </div>

                {/* Contraseña */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="profile-password" className="text-ink text-[13px] font-bold">
                        Nueva contraseña
                        <span className="text-mute ml-2 font-normal">
                            (dejá en blanco para no cambiarla)
                        </span>
                    </label>
                    <div className="relative">
                        <Input
                            id="profile-password"
                            type={showPassword ? 'text' : 'password'}
                            {...register('password')}
                            placeholder="Mínimo 8 caracteres"
                            autoComplete="new-password"
                            className={cn(
                                'border-border h-11 rounded-[10px] bg-white pr-10',
                                errors.password && 'border-destructive',
                            )}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            tabIndex={-1}
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            className="text-mute hover:text-ink absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-destructive text-xs font-medium">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <div className="border-border flex items-center justify-between border-t pt-5">
                    <div className="text-mute flex items-center gap-2 text-[12px]">
                        <UserCircle size={14} />
                        El nombre actualizado se verá en la próxima sesión
                    </div>
                    <Button type="submit" disabled={isPending} variant="ink" size="md">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar cambios
                    </Button>
                </div>
            </form>
        </div>
    );
}
