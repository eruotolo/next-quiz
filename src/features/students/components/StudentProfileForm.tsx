'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
    studentProfileUpdateSchema,
    type StudentProfileUpdateInput,
} from '@/features/students/schemas/profile.schemas';
import { updateStudentProfile } from '@/features/students/actions/profile';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

interface Props {
    name: string;
    lastname: string;
    email: string;
    phone: string | null;
}

export function StudentProfileForm({ name, lastname, email, phone }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
    } = useForm<StudentProfileUpdateInput>({
        resolver: zodResolver(studentProfileUpdateSchema),
        defaultValues: {
            name,
            lastname,
            email,
            phone: phone ?? '',
        },
    });

    function onSubmit(data: StudentProfileUpdateInput): void {
        startTransition(async () => {
            const result = await updateStudentProfile(data);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Datos actualizados');
            reset({
                name: data.name,
                lastname: data.lastname,
                email: data.email,
                phone: data.phone ?? '',
            });
            router.refresh();
        });
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                    id="name"
                    label="Nombre"
                    error={errors.name?.message}
                    input={
                        <Input
                            id="name"
                            autoComplete="given-name"
                            aria-invalid={!!errors.name}
                            {...register('name')}
                        />
                    }
                />
                <Field
                    id="lastname"
                    label="Apellido"
                    error={errors.lastname?.message}
                    input={
                        <Input
                            id="lastname"
                            autoComplete="family-name"
                            aria-invalid={!!errors.lastname}
                            {...register('lastname')}
                        />
                    }
                />
            </div>
            <Field
                id="email"
                label="Email"
                error={errors.email?.message}
                input={
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        aria-invalid={!!errors.email}
                        {...register('email')}
                    />
                }
            />
            <Field
                id="phone"
                label="Teléfono"
                error={errors.phone?.message}
                hint="Opcional"
                input={
                    <Input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+56 9 1234 5678"
                        aria-invalid={!!errors.phone}
                        {...register('phone')}
                    />
                }
            />

            <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                    type="submit"
                    disabled={isPending || !isDirty}
                    size="sm"
                    className="gap-1.5"
                >
                    {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    Guardar
                </Button>
            </div>
        </form>
    );
}

function Field({
    id,
    label,
    error,
    hint,
    input,
}: {
    id: string;
    label: string;
    error?: string;
    hint?: string;
    input: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-ink text-[12px] font-medium">
                {label}
                {hint && <span className="text-mute ml-1 font-normal">({hint})</span>}
            </label>
            {input}
            {error && <p className="text-destructive text-[11px]">{error}</p>}
        </div>
    );
}
