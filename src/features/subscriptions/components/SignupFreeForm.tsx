'use client';

import type * as React from 'react';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { IMaskInput } from 'react-imask';
import Link from 'next/link';
import {
    ArrowRight,
    Building2,
    Eye,
    EyeOff,
    Hash,
    Loader2,
    Lock,
    Mail,
    MapPin,
    Phone,
    User,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Control, UseFormRegister, FieldErrors } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import { registerFreeInstitution } from '@/features/subscriptions/actions/signup';
import {
    signupFreeSchema,
    type SignupFreeInput,
} from '@/features/subscriptions/schemas/signup.schemas';

// ── Shared field wrapper ──────────────────────────────────────────────────────

interface FormFieldProps {
    label: string;
    icon: React.ReactNode;
    error?: string;
    children: React.ReactNode;
}

function FormField({ label, icon, error, children }: FormFieldProps): React.JSX.Element {
    return (
        <div className="flex flex-col gap-1">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: input is injected via children */}
            <label className="flex h-[46px] cursor-text items-center gap-3 rounded-[8px] border border-border bg-white px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 hover:border-ink/20">
                <span className="shrink-0 text-mute">{icon}</span>
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-mono text-[9px] uppercase leading-none tracking-[0.08em] text-mute">
                        {label}
                    </span>
                    {children}
                </div>
            </label>
            {error && <p className="text-[12px] text-destructive">{error}</p>}
        </div>
    );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }): React.JSX.Element {
    return (
        <div className="flex items-center gap-3 pt-2">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-mute">{title}</span>
            <div className="h-px flex-1 bg-border" />
        </div>
    );
}

// ── RUT field (IMask + Controller) ────────────────────────────────────────────

interface RutFieldProps {
    name: 'institutionRut' | 'adminRut';
    label: string;
    control: Control<SignupFreeInput>;
    error?: string;
    disabled: boolean;
}

function RutField({ name, label, control, error, disabled }: RutFieldProps): React.JSX.Element {
    return (
        <FormField label={label} icon={<Hash size={14} />} error={error}>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <IMaskInput
                        mask="00.000.000-[*]"
                        definitions={{ '*': /[0-9kK]/ }}
                        value={field.value ?? ''}
                        onAccept={field.onChange}
                        disabled={disabled}
                        placeholder="12.345.678-9"
                        className="bg-transparent text-[14px] text-ink outline-none placeholder:text-mute/50 disabled:opacity-60"
                    />
                )}
            />
        </FormField>
    );
}

// ── Institution section ───────────────────────────────────────────────────────

interface SectionProps {
    register: UseFormRegister<SignupFreeInput>;
    control: Control<SignupFreeInput>;
    errors: FieldErrors<SignupFreeInput>;
    disabled: boolean;
}

function InstitutionSection({ register, control, errors, disabled }: SectionProps): React.JSX.Element {
    return (
        <div className="space-y-2">
            <SectionHeader title="Datos del establecimiento" />
            <FormField label="Nombre del establecimiento" icon={<Building2 size={14} />} error={errors.institutionName?.message}>
                <input
                    {...register('institutionName')}
                    disabled={disabled}
                    placeholder="Colegio San Martín"
                    className="bg-transparent text-[14px] text-ink outline-none placeholder:text-mute/50 disabled:opacity-60"
                />
            </FormField>
            <RutField name="institutionRut" label="RUT del establecimiento" control={control} error={errors.institutionRut?.message} disabled={disabled} />
            <div className="grid grid-cols-2 gap-2">
                <FormField label="Teléfono" icon={<Phone size={14} />} error={errors.institutionPhone?.message}>
                    <input
                        {...register('institutionPhone')}
                        type="tel"
                        disabled={disabled}
                        placeholder="+56 9 1234 5678"
                        className="bg-transparent text-[14px] text-ink outline-none placeholder:text-mute/50 disabled:opacity-60"
                    />
                </FormField>
                <FormField label="Ciudad" icon={<MapPin size={14} />} error={errors.institutionCity?.message}>
                    <input
                        {...register('institutionCity')}
                        disabled={disabled}
                        placeholder="Santiago"
                        className="bg-transparent text-[14px] text-ink outline-none placeholder:text-mute/50 disabled:opacity-60"
                    />
                </FormField>
            </div>
        </div>
    );
}

// ── Admin section ─────────────────────────────────────────────────────────────

function AdminSection({ register, control, errors, disabled }: SectionProps): React.JSX.Element {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="space-y-2">
            <SectionHeader title="Tu cuenta de administrador" />
            <div className="grid grid-cols-2 gap-2">
                <FormField label="Nombre" icon={<User size={14} />} error={errors.adminName?.message}>
                    <input
                        {...register('adminName')}
                        disabled={disabled}
                        placeholder="María"
                        className="bg-transparent text-[14px] text-ink outline-none placeholder:text-mute/50 disabled:opacity-60"
                    />
                </FormField>
                <FormField label="Apellido" icon={<User size={14} />} error={errors.adminLastname?.message}>
                    <input
                        {...register('adminLastname')}
                        disabled={disabled}
                        placeholder="González"
                        className="bg-transparent text-[14px] text-ink outline-none placeholder:text-mute/50 disabled:opacity-60"
                    />
                </FormField>
            </div>
            <FormField label="Email" icon={<Mail size={14} />} error={errors.adminEmail?.message}>
                <input
                    {...register('adminEmail')}
                    type="email"
                    disabled={disabled}
                    placeholder="admin@colegio.cl"
                    className="bg-transparent text-[14px] text-ink outline-none placeholder:text-mute/50 disabled:opacity-60"
                />
            </FormField>
            <RutField name="adminRut" label="Tu RUT" control={control} error={errors.adminRut?.message} disabled={disabled} />
            <FormField label="Contraseña" icon={<Lock size={14} />} error={errors.adminPassword?.message}>
                <input
                    {...register('adminPassword')}
                    type={showPassword ? 'text' : 'password'}
                    disabled={disabled}
                    placeholder="••••••••"
                    className="bg-transparent text-[14px] text-ink outline-none placeholder:text-mute/50 disabled:opacity-60"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="ml-auto shrink-0 text-mute outline-none transition-colors hover:text-ink"
                    tabIndex={-1}
                >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
            </FormField>
        </div>
    );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function SignupFreeForm(): React.JSX.Element {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    const { register, control, handleSubmit, formState: { errors } } = useForm<SignupFreeInput>({
        resolver: zodResolver(signupFreeSchema),
        defaultValues: { acceptTerms: false },
    });

    async function onSubmit(data: SignupFreeInput): Promise<void> {
        setIsPending(true);
        try {
            const result = await registerFreeInstitution(data);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            const signInResult = await signIn('credentials', {
                email: data.adminEmail,
                password: data.adminPassword,
                redirect: false,
            });
            if (signInResult?.error) {
                toast.success('Cuenta creada. Iniciá sesión para continuar.');
                router.replace('/login');
                return;
            }
            router.replace(`/${result.data?.slug}`);
        } catch {
            toast.error('Error inesperado. Intentá de nuevo.');
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className="space-y-5">
            <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-mute">
                    Plan Free · Sin tarjeta de crédito
                </span>
                <h1 className="mt-2 font-display text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink">
                    Crear cuenta gratis
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">
                    Empezá a digitalizar tus evaluaciones en minutos.
                </p>
            </div>

            <form
                onSubmit={(e) => { void handleSubmit(onSubmit)(e); }}
                className="space-y-4"
            >
                <InstitutionSection register={register} control={control} errors={errors} disabled={isPending} />
                <AdminSection register={register} control={control} errors={errors} disabled={isPending} />

                {/* Accept terms */}
                <div className="flex flex-col gap-1">
                    <label className="flex cursor-pointer items-start gap-3">
                        <input
                            type="checkbox"
                            {...register('acceptTerms')}
                            disabled={isPending}
                            className="mt-0.5 size-4 shrink-0 accent-primary"
                        />
                        <span className="text-[13px] leading-snug text-ink-dim">
                            Acepto los{' '}
                            <Link href="/terminos" className="font-medium text-primary hover:underline" target="_blank">
                                términos de uso
                            </Link>{' '}
                            y la{' '}
                            <Link href="/privacidad" className="font-medium text-primary hover:underline" target="_blank">
                                política de privacidad
                            </Link>
                        </span>
                    </label>
                    {errors.acceptTerms && (
                        <p className="text-[12px] text-destructive">{errors.acceptTerms.message}</p>
                    )}
                </div>

                <Button variant="ink" size="lg" type="submit" disabled={isPending} className="mt-1 w-full">
                    {isPending ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <>
                            Crear cuenta gratis
                            <ArrowRight className="size-4" />
                        </>
                    )}
                </Button>
            </form>

            <p className="text-center text-[13px] text-ink-dim">
                ¿Ya tenés una cuenta?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                    Iniciá sesión
                </Link>
            </p>
        </div>
    );
}
