import { getAppConfig } from '@/features/config/actions/app-config';
import { AppSettingsClient } from '@/features/config/components/AppSettingsClient';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { Settings } from 'lucide-react';

export default async function SettingsPage() {
    const config = await getAppConfig();
    return (
        <>
            <AdminTopBar
                title="Configuración"
                breadcrumb={['Sistema', 'Configuración']}
                subtitle="Ajustes globales de la plataforma."
                icon={<Settings size={18} />}
            />
            <AppSettingsClient config={config} />
        </>
    );
}
