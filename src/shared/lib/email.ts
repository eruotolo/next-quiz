import { BrevoClient } from '@getbrevo/brevo';
import { prisma } from '@/shared/lib/prisma';
import { APP_CONFIG_KEY } from '@/features/config/lib/app-config-keys';

interface SendEmailParams {
    to: string;
    toName: string;
    subject: string;
    htmlContent: string;
}

async function getBrevoConfig(): Promise<{
    apiKey: string;
    senderEmail: string;
    senderName: string;
} | null> {
    const configs = await prisma.appConfig.findMany({
        where: {
            key: {
                in: [
                    APP_CONFIG_KEY.BREVO_API_KEY,
                    APP_CONFIG_KEY.BREVO_SENDER_EMAIL,
                    APP_CONFIG_KEY.BREVO_SENDER_NAME,
                ],
            },
        },
        select: { key: true, value: true },
    });

    const map = Object.fromEntries(configs.map((c) => [c.key, c.value]));
    const apiKey = map[APP_CONFIG_KEY.BREVO_API_KEY];
    const senderEmail = map[APP_CONFIG_KEY.BREVO_SENDER_EMAIL];
    const senderName = map[APP_CONFIG_KEY.BREVO_SENDER_NAME] ?? 'Aulika';

    if (!apiKey || !senderEmail) return null;
    return { apiKey, senderEmail, senderName };
}

export async function sendEmail(
    params: SendEmailParams,
): Promise<{ sent: boolean; error?: string }> {
    try {
        const config = await getBrevoConfig();
        if (!config) {
            return {
                sent: false,
                error: 'Configurá la API de Brevo en Configuración antes de enviar emails.',
            };
        }

        const client = new BrevoClient({ apiKey: config.apiKey });

        await client.transactionalEmails.sendTransacEmail({
            subject: params.subject,
            htmlContent: params.htmlContent,
            sender: { name: config.senderName, email: config.senderEmail },
            to: [{ email: params.to, name: params.toName }],
        });

        return { sent: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al enviar el email.';
        console.error('[Brevo] sendEmail failed:', message);
        return { sent: false, error: message };
    }
}

export function buildAdminWelcomeEmail(name: string, email: string, password: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<body style="font-family: sans-serif; color: #111; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="margin-bottom: 4px;">Bienvenido/a a Aulika, ${name}</h2>
  <p style="color: #555; margin-top: 0;">Tu cuenta de Administrador ha sido creada.</p>
  <table style="width:100%; border-collapse:collapse; margin: 24px 0;">
    <tr>
      <td style="padding: 8px; background:#f4f4f5; border-radius:6px 0 0 6px; font-weight:600; width:40%;">Email</td>
      <td style="padding: 8px; background:#f4f4f5; border-radius:0 6px 6px 0;">${email}</td>
    </tr>
    <tr><td colspan="2" style="height:4px;"></td></tr>
    <tr>
      <td style="padding: 8px; background:#f4f4f5; border-radius:6px 0 0 6px; font-weight:600;">Contraseña</td>
      <td style="padding: 8px; background:#f4f4f5; border-radius:0 6px 6px 0; font-family:monospace;">${password}</td>
    </tr>
  </table>
  <p style="color:#555; font-size:13px;">Por seguridad, cambiá tu contraseña después de iniciar sesión por primera vez.</p>
</body>
</html>`;
}
