'use client';

import { saveAppConfig } from '@/features/config/actions/app-config';
import { APP_CONFIG_KEY, type AppConfigKey } from '@/features/config/lib/app-config-keys';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Loader2, Save } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

interface Props {
    config: Record<AppConfigKey, string>;
}

function SettingField({
    label,
    description,
    configKey,
    value,
    type,
}: {
    label: string;
    description: string;
    configKey: AppConfigKey;
    value: string;
    type?: string;
}) {
    const [fieldValue, setFieldValue] = useState(value);
    const [isPending, startTransition] = useTransition();

    function handleSave(): void {
        startTransition(async () => {
            const result = await saveAppConfig(configKey, fieldValue);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Configuración guardada');
            }
        });
    }

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={configKey} className="text-ink text-[13px] font-bold">
                {label}
            </label>
            <p className="text-mute text-sm">{description}</p>
            <div className="flex gap-2">
                <Input
                    id={configKey}
                    type={type ?? 'text'}
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                    className="border-border h-11 max-w-md rounded-[10px] bg-white font-mono text-sm"
                    placeholder={label}
                />
                <Button
                    variant="ink"
                    size="md"
                    onClick={handleSave}
                    disabled={isPending || fieldValue === value}
                >
                    {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    Guardar
                </Button>
            </div>
        </div>
    );
}

export function AppSettingsClient({ config }: Props) {
    return (
        <main className="flex-1 p-8">
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Brevo — Envío de emails</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        <SettingField
                            label="API Key"
                            description="Clave de API de Brevo para el envío de emails transaccionales."
                            configKey={APP_CONFIG_KEY.BREVO_API_KEY}
                            value={config[APP_CONFIG_KEY.BREVO_API_KEY]}
                            type="password"
                        />
                        <SettingField
                            label="Email del remitente"
                            description="Dirección de email que aparece como remitente en los emails enviados."
                            configKey={APP_CONFIG_KEY.BREVO_SENDER_EMAIL}
                            value={config[APP_CONFIG_KEY.BREVO_SENDER_EMAIL]}
                            type="email"
                        />
                        <SettingField
                            label="Nombre del remitente"
                            description='Nombre que aparece en el campo "De:" de los emails enviados.'
                            configKey={APP_CONFIG_KEY.BREVO_SENDER_NAME}
                            value={config[APP_CONFIG_KEY.BREVO_SENDER_NAME]}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">SEO Global & IA</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        <SettingField
                            label="Título Global"
                            description="Título base de la plataforma para buscadores e IAs."
                            configKey={APP_CONFIG_KEY.SEO_GLOBAL_TITLE}
                            value={config[APP_CONFIG_KEY.SEO_GLOBAL_TITLE]}
                        />
                        <SettingField
                            label="Descripción Global"
                            description="Descripción por defecto de la plataforma (máx. 160 caracteres)."
                            configKey={APP_CONFIG_KEY.SEO_GLOBAL_DESCRIPTION}
                            value={config[APP_CONFIG_KEY.SEO_GLOBAL_DESCRIPTION]}
                        />
                        <SettingField
                            label="Palabras Clave"
                            description="Palabras clave globales separadas por comas."
                            configKey={APP_CONFIG_KEY.SEO_GLOBAL_KEYWORDS}
                            value={config[APP_CONFIG_KEY.SEO_GLOBAL_KEYWORDS]}
                        />
                        <SettingField
                            label="Imagen OpenGraph (URL)"
                            description="URL de la imagen que aparece al compartir el sitio en redes sociales."
                            configKey={APP_CONFIG_KEY.SEO_GLOBAL_OG_IMAGE}
                            value={config[APP_CONFIG_KEY.SEO_GLOBAL_OG_IMAGE]}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Cloudinary — Almacenamiento de certificados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        <SettingField
                            label="Cloud Name"
                            description="Nombre de la nube de Cloudinary (Dashboard → Account Details)."
                            configKey={APP_CONFIG_KEY.CLOUDINARY_CLOUD_NAME}
                            value={config[APP_CONFIG_KEY.CLOUDINARY_CLOUD_NAME]}
                        />
                        <SettingField
                            label="API Key"
                            description="Clave pública de la API de Cloudinary."
                            configKey={APP_CONFIG_KEY.CLOUDINARY_API_KEY}
                            value={config[APP_CONFIG_KEY.CLOUDINARY_API_KEY]}
                            type="password"
                        />
                        <SettingField
                            label="API Secret"
                            description="Secreto de la API de Cloudinary. Se usa para firmar uploads de PDFs."
                            configKey={APP_CONFIG_KEY.CLOUDINARY_API_SECRET}
                            value={config[APP_CONFIG_KEY.CLOUDINARY_API_SECRET]}
                            type="password"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Daily.co — Aulas sincrónicas</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        <SettingField
                            label="API Key"
                            description="Clave de Daily.co (Dashboard → Developers → API keys)."
                            configKey={APP_CONFIG_KEY.DAILY_API_KEY}
                            value={config[APP_CONFIG_KEY.DAILY_API_KEY]}
                            type="password"
                        />
                        <SettingField
                            label="Webhook Signing Secret"
                            description="Secreto para validar la firma HMAC de webhooks (Dashboard → Webhooks)."
                            configKey={APP_CONFIG_KEY.DAILY_WEBHOOK_SECRET}
                            value={config[APP_CONFIG_KEY.DAILY_WEBHOOK_SECRET]}
                            type="password"
                        />
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
