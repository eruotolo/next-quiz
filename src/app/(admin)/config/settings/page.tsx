import { getAppConfig } from '@/features/config/actions/app-config';
import { AppSettingsClient } from '@/features/config/components/AppSettingsClient';
import type React from 'react';

export default async function SettingsPage(): Promise<React.JSX.Element> {
    const config = await getAppConfig();
    return <AppSettingsClient config={config} />;
}
