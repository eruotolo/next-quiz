'use client';

import { saveAppConfig } from '@/features/config/actions/app-config';
import { APP_CONFIG_KEY, type AppConfigKey } from '@/features/config/lib/app-config-keys';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import type React from 'react';
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
}): React.JSX.Element {
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
            <Label htmlFor={configKey}>{label}</Label>
            <p className="text-sm text-muted-foreground">{description}</p>
            <div className="flex gap-2">
                <Input
                    id={configKey}
                    type={type ?? 'text'}
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                    className="max-w-md font-mono text-sm"
                    placeholder={label}
                />
                <Button
                    variant="outline"
                    size="sm"
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

export function AppSettingsClient({ config }: Props): React.JSX.Element {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold">Configuración</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Ajustes globales de la plataforma.
                </p>
            </div>

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

            <Card className="opacity-60">
                <CardHeader>
                    <CardTitle className="text-base">Inteligencia Artificial (próximamente)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Aquí se configurará la API key del proveedor de IA para funciones futuras de la plataforma.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
