import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailData {
  email: string;
  name: string;
  confirmationUrl: string;
}

serve(async (req: Request): Promise<Response> => {
  console.log('Email function started');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const { email, name, confirmationUrl }: EmailData = await req.json();
    console.log('Sending email to:', email);

    const host = Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com';
    const port = parseInt(Deno.env.get('SMTP_PORT') || '465');
    const user = Deno.env.get('SMTP_USER') || '';
    const pass = Deno.env.get('SMTP_PASSWORD') || '';

    console.log('SMTP Settings:', { host, port, user, hasPass: !!pass });

    if (!user || !pass) {
      throw new Error('SMTP credentials missing');
    }

    const client = new SMTPClient({
      connection: {
        hostname: host,
        port: port,
        tls: true,
        auth: {
          username: user,
          password: pass,
        },
      },
    });

    const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Confirmación de registro</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 64px; height: 64px; background-color: #007bff; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
                    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
                    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
                    <path d="M10 6h4"/>
                    <path d="M10 10h4"/>
                    <path d="M10 14h4"/>
                    <path d="M10 18h4"/>
                </svg>
            </div>
            <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: bold;">Maktub</h1>
            <p style="color: #666; margin: 8px 0 0 0; font-size: 16px;">Gestión Digital de Contratos</p>
        </div>

        <h2 style="color: #333; text-align: center; margin-bottom: 20px;">¡Confirma tu cuenta!</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">Hola <strong>${name}</strong>,</p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Gracias por registrarte en nuestro Sistema de Gestión Digital de Contratos. 
            Para completar tu registro, necesitas confirmar tu dirección de correo electrónico.
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
            <a href="${confirmationUrl}" 
               style="background-color: #007bff; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                Confirmar mi cuenta
            </a>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
                <strong>¿No puedes hacer clic en el botón?</strong>
            </p>
            <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
                Copia y pega este enlace en tu navegador:
            </p>
            <p style="color: #007bff; word-break: break-all; font-size: 14px; margin: 0; background-color: white; padding: 10px; border-radius: 4px;">
                ${confirmationUrl}
            </p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 30px; margin-top: 40px;">
            <p style="color: #999; font-size: 14px; text-align: center; margin: 0;">
                <strong>Sistema de Gestión Digital de Contratos</strong><br>
                Versión 1.0 | Correo automático
            </p>
            <p style="color: #999; font-size: 12px; text-align: center; margin: 16px 0 0 0;">
                Si no te registraste, puedes ignorar este correo.
            </p>
        </div>
    </div>
</body>
</html>`;

    await client.send({
      from: `Sistema Maktub <${user}>`,
      to: email,
      subject: "Confirmación de registro - Sistema Maktub",
      content: htmlEmail,
      html: htmlEmail,
    });

    await client.close();
    console.log('Email sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Email enviado' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers },
      }
    );

  } catch (error: any) {
    console.error('Email error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...headers },
      }
    );
  }
});