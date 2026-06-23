import { getAppConfig } from '@/features/config/actions/app-config';
import { AppSettingsClient } from '@/features/config/components/AppSettingsClient';

export default async function SettingsPage() {
    const config = await getAppConfig();
    return <AppSettingsClient config={config} />;
}
