'use client';

import type * as React from 'react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import { profileUpdateSchema, type ProfileUpdateInput } from '@/features/profile/schemas/profile.schemas';
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

export function ProfileClient({ user }: Props): React.JSX.Element {
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
                <Avatar name={`${user.name} ${user.lastname}`} size={56} className="ring-2 ring-border shadow-md" />
                <div>
                    <h1 className="text-[22px] font-bold tracking-tight text-ink">
                        {user.name} {user.lastname}
                    </h1>
                    <p className="text-[13px] text-mute">{user.role}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Nombre + Apellido */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="profile-name" className="text-[13px] font-bold text-ink">Nombre</label>
                        <Input
                            id="profile-name"
                            {...register('name')}
                            className={cn('h-11 rounded-[10px] bg-white border-border', errors.name && 'border-destructive')}
                        />
                        {errors.name && <p className="text-xs text-destructive font-medium">{errors.name.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="profile-lastname" className="text-[13px] font-bold text-ink">Apellido</label>
                        <Input
                            id="profile-lastname"
                            {...register('lastname')}
                            className={cn('h-11 rounded-[10px] bg-white border-border', errors.lastname && 'border-destructive')}
                        />
                        {errors.lastname && <p className="text-xs text-destructive font-medium">{errors.lastname.message}</p>}
                    </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="profile-email" className="text-[13px] font-bold text-ink">Email</label>
                    <Input
                        id="profile-email"
                        type="email"
                        {...register('email')}
                        className={cn('h-11 rounded-[10px] bg-white border-border', errors.email && 'border-destructive')}
                    />
                    {errors.email && <p className="text-xs text-destructive font-medium">{errors.email.message}</p>}
                </div>

                {/* RUT */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-bold text-ink">RUT</span>
                    <Controller
                        name="rut"
                        control={control}
                        render={({ field }) => (
                            <RutField
                                value={field.value ?? ''}
                                onChange={field.onChange}
                                className={cn('h-11 rounded-[10px] bg-white border-border', errors.rut && 'border-destructive')}
                            />
                        )}
                    />
                    {errors.rut && <p className="text-xs text-destructive font-medium">{errors.rut.message}</p>}
                </div>

                {/* Contraseña */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="profile-password" className="text-[13px] font-bold text-ink">
                        Nueva contraseña
                        <span className="ml-2 font-normal text-mute">(dejá en blanco para no cambiarla)</span>
                    </label>
                    <div className="relative">
                        <Input
                            id="profile-password"
                            type={showPassword ? 'text' : 'password'}
                            {...register('password')}
                            placeholder="Mínimo 8 caracteres"
                            autoComplete="new-password"
                            className={cn('h-11 rounded-[10px] bg-white border-border pr-10', errors.password && 'border-destructive')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            tabIndex={-1}
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink transition-colors"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive font-medium">{errors.password.message}</p>}
                </div>

                <div className="flex items-center justify-between border-t border-border pt-5">
                    <div className="flex items-center gap-2 text-[12px] text-mute">
                        <UserCircle size={14} />
                        El nombre actualizado se verá en la próxima sesión
                    </div>
                    <Button type="submit" disabled={isPending} variant="ink" size="md">
                        {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Guardar cambios
                    </Button>
                </div>
            </form>
        </div>
    );
}
