import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubmissionNotification {
  accountNumber: string;
  contractNumber: string;
  billingMonth: string;
  employeeName: string;
  employeeEmail: string;
  amount: number;
  contractId: string;
  isResubmission: boolean;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const {
      accountNumber,
      contractNumber,
      billingMonth,
      employeeName,
      employeeEmail,
      amount,
      contractId,
      isResubmission,
    }: SubmissionNotification = await req.json();

    if (!accountNumber || !contractId) {
      throw new Error('Missing required fields');
    }

    // Find the supervisor for this contract
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: contract } = await supabase
      .from('contracts')
      .select('supervisor_id')
      .eq('id', contractId)
      .single();

    if (!contract?.supervisor_id) {
      console.log('No supervisor assigned to contract, skipping notification');
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    // Get supervisor profile (supervisor_id references profiles.user_id)
    const { data: supervisor } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('user_id', contract.supervisor_id)
      .single();

    if (!supervisor?.email) {
      console.log('Supervisor has no email, skipping notification');
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }

    const host = Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com';
    const port = parseInt(Deno.env.get('SMTP_PORT') || '465');
    const user = Deno.env.get('SMTP_USER') || '';
    const pass = Deno.env.get('SMTP_PASSWORD') || '';

    if (!user || !pass) {
      throw new Error('SMTP credentials missing');
    }

    const formattedAmount = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount || 0);

    const resubmissionBadge = isResubmission
      ? `<span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; color: #92400e; background-color: #fef3c7; margin-left: 8px;">Re-envío</span>`
      : '';

    const headerColor = isResubmission ? '#f59e0b' : '#007bff';
    const title = isResubmission
      ? 'Cuenta de Cobro Re-enviada para Revisión'
      : 'Nueva Cuenta de Cobro para Revisión';

    const htmlEmail = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${title}</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 64px; height: 64px; background-color: ${headerColor}; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M22 2L11 13"/>
          <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
        </svg>
      </div>
      <h1 style="color: #333; margin: 0; font-size: 24px; font-weight: bold;">${title}</h1>
    </div>

    <p style="color: #666; font-size: 16px; line-height: 1.5;">Hola <strong>${supervisor.name || 'Supervisor'}</strong>,</p>

    <p style="color: #666; font-size: 16px; line-height: 1.5;">
      El contratista <strong>${employeeName}</strong> (${employeeEmail}) ha
      ${isResubmission ? 're-enviado' : 'enviado'} la cuenta de cobro
      <strong>${accountNumber}</strong>${resubmissionBadge} para su revisión.
    </p>

    ${isResubmission ? `
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 24px 0;">
      <p style="color: #92400e; font-weight: bold; margin: 0 0 8px 0; font-size: 14px;">🔄 Re-envío tras corrección</p>
      <p style="color: #78350f; font-size: 14px; margin: 0;">
        Esta cuenta fue devuelta anteriormente y el contratista ha realizado las correcciones solicitadas.
      </p>
    </div>` : ''}

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
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280; font-size: 13px;">Contratista</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">${employeeName}</td>
        </tr>
        <tr>
          <td style="padding: 12px; font-weight: 600; color: #6b7280; font-size: 13px;">Valor</td>
          <td style="padding: 12px; color: #374151; font-size: 14px; font-weight: bold;">${formattedAmount}</td>
        </tr>
      </tbody>
    </table>

    <div style="text-align: center; margin: 32px 0;">
      <p style="color: #666; font-size: 14px;">
        Ingresa al sistema para revisar esta cuenta de cobro.
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

    const subjectPrefix = isResubmission ? '🔄 Re-envío' : '📩 Nueva';
    await client.send({
      from: `Sistema Maktub <${user}>`,
      to: supervisor.email,
      subject: `${subjectPrefix} - Cuenta de Cobro ${accountNumber} pendiente de revisión`,
      content: htmlEmail,
      html: htmlEmail,
    });

    await client.close();
    console.log('Submission notification sent to supervisor:', supervisor.email);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  } catch (error: any) {
    console.error('Error sending submission notification:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  }
});
