'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { IMaskInput } from 'react-imask';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { RUT_MASK, RUT_MASK_DEFINITIONS } from '@/shared/components/ui/rut-field';
import { INSTITUTION_TYPE_OPTIONS } from '@/shared/lib/academic-labels';
import { completeRegistration } from '@/features/subscriptions/actions/signup';
import {
    registrationSchema,
    type RegistrationInput,
} from '@/features/subscriptions/schemas/signup.schemas';

interface FormFieldProps {
    label: string;
    icon: ReactNode;
    error?: string;
    children: ReactNode;
    rightElement?: ReactNode;
}

function FormField({ label, icon, error, children, rightElement }: FormFieldProps) {
    return (
        <div className="flex flex-col gap-1">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: input injected via children */}
            <label className="border-border focus-within:border-primary focus-within:ring-primary/20 hover:border-ink/20 flex h-[46px] cursor-text items-center gap-3 rounded-[8px] border bg-white px-3 transition-colors focus-within:ring-2">
                <span className="text-mute shrink-0">{icon}</span>
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-mute font-mono text-[9px] leading-none tracking-[0.08em] uppercase">
                        {label}
                    </span>
                    {children}
                </div>
                {rightElement && <div className="shrink-0 flex items-center justify-center">{rightElement}</div>}
            </label>
            {error && <p className="text-destructive text-[12px]">{error}</p>}
        </div>
    );
}

function SectionHeader({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-3 pt-2">
            <div className="bg-border h-px flex-1" />
            <span className="text-mute font-mono text-[10px] tracking-[0.1em] uppercase">
                {title}
            </span>
            <div className="bg-border h-px flex-1" />
        </div>
    );
}

interface RutFieldProps {
    name: 'institutionRut' | 'adminRut';
    label: string;
    control: Control<RegistrationInput>;
    error?: string;
    disabled: boolean;
}

function RutField({ name, label, control, error, disabled }: RutFieldProps) {
    return (
        <FormField label={label} icon={<Hash size={14} />} error={error}>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <IMaskInput
                        mask={RUT_MASK}
                        definitions={RUT_MASK_DEFINITIONS}
                        value={field.value ?? ''}
                        onAccept={field.onChange}
                        disabled={disabled}
                        placeholder="12.345.678-9"
                        className="text-ink placeholder:text-mute/50 bg-transparent text-[14px] outline-none disabled:opacity-60"
                    />
                )}
            />
        </FormField>
    );
}

interface SectionProps {
    register: UseFormRegister<RegistrationInput>;
    control: Control<RegistrationInput>;
    errors: FieldErrors<RegistrationInput>;
    disabled: boolean;
}

function InstitutionSection({
    register,
    control,
    errors,
    disabled,
}: SectionProps) {
    return (
        <div className="space-y-2">
            <SectionHeader title="Datos del establecimiento" />
            <FormField
                label="Tipo de institución"
                icon={<Building2 size={14} />}
            >
                <Controller
                    name="institutionType"
                    control={control}
                    render={({ field }) => (
                        <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={disabled}
                        >
                            <SelectTrigger className="border-0 bg-transparent p-0 !h-auto outline-none focus:ring-0 focus:ring-offset-0 shadow-none text-ink text-[14px] data-[placeholder]:text-mute/50 w-full leading-normal">
                                <SelectValue placeholder="Seleccioná el tipo" />
                            </SelectTrigger>
                            <SelectContent className="border-border rounded-xl shadow-xl">
                                {INSTITUTION_TYPE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
            </FormField>
            <FormField
                label="Nombre del establecimiento"
                icon={<Building2 size={14} />}
                error={errors.institutionName?.message}
            >
                <input
                    {...register('institutionName')}
                    disabled={disabled}
                    placeholder="Colegio San Martín"
                    className="text-ink placeholder:text-mute/50 bg-transparent text-[14px] outline-none disabled:opacity-60"
                />
            </FormField>
            <RutField
                name="institutionRut"
                label="RUT del establecimiento"
                control={control}
                error={errors.institutionRut?.message}
                disabled={disabled}
            />
            <div className="grid grid-cols-2 gap-2">
                <FormField
                    label="Teléfono"
                    icon={<Phone size={14} />}
                    error={errors.institutionPhone?.message}
                >
                    <input
                        {...register('institutionPhone')}
                        type="tel"
                        disabled={disabled}
                        placeholder="+56 9 1234 5678"
                        className="text-ink placeholder:text-mute/50 bg-transparent text-[14px] outline-none disabled:opacity-60"
                    />
                </FormField>
                <FormField
                    label="Ciudad"
                    icon={<MapPin size={14} />}
                    error={errors.institutionCity?.message}
                >
                    <input
                        {...register('institutionCity')}
                        disabled={disabled}
                        placeholder="Santiago"
                        className="text-ink placeholder:text-mute/50 bg-transparent text-[14px] outline-none disabled:opacity-60"
                    />
                </FormField>
            </div>
        </div>
    );
}

function AdminSection({ register, control, errors, disabled }: SectionProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="space-y-2">
            <SectionHeader title="Tu cuenta de administrador" />
            <div className="grid grid-cols-2 gap-2">
                <FormField
                    label="Nombre"
                    icon={<User size={14} />}
                    error={errors.adminName?.message}
                >
                    <input
                        {...register('adminName')}
                        disabled={disabled}
                        placeholder="María"
                        className="text-ink placeholder:text-mute/50 bg-transparent text-[14px] outline-none disabled:opacity-60"
                    />
                </FormField>
                <FormField
                    label="Apellido"
                    icon={<User size={14} />}
                    error={errors.adminLastname?.message}
                >
                    <input
                        {...register('adminLastname')}
                        disabled={disabled}
                        placeholder="González"
                        className="text-ink placeholder:text-mute/50 bg-transparent text-[14px] outline-none disabled:opacity-60"
                    />
                </FormField>
            </div>
            <FormField label="Email" icon={<Mail size={14} />} error={errors.adminEmail?.message}>
                <input
                    {...register('adminEmail')}
                    type="email"
                    disabled={disabled}
                    placeholder="admin@colegio.cl"
                    className="text-ink placeholder:text-mute/50 bg-transparent text-[14px] outline-none disabled:opacity-60"
                />
            </FormField>
            <RutField
                name="adminRut"
                label="Tu RUT"
                control={control}
                error={errors.adminRut?.message}
                disabled={disabled}
            />
            <FormField
                label="Contraseña"
                icon={<Lock size={14} />}
                error={errors.adminPassword?.message}
                rightElement={
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="text-mute hover:text-ink transition-colors outline-none flex items-center justify-center"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                }
            >
                <input
                    {...register('adminPassword')}
                    type={showPassword ? 'text' : 'password'}
                    disabled={disabled}
                    placeholder="••••••••"
                    className="text-ink placeholder:text-mute/50 bg-transparent text-[14px] outline-none disabled:opacity-60"
                />
            </FormField>
        </div>
    );
}

interface Props {
    subscriptionId: string;
    prefillEmail?: string;
    planName: string;
}

export function RegistrationForm({
    subscriptionId,
    prefillEmail,
    planName,
}: Props) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<RegistrationInput>({
        resolver: zodResolver(registrationSchema),
        defaultValues: {
            subscriptionId,
            adminEmail: prefillEmail ?? '',
            acceptTerms: false,
            institutionType: 'OTRO',
        },
    });

    async function onSubmit(data: RegistrationInput): Promise<void> {
        setIsPending(true);
        try {
            const result = await completeRegistration(data);
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
                toast.success('Registro completado. Inicia sesión para continuar.');
                router.replace('/login');
                return;
            }
            router.replace(`/${result.data?.slug}`);
        } catch {
            toast.error('Error inesperado. Intenta de nuevo.');
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className="space-y-5">
            <div>
                <span className="text-mute font-mono text-[11px] tracking-[0.1em] uppercase">
                    Plan {planName} · Pago confirmado
                </span>
                <h1 className="font-display text-ink mt-2 text-[34px] leading-none font-semibold tracking-[-0.03em]">
                    Completa tu registro
                </h1>
                <p className="text-ink-dim mt-2 text-[14px] leading-relaxed">
                    Tu suscripción está activa. Completa los datos de tu institución para comenzar.
                </p>
            </div>

            <form
                onSubmit={(e) => {
                    void handleSubmit(onSubmit)(e);
                }}
                className="space-y-4"
            >
                <input type="hidden" {...register('subscriptionId')} />
                <InstitutionSection
                    register={register}
                    control={control}
                    errors={errors}
                    disabled={isPending}
                />
                <AdminSection
                    register={register}
                    control={control}
                    errors={errors}
                    disabled={isPending}
                />

                <div className="flex flex-col gap-1">
                    <label className="flex cursor-pointer items-start gap-3">
                        <input
                            type="checkbox"
                            {...register('acceptTerms')}
                            disabled={isPending}
                            className="accent-primary mt-0.5 size-4 shrink-0"
                        />
                        <span className="text-ink-dim text-[13px] leading-snug">
                            Acepto los términos de uso y la política de privacidad
                        </span>
                    </label>
                    {errors.acceptTerms && (
                        <p className="text-destructive text-[12px]">{errors.acceptTerms.message}</p>
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
                            Crear mi institución
                            <ArrowRight className="size-4" />
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}
