export const APP_CONFIG_KEY = {
    BREVO_API_KEY: 'BREVO_API_KEY',
    BREVO_SENDER_EMAIL: 'BREVO_SENDER_EMAIL',
    BREVO_SENDER_NAME: 'BREVO_SENDER_NAME',
} as const;

export type AppConfigKey = (typeof APP_CONFIG_KEY)[keyof typeof APP_CONFIG_KEY];
