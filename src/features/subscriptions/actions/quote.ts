'use server';

import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { sendEmail } from '@/shared/lib/email';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';

const quoteSchema = z.object({
    name: z.string().min(2, 'Ingresá tu nombre').max(120),
    email: z.string().email('Email inválido'),
    institution: z.string().min(2, 'Ingresá el nombre de la institución').max(160),
    phone: z.string().max(40).optional().or(z.literal('')),
    message: z.string().max(1000).optional().or(z.literal('')),
});

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildQuoteEmail(data: {
    name: string;
    email: string;
    institution: string;
    phone: string;
    message: string;
}): string {
    const fields: [string, string][] = [
        ['Nombre', data.name],
        ['Email', data.email],
        ['Institución', data.institution],
        ['Teléfono', data.phone || '—'],
        ['Mensaje', data.message || '—'],
    ];
    const rows = fields
        .map(
            ([label, value]) =>
                `<tr><td style="padding:8px;background:#f4f4f5;border-radius:6px 0 0 6px;font-weight:600;width:30%;vertical-align:top;">${label}</td><td style="padding:8px;background:#f4f4f5;border-radius:0 6px 6px 0;">${escapeHtml(value)}</td></tr><tr><td colspan="2" style="height:4px;"></td></tr>`,
        )
        .join('');

    return `
<!DOCTYPE html>
<html lang="es">
<body style="font-family: sans-serif; color: #111; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="margin-bottom: 4px;">Nueva solicitud de cotización · Plan Institucional</h2>
  <p style="color: #555; margin-top: 0;">Un interesado solicitó una cotización del plan Institucional desde Aulika.</p>
  <table style="width:100%; border-collapse:collapse; margin: 24px 0;">${rows}</table>
  <p style="color:#555; font-size:13px;">Respondé directamente al email del solicitante para continuar el contacto.</p>
</body>
</html>`;
}

/**
 * Envía al SuperAdministrador una solicitud de cotización del plan Institucional.
 * Pública (se usa desde la web y desde el dashboard); no requiere sesión.
 */
export async function requestInstitutionalQuote(data: unknown): Promise<ActionResult> {
    try {
        const parsed = quoteSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

        const { name, email, institution, phone, message } = parsed.data;

        const superAdmin = await prisma.user.findFirst({
            where: { userRole: { name: USER_ROLE.SUPER_ADMIN } },
            select: { email: true, name: true },
        });
        if (!superAdmin?.email) {
            return fail('No se pudo procesar la solicitud en este momento. Intentá más tarde.');
        }

        const result = await sendEmail({
            to: superAdmin.email,
            toName: superAdmin.name ?? 'Aulika',
            subject: `Solicitud de cotización · Plan Institucional — ${institution}`,
            htmlContent: buildQuoteEmail({
                name,
                email,
                institution,
                phone: phone ?? '',
                message: message ?? '',
            }),
        });
        if (!result.sent) {
            return fail(result.error ?? 'No se pudo enviar la solicitud. Intentá más tarde.');
        }

        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'No se pudo enviar la solicitud. Intentá más tarde.'));
    }
}
