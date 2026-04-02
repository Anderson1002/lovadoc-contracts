import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RejectionNotification {
  employeeEmail: string;
  employeeName: string;
  accountNumber: string;
  contractNumber: string;
  billingMonth: string;
  supervisorName: string;
  observations: Array<{ documentType: string; comment: string }>;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const {
      employeeEmail,
      employeeName,
      accountNumber,
      contractNumber,
      billingMonth,
      supervisorName,
      observations,
    }: RejectionNotification = await req.json();

    if (!employeeEmail || !accountNumber) {
      throw new Error('Missing required fields: employeeEmail, accountNumber');
    }

    const host = Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com';
    const port = parseInt(Deno.env.get('SMTP_PORT') || '465');
    const user = Deno.env.get('SMTP_USER') || '';
    const pass = Deno.env.get('SMTP_PASSWORD') || '';

    if (!user || !pass) {
      throw new Error('SMTP credentials missing');
    }

    const documentLabels: Record<string, { label: string; color: string }> = {
      'informe': { label: 'Informe de Actividades', color: '#3b82f6' },
      'certificacion': { label: 'Certificación', color: '#8b5cf6' },
      'cuenta_cobro': { label: 'Cuenta de Cobro', color: '#f59e0b' },
    };

    const observationsHtml = (observations || [])
      .filter(o => o.documentType && o.comment)
      .map(o => {
        const doc = documentLabels[o.documentType] || { label: o.documentType, color: '#6b7280' };
        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
              <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; color: white; background-color: ${doc.color};">
                ${doc.label}
              </span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; line-height: 1.5;">
              ${o.comment}
            </td>
          </tr>`;
      })
      .join('');

    const htmlEmail = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Cuenta de Cobro Devuelta</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 64px; height: 64px; background-color: #dc2626; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h1 style="color: #333; margin: 0; font-size: 24px; font-weight: bold;">Cuenta de Cobro Devuelta</h1>
    </div>

    <p style="color: #666; font-size: 16px; line-height: 1.5;">Hola <strong>${employeeName}</strong>,</p>

    <p style="color: #666; font-size: 16px; line-height: 1.5;">
      Tu cuenta de cobro <strong>${accountNumber}</strong> del contrato <strong>${contractNumber}</strong>
      correspondiente al período <strong>${billingMonth}</strong> ha sido <span style="color: #dc2626; font-weight: bold;">devuelta</span>
      por el supervisor <strong>${supervisorName}</strong>.
    </p>

    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px; margin: 24px 0;">
      <p style="color: #991b1b; font-weight: bold; margin: 0 0 8px 0; font-size: 14px;">⚠️ Observaciones del Supervisor</p>
      <p style="color: #7f1d1d; font-size: 14px; margin: 0;">
        Por favor revisa las siguientes observaciones y realiza las correcciones necesarias.
      </p>
    </div>

    ${observationsHtml ? `
    <table style="width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #e5e7eb; border-radius: 8px;">
      <thead>
        <tr style="background-color: #f9fafb;">
          <th style="padding: 12px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Documento</th>
          <th style="padding: 12px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Observación</th>
        </tr>
      </thead>
      <tbody>
        ${observationsHtml}
      </tbody>
    </table>` : ''}

    <div style="text-align: center; margin: 32px 0;">
      <p style="color: #666; font-size: 14px;">
        Ingresa al sistema para corregir y reenviar tu cuenta de cobro.
      </p>
    </div>

    <div style="border-top: 1px solid #eee; padding-top: 24px; margin-top: 32px;">
      <p style="color: #999; font-size: 14px; text-align: center; margin: 0;">
        <strong>Sistema Maktub</strong> - Gestión Digital de Contratos<br>
        <span style="font-size: 12px;">Este es un correo automático, no responda a este mensaje.</span>
      </p>
    </div>
  </div>
</body>
</html>`;

    const client = new SMTPClient({
      connection: {
        hostname: host,
        port: port,
        tls: true,
        auth: { username: user, password: pass },
      },
    });

    await client.send({
      from: `Sistema Maktub <${user}>`,
      to: employeeEmail,
      subject: `Cuenta de Cobro ${accountNumber} - Devuelta por el Supervisor`,
      content: htmlEmail,
      html: htmlEmail,
    });

    await client.close();
    console.log('Rejection notification sent to:', employeeEmail);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  } catch (error: any) {
    console.error('Error sending rejection notification:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  }
});
