'use client';

import { updateInstitutionSettings } from '@/features/institutions/actions/settings';
import {
    institutionSettingsSchema,
    type InstitutionSettingsInput,
} from '@/features/institutions/schemas/institution.schemas';
import type { InstitutionSettings } from '@/features/institutions/actions/queries';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Tag } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Globe, Lock, Mail, MapPin, Phone, Save, Search } from 'lucide-react';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface Props {
    institution: InstitutionSettings;
    slug: string;
}

interface FieldProps {
    id: string;
    label: string;
    error?: string;
    children: React.ReactNode;
    hint?: string;
}

function Field({ id, label, error, children, hint }: FieldProps): React.JSX.Element {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-[13px] font-bold text-ink">
                {label}
            </label>
            {children}
            {hint && !error && <p className="text-[11.5px] text-mute">{hint}</p>}
            {error && <p className="text-[11.5px] font-medium text-destructive">{error}</p>}
        </div>
    );
}

export function InstitutionSettingsClient({ institution, slug }: Props): React.JSX.Element {
    const [isPending, startTransition] = useTransition();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isDirty },
    } = useForm<InstitutionSettingsInput>({
        resolver: zodResolver(institutionSettingsSchema),
        defaultValues: {
            name: institution.name,
            phone: institution.phone,
            address: institution.address,
            city: institution.city,
            campus: institution.campus ?? '',
            country: institution.country,
            email: institution.email ?? '',
            seoTitle: institution.seoTitle ?? '',
            seoDescription: institution.seoDescription ?? '',
            seoKeywords: institution.seoKeywords ?? [],
        },
    });

    function onSubmit(data: InstitutionSettingsInput): void {
        startTransition(async () => {
            const result = await updateInstitutionSettings(slug, data);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Configuración guardada');
        });
    }

    return (
        <div className="flex flex-col min-h-screen bg-paper">
            <AdminTopBar
                breadcrumb={[slug, 'Ajustes']}
                title="Ajustes del Instituto"
                subtitle="Actualizá los datos del instituto. El identificador de URL no puede modificarse."
                actions={
                    <Button
                        variant="ink"
                        size="md"
                        onClick={() => void handleSubmit(onSubmit)()}
                        disabled={isPending || !isDirty}
                        className="gap-2"
                    >
                        <Save size={15} />
                        {isPending ? 'Guardando…' : 'Guardar cambios'}
                    </Button>
                }
            />

            <main className="flex-1 p-8">
                <div className="mx-auto max-w-2xl space-y-6">

                    {/* URL identifier — read only */}
                    <Card className="flex items-center gap-4 border-border bg-paper-warm/40 px-6 py-4 shadow-none">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-white border border-border shadow-sm">
                            <Lock size={16} className="text-mute" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-mute uppercase tracking-wider">
                                Identificador de URL (no editable)
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                                <Tag tone="outline" className="font-mono text-[12px] h-6 border-border bg-white">
                                    /{slug}
                                </Tag>
                                <span className="text-[12px] text-mute">
                                    — modificarlo requiere contactar al SuperAdministrador
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Institution data */}
                    <Card className="p-0 border-border shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 border-b border-border bg-white px-6 py-4">
                            <Building2 size={16} className="text-primary" />
                            <h2 className="text-[14px] font-bold text-ink">Datos del instituto</h2>
                        </div>
                        <form
                            onSubmit={(e) => void handleSubmit(onSubmit)(e)}
                            className="flex flex-col gap-5 px-6 py-6"
                        >
                            <Field id="name" label="Nombre oficial" error={errors.name?.message}>
                                <Input
                                    id="name"
                                    {...register('name')}
                                    className={cn('h-11 rounded-[10px] border-border bg-white', errors.name && 'border-destructive')}
                                />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field id="phone" label="Teléfono" error={errors.phone?.message}>
                                    <div className="relative">
                                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
                                        <Input
                                            id="phone"
                                            {...register('phone')}
                                            className={cn('h-11 rounded-[10px] border-border bg-white pl-9', errors.phone && 'border-destructive')}
                                        />
                                    </div>
                                </Field>
                                <Field id="campus" label="Campus / Sede" error={errors.campus?.message}>
                                    <Input
                                        id="campus"
                                        {...register('campus')}
                                        placeholder="Opcional"
                                        className="h-11 rounded-[10px] border-border bg-white"
                                    />
                                </Field>
                            </div>

                            <Field id="address" label="Dirección" error={errors.address?.message}>
                                <div className="relative">
                                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
                                    <Input
                                        id="address"
                                        {...register('address')}
                                        className={cn('h-11 rounded-[10px] border-border bg-white pl-9', errors.address && 'border-destructive')}
                                    />
                                </div>
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field id="city" label="Ciudad" error={errors.city?.message}>
                                    <Input
                                        id="city"
                                        {...register('city')}
                                        className={cn('h-11 rounded-[10px] border-border bg-white', errors.city && 'border-destructive')}
                                    />
                                </Field>
                                <Field id="country" label="País" error={errors.country?.message}>
                                    <div className="relative">
                                        <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
                                        <Input
                                            id="country"
                                            {...register('country')}
                                            className={cn('h-11 rounded-[10px] border-border bg-white pl-9', errors.country && 'border-destructive')}
                                        />
                                    </div>
                                </Field>
                            </div>
                        </form>
                    </Card>

                    {/* Email notifications */}
                    <Card className="p-0 border-border shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 border-b border-border bg-white px-6 py-4">
                            <Mail size={16} className="text-primary" />
                            <h2 className="text-[14px] font-bold text-ink">Notificaciones por email</h2>
                        </div>
                        <div className="flex flex-col gap-5 px-6 py-6">
                            <Field
                                id="email"
                                label="Email del instituto"
                                error={errors.email?.message}
                                hint="Los alumnos recibirán su resultado en este correo al completar un examen."
                            >
                                <div className="relative">
                                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
                                    <Input
                                        id="email"
                                        type="email"
                                        {...register('email')}
                                        placeholder="contacto@instituto.cl"
                                        className={cn('h-11 rounded-[10px] border-border bg-white pl-9', errors.email && 'border-destructive')}
                                    />
                                </div>
                            </Field>

                            <div className="rounded-[12px] border border-border bg-paper-warm/40 px-4 py-3">
                                <p className="text-[12px] text-mute leading-relaxed">
                                    Si dejás este campo vacío, no se enviarán notificaciones por email al finalizar los exámenes. El campo es opcional.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* SEO & AI Settings */}
                    <Card className="p-0 border-border shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 border-b border-border bg-white px-6 py-4">
                            <Search size={16} className="text-primary" />
                            <h2 className="text-[14px] font-bold text-ink">Optimización SEO & IA</h2>
                        </div>
                        <div className="flex flex-col gap-5 px-6 py-6">
                            <p className="text-[12px] text-mute mb-2 leading-relaxed">
                                Personalizá cómo aparece tu institución en Google y asistentes de IA (ChatGPT, Perplexity). 
                                Esto ayuda a que los alumnos encuentren tus exámenes más fácilmente.
                            </p>

                            <Field 
                                id="seoTitle" 
                                label="Título SEO" 
                                error={errors.seoTitle?.message}
                                hint="Título que aparecerá en la pestaña del navegador y resultados de búsqueda."
                            >
                                <Input
                                    id="seoTitle"
                                    {...register('seoTitle')}
                                    placeholder={`${institution.name} | Aulika`}
                                    className={cn('h-11 rounded-[10px] border-border bg-white', errors.seoTitle && 'border-destructive')}
                                />
                            </Field>

                            <Field 
                                id="seoDescription" 
                                label="Descripción SEO" 
                                error={errors.seoDescription?.message}
                                hint="Resumen corto que aparece bajo el título en buscadores (máx. 160 caracteres)."
                            >
                                <Input
                                    id="seoDescription"
                                    {...register('seoDescription')}
                                    placeholder="Plataforma de exámenes oficial de nuestra institución..."
                                    className={cn('h-11 rounded-[10px] border-border bg-white', errors.seoDescription && 'border-destructive')}
                                />
                            </Field>

                            <Field 
                                id="seoKeywords" 
                                label="Palabras clave (separadas por comas)" 
                                error={errors.seoKeywords?.message}
                                hint="Ejemplo: PAES, Exámenes, Matemáticas, Ensayo online"
                            >
                                <Input
                                    id="seoKeywords"
                                    defaultValue={institution.seoKeywords?.join(', ') || ''}
                                    onChange={(e) => {
                                        const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                        setValue('seoKeywords', val, { shouldDirty: true });
                                    }}
                                    className={cn('h-11 rounded-[10px] border-border bg-white', errors.seoKeywords && 'border-destructive')}
                                />
                            </Field>
                        </div>
                    </Card>

                    {/* Save button (bottom) */}
                    <div className="flex justify-end pb-4">
                        <Button
                            variant="ink"
                            size="md"
                            onClick={() => void handleSubmit(onSubmit)()}
                            disabled={isPending || !isDirty}
                            className="gap-2 min-w-[160px]"
                        >
                            <Save size={15} />
                            {isPending ? 'Guardando…' : 'Guardar cambios'}
                        </Button>
                    </div>

                </div>
            </main>
        </div>
    );
}
