import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApprovalNotification {
  employeeEmail: string;
  employeeName: string;
  accountNumber: string;
  contractNumber: string;
  billingMonth: string;
  supervisorName: string;
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
    }: ApprovalNotification = await req.json();

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

    const htmlEmail = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Cuenta de Cobro Aprobada</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 64px; height: 64px; background-color: #16a34a; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
      <h1 style="color: #333; margin: 0; font-size: 24px; font-weight: bold;">¡Cuenta de Cobro Aprobada!</h1>
    </div>

    <p style="color: #666; font-size: 16px; line-height: 1.5;">Hola <strong>${employeeName}</strong>,</p>

    <p style="color: #666; font-size: 16px; line-height: 1.5;">
      Tu cuenta de cobro <strong>${accountNumber}</strong> del contrato <strong>${contractNumber}</strong>
      correspondiente al período <strong>${billingMonth}</strong> ha sido
      <span style="color: #16a34a; font-weight: bold;">aprobada</span>
      por el supervisor <strong>${supervisorName}</strong>.
    </p>

    <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 4px; margin: 24px 0;">
      <p style="color: #166534; font-weight: bold; margin: 0 0 8px 0; font-size: 14px;">✅ Estado: Aprobada</p>
      <p style="color: #15803d; font-size: 14px; margin: 0;">
        Tu cuenta ha sido aprobada y pasará al proceso de pago por parte de Tesorería.
      </p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #e5e7eb; border-radius: 8px;">
      <tbody>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280; font-size: 13px; width: 40%;">Cuenta de Cobro</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">${accountNumber}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280; font-size: 13px;">Contrato</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">${contractNumber}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280; font-size: 13px;">Período</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">${billingMonth}</td>
        </tr>
        <tr>
          <td style="padding: 12px; font-weight: 600; color: #6b7280; font-size: 13px;">Aprobado por</td>
          <td style="padding: 12px; color: #374151; font-size: 14px;">${supervisorName}</td>
        </tr>
      </tbody>
    </table>

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
      subject: `Cuenta de Cobro ${accountNumber} - Aprobada ✅`,
      content: htmlEmail,
      html: htmlEmail,
    });

    await client.close();
    console.log('Approval notification sent to:', employeeEmail);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  } catch (error: any) {
    console.error('Error sending approval notification:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  }
});
